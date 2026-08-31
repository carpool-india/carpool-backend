ALTER TABLE kyc_sessions
  DROP CONSTRAINT IF EXISTS kyc_sessions_status_check;

ALTER TABLE kyc_sessions
  ADD CONSTRAINT kyc_sessions_status_check
  CHECK (status IN ('pending', 'verified', 'failed', 'rejected'));

ALTER TABLE kyc_sessions
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS kyc_sessions_status_created_idx
  ON kyc_sessions (status, created_at DESC);
