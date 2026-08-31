CREATE INDEX idx_users_supabase_auth_id ON users (supabase_auth_id);
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_driver_profiles_user_id ON driver_profiles (user_id);

CREATE INDEX idx_vehicles_driver_id ON vehicles (driver_id);

CREATE INDEX idx_trips_driver_id ON trips (driver_id);
CREATE INDEX idx_trips_status_departure ON trips (status, departure_time);
CREATE INDEX idx_trips_origin_gist ON trips USING GIST (origin_point);
CREATE INDEX idx_trips_destination_gist ON trips USING GIST (destination_point);

CREATE INDEX idx_bookings_trip_id ON bookings (trip_id);
CREATE INDEX idx_bookings_passenger_id ON bookings (passenger_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_pickup_gist ON bookings USING GIST (pickup_point);
CREATE INDEX idx_bookings_dropoff_gist ON bookings USING GIST (dropoff_point);

CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_payer_id ON payments (payer_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments (razorpay_order_id);

CREATE INDEX idx_ratings_ratee_id ON ratings (ratee_id);
CREATE INDEX idx_ratings_booking_id ON ratings (booking_id);

CREATE INDEX idx_safety_events_trip_id ON safety_events (trip_id);
CREATE INDEX idx_safety_events_user_id ON safety_events (user_id);
CREATE INDEX idx_safety_events_type ON safety_events (event_type);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts (user_id);
