CREATE TABLE safety_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('sos','route_deviation','otp_fail','fraud_flag')),
  severity TEXT DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
