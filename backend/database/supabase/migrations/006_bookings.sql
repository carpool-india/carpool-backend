CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  passenger_id UUID NOT NULL REFERENCES users(id),
  seats_booked INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL,
  service_fee NUMERIC(10,2) NOT NULL,
  gst_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  trip_otp TEXT,
  otp_verified BOOLEAN DEFAULT false,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  pickup_point GEOMETRY(POINT, 4326),
  dropoff_point GEOMETRY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_active_booking_per_passenger UNIQUE (trip_id, passenger_id)
);
