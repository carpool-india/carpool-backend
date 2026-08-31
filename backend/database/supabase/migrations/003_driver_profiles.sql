CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dl_number TEXT,
  dl_expiry DATE,
  hyperverge_dl_txn_id TEXT,
  hyperverge_aadhaar_txn_id TEXT,
  years_of_experience INTEGER DEFAULT 0 CHECK (years_of_experience >= 0),
  total_trips INTEGER DEFAULT 0 CHECK (total_trips >= 0),
  cancellation_count INTEGER DEFAULT 0 CHECK (cancellation_count >= 0),
  reliability_score NUMERIC(5,2) DEFAULT 1.00 CHECK (reliability_score BETWEEN 0 AND 1),
  cashfree_beneficiary_id TEXT,
  bank_account_last4 TEXT,
  ifsc TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
