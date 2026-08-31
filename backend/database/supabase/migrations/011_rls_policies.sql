ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM public.users
  WHERE supabase_auth_id = auth.uid()
  LIMIT 1
$$;

CREATE POLICY users_select_own ON users
  FOR SELECT TO authenticated
  USING (supabase_auth_id = auth.uid() OR id = public.current_app_user_id());

CREATE POLICY users_update_own ON users
  FOR UPDATE TO authenticated
  USING (supabase_auth_id = auth.uid())
  WITH CHECK (supabase_auth_id = auth.uid());

CREATE POLICY users_insert_own ON users
  FOR INSERT TO authenticated
  WITH CHECK (supabase_auth_id = auth.uid());

CREATE POLICY emergency_contacts_own ON emergency_contacts
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY kyc_sessions_own ON kyc_sessions
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY driver_profiles_select ON driver_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY driver_profiles_write_own ON driver_profiles
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY vehicles_select ON vehicles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY vehicles_write_own ON vehicles
  FOR ALL TO authenticated
  USING (driver_id = public.current_app_user_id())
  WITH CHECK (driver_id = public.current_app_user_id());

CREATE POLICY trips_select_authenticated ON trips
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY trips_insert_own ON trips
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = public.current_app_user_id());

CREATE POLICY trips_update_own ON trips
  FOR UPDATE TO authenticated
  USING (driver_id = public.current_app_user_id())
  WITH CHECK (driver_id = public.current_app_user_id());

CREATE POLICY trips_delete_own ON trips
  FOR DELETE TO authenticated
  USING (driver_id = public.current_app_user_id());

CREATE POLICY bookings_select_party ON bookings
  FOR SELECT TO authenticated
  USING (
    passenger_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = bookings.trip_id
        AND t.driver_id = public.current_app_user_id()
    )
  );

CREATE POLICY bookings_insert_own ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (passenger_id = public.current_app_user_id());

CREATE POLICY bookings_update_party ON bookings
  FOR UPDATE TO authenticated
  USING (
    passenger_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = bookings.trip_id
        AND t.driver_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    passenger_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = bookings.trip_id
        AND t.driver_id = public.current_app_user_id()
    )
  );

CREATE POLICY payments_select_relevant ON payments
  FOR SELECT TO authenticated
  USING (
    payer_id = public.current_app_user_id()
    OR payee_id = public.current_app_user_id()
  );

CREATE POLICY payments_insert_payer ON payments
  FOR INSERT TO authenticated
  WITH CHECK (payer_id = public.current_app_user_id());

CREATE POLICY ratings_select_authenticated ON ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ratings_insert_own ON ratings
  FOR INSERT TO authenticated
  WITH CHECK (rater_id = public.current_app_user_id());

CREATE POLICY safety_events_select_own ON safety_events
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = safety_events.trip_id
        AND t.driver_id = public.current_app_user_id()
    )
  );

CREATE POLICY safety_events_insert_own ON safety_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_app_user_id());
