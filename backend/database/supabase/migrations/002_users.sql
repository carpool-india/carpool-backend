CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id UUID UNIQUE REFERENCES auth.users(id),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('male','female','other')),
  role TEXT DEFAULT 'passenger' CHECK (role IN ('passenger','driver','both')),
  trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  aadhaar_verified BOOLEAN DEFAULT false,
  dl_verified BOOLEAN DEFAULT false,
  face_match_done BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','hi','ta')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kyc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar','dl','selfie')),
  hyperverge_txn_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
