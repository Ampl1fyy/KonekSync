-- =============================================================================
-- Migration 005: P2 Feature Support
-- Adds: messages table (in-app chat), certifications table (skill certs)
-- =============================================================================

-- ─── messages ─────────────────────────────────────────────────────────────────
-- One thread per application. Both the worker and the business owner of the
-- shift can participate. Messages are ordered by created_at ASC in the UI.
CREATE TABLE messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id      uuid        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  body           text        NOT NULL
                             CHECK (length(trim(body)) > 0 AND length(body) <= 1000),
  is_read        boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Primary access pattern: all messages in a thread, oldest first
CREATE INDEX idx_messages_thread ON messages (application_id, created_at ASC);
-- Secondary: unread messages by sender (for badge counts)
CREATE INDEX idx_messages_unread ON messages (application_id, is_read)
  WHERE is_read = false;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- A participant is: the worker on the application OR the owner of the shift's business
CREATE POLICY "messages_participant_select" ON messages
  FOR SELECT TO authenticated
  USING (
    -- The sender themselves
    sender_id = auth.uid()
    -- Or the worker on this application
    OR EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = messages.application_id AND a.worker_id = auth.uid()
    )
    -- Or the business owner of the shift
    OR EXISTS (
      SELECT 1
      FROM   applications a
      JOIN   shifts       s ON s.id = a.shift_id
      JOIN   businesses   b ON b.id = s.business_id
      WHERE  a.id = messages.application_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "messages_participant_insert" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- Worker on this application
      EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = messages.application_id AND a.worker_id = auth.uid()
      )
      -- Or the business owner of the shift
      OR EXISTS (
        SELECT 1
        FROM   applications a
        JOIN   shifts       s ON s.id = a.shift_id
        JOIN   businesses   b ON b.id = s.business_id
        WHERE  a.id = messages.application_id AND b.owner_id = auth.uid()
      )
    )
  );

-- Recipients can mark messages as read
CREATE POLICY "messages_mark_read" ON messages
  FOR UPDATE TO authenticated
  USING (sender_id != auth.uid())    -- only the non-sender can flip is_read
  WITH CHECK (is_read = true);       -- only allowed update is marking as read

-- ─── certifications ───────────────────────────────────────────────────────────
-- Workers can upload image evidence of a skill certification.
-- One entry per (worker, skill). Admin reviews and flips is_verified.
CREATE TABLE certifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id    int         NOT NULL REFERENCES skills(id),
  file_path   text        NOT NULL,       -- Storage path: {worker_id}/{skill_id}.jpg
  is_verified boolean     NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, skill_id)
);

CREATE INDEX idx_certs_worker ON certifications (worker_id);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certs_worker_select" ON certifications
  FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "certs_worker_insert" ON certifications
  FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid());

-- Allow re-uploads (upsert pattern)
CREATE POLICY "certs_worker_update" ON certifications
  FOR UPDATE TO authenticated
  USING (worker_id = auth.uid());

-- =============================================================================
-- Storage: 'certifications' bucket
-- MANUAL STEP: Create in Supabase Dashboard → Storage → New Bucket
--   Name: certifications  |  Public: OFF  |  Max file size: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- =============================================================================

CREATE POLICY "certs_worker_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "certs_worker_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "certs_worker_replace" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'certifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
