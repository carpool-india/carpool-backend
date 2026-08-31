CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX messages_trip_created_idx ON messages (trip_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_trip_party(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t WHERE t.id = p_trip_id AND t.driver_id = public.current_app_user_id()
  ) OR EXISTS (
    SELECT 1 FROM bookings b WHERE b.trip_id = p_trip_id AND b.passenger_id = public.current_app_user_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_trip_party(UUID) TO authenticated;

CREATE POLICY messages_select_party ON messages
  FOR SELECT TO authenticated
  USING (public.is_trip_party(trip_id));

CREATE POLICY messages_insert_party ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = public.current_app_user_id() AND public.is_trip_party(trip_id));
