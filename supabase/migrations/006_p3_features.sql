-- ─────────────────────────────────────────────────────────────────────────────
-- P3: Micro-Insurance, Zero-Fee Perks, Sector Tags
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Sector tags on shifts ──────────────────────────────────────────────────
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS sector text;
CREATE INDEX IF NOT EXISTS idx_shifts_sector ON shifts (sector) WHERE sector IS NOT NULL;

-- ── 2. Fee-waiver counter on worker profiles ──────────────────────────────────
--   Set to 3 on KYC approval via admin action or trigger.
--   Decremented automatically after each qualifying payment.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fee_waiver_count int NOT NULL DEFAULT 0;

-- Trigger: award 3 fee waivers the first time a worker is KYC-verified
CREATE OR REPLACE FUNCTION award_kyc_fee_waivers()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only fire when status transitions INTO 'verified'
  IF NEW.kyc_status = 'verified' AND (OLD.kyc_status IS DISTINCT FROM 'verified') THEN
    -- Only award once (guard: only if still at 0)
    IF NEW.fee_waiver_count = 0 THEN
      NEW.fee_waiver_count := 3;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_kyc_fee_waivers ON profiles;
CREATE TRIGGER trg_award_kyc_fee_waivers
  BEFORE UPDATE OF kyc_status ON profiles
  FOR EACH ROW EXECUTE FUNCTION award_kyc_fee_waivers();

-- ── 3. Insurance coverage (per-application opt-in) ───────────────────────────
CREATE TABLE IF NOT EXISTS insurance_coverage (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  worker_id         uuid        NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  premium_paid      numeric(10,2) NOT NULL DEFAULT 10.00,  -- PHP 10 per shift
  coverage_amount   numeric(10,2) NOT NULL DEFAULT 50000.00, -- PHP 50,000
  provider          text        NOT NULL DEFAULT 'MicroShield',
  status            text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'claimed', 'expired')),
  opted_in_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_insurance_worker ON insurance_coverage (worker_id, opted_in_at DESC);

ALTER TABLE insurance_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_read_own_coverage"
  ON insurance_coverage FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "workers_insert_coverage"
  ON insurance_coverage FOR INSERT
  WITH CHECK (worker_id = auth.uid());

-- ── 4. Incident reports (linked to insurance claims) ─────────────────────────
CREATE TABLE IF NOT EXISTS incident_reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  worker_id         uuid        NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  incident_type     text        NOT NULL,
  description       text        NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  status            text        NOT NULL DEFAULT 'submitted'
                                CHECK (status IN ('submitted', 'under_review', 'resolved', 'rejected')),
  resolution_note   text,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_read_own_reports"
  ON incident_reports FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "workers_insert_reports"
  ON incident_reports FOR INSERT
  WITH CHECK (worker_id = auth.uid());
