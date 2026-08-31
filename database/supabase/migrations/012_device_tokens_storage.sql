DROP POLICY IF EXISTS users_select_own ON users;

CREATE POLICY users_select_authenticated ON users
  FOR SELECT TO authenticated
  USING (true);

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios','android','unknown')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_tokens_own ON device_tokens
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY kyc_documents_own ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = public.current_app_user_id()::text
  )
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = public.current_app_user_id()::text
  );

CREATE POLICY profile_photos_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY profile_photos_write_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = public.current_app_user_id()::text
  );

CREATE POLICY profile_photos_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = public.current_app_user_id()::text
  );
