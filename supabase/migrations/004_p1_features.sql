-- =============================================================================
-- Migration 004: P1 Feature Support
-- Adds: shift_location_logs table, KYC document storage RLS policies
-- =============================================================================

-- ─── shift_location_logs ─────────────────────────────────────────────────────
-- Stores GPS pings emitted by a worker's device during active shifts
-- (from QR check-in → QR check-out). Interval: every 5 min or 100 m.
CREATE TABLE shift_location_logs (
  id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid             NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  worker_id      uuid             NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  latitude       double precision NOT NULL,
  longitude      double precision NOT NULL,
  logged_at      timestamptz      NOT NULL DEFAULT now()
);

-- Primary access pattern: latest ping for a specific application
CREATE INDEX idx_loc_logs_app    ON shift_location_logs (application_id, logged_at DESC);
-- Secondary: all pings from a specific worker
CREATE INDEX idx_loc_logs_worker ON shift_location_logs (worker_id, logged_at DESC);

ALTER TABLE shift_location_logs ENABLE ROW LEVEL SECURITY;

-- Workers can write and read their own location pings
CREATE POLICY "loc_logs_worker_insert" ON shift_location_logs
  FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "loc_logs_worker_select" ON shift_location_logs
  FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

-- Business owners can read location logs for applications on their own shifts
CREATE POLICY "loc_logs_business_select" ON shift_location_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   applications a
      JOIN   shifts      s ON s.id = a.shift_id
      JOIN   businesses  b ON b.id = s.business_id
      WHERE  a.id       = shift_location_logs.application_id
        AND  b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- KYC Document Storage Policies
--
-- IMPORTANT: The 'kyc-documents' bucket must be created manually:
--   Supabase Dashboard → Storage → New bucket
--   Name: kyc-documents  |  Make public: OFF  |  File size limit: 5 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Workers upload into: kyc-documents/{user_id}/front.jpg
--                  and kyc-documents/{user_id}/back.jpg
-- =============================================================================

CREATE POLICY "kyc_worker_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "kyc_worker_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow re-uploads (idempotent — worker can correct rejected documents)
CREATE POLICY "kyc_worker_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
