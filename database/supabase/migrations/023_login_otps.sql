CREATE TABLE login_otps (
  phone TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE login_otps ENABLE ROW LEVEL SECURITY;
-- No policies: only the backend (service role key) reads/writes this table.
