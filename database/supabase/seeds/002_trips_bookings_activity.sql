-- Populates trips/bookings/payments/ratings/safety/subscriptions/messages around
-- the real test account (Dinesh, +919789631081) so both the driver side and the
-- passenger side of the app have something to show. Run 001_test_users.sql first.

-- Make Dinesh a driver+passenger so he can post trips as well as book them.
UPDATE users SET role = 'both'
WHERE id = '2c42e287-b82e-4ff3-814e-b346d566e50a';

INSERT INTO vehicles (id, driver_id, make, model, color, registration_number, year, is_verified, vehicle_type) VALUES
  ('33333333-3333-3333-3333-333333330199', '2c42e287-b82e-4ff3-814e-b346d566e50a', 'Maruti', 'Baleno', 'Red', 'TN09ZZ1234', 2022, true, 'car');

INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES
  ('2c42e287-b82e-4ff3-814e-b346d566e50a', 'Priya Thangavel', '+919789631099', 'spouse');

-- Active posting plans so PostTripScreen doesn't block Dinesh on either trip type.
INSERT INTO subscriptions (user_id, plan_type, cadence, amount_inr, status, starts_at, expires_at) VALUES
  ('2c42e287-b82e-4ff3-814e-b346d566e50a', 'driver_local', 'monthly', 299, 'active', now() - interval '10 days', now() + interval '20 days'),
  ('2c42e287-b82e-4ff3-814e-b346d566e50a', 'driver_outstation', 'monthly', 499, 'active', now() - interval '10 days', now() + interval '20 days'),
  ('11111111-1111-1111-1111-111111111104', 'driver_local', 'monthly', 299, 'active', now() - interval '5 days', now() + interval '25 days'),
  ('22222222-2222-2222-2222-222222222202', 'passenger', 'monthly', 199, 'active', now() - interval '5 days', now() + interval '25 days');

-- Trips -----------------------------------------------------------------
INSERT INTO trips (id, driver_id, origin_name, origin_point, destination_name, destination_point, departure_time, seats_total, seats_available, price_per_seat, status, is_women_only, trip_type, origin_state, destination_state, vehicle_id) VALUES
  ('44444444-4444-4444-4444-444444440001', '11111111-1111-1111-1111-111111111101', 'Krishnagiri', ST_SetSRID(ST_MakePoint(78.2150, 12.5266), 4326), 'Bengaluru', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), now() + interval '18 hours', 3, 1, 890, 'active', false, 'intercity', 'Tamil Nadu', 'Karnataka', '33333333-3333-3333-3333-333333330101'),
  ('44444444-4444-4444-4444-444444440002', '11111111-1111-1111-1111-111111111102', 'Chennai', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), 'Pondicherry', ST_SetSRID(ST_MakePoint(79.8083, 11.9416), 4326), now() + interval '30 hours', 3, 1, 480, 'active', true, 'intercity', 'Tamil Nadu', 'Puducherry', '33333333-3333-3333-3333-333333330102'),
  ('44444444-4444-4444-4444-444444440003', '11111111-1111-1111-1111-111111111103', 'Hyderabad', ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326), 'Vijayawada', ST_SetSRID(ST_MakePoint(80.6480, 16.5062), 4326), now() + interval '6 hours', 4, 3, 720, 'active', false, 'intercity', 'Telangana', 'Andhra Pradesh', '33333333-3333-3333-3333-333333330103'),
  ('44444444-4444-4444-4444-444444440004', '11111111-1111-1111-1111-111111111106', 'Whitefield', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326), 'Koramangala', ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326), now() + interval '3 hours', 3, 3, 180, 'active', false, 'intracity', 'Karnataka', 'Karnataka', '33333333-3333-3333-3333-333333330106'),
  ('44444444-4444-4444-4444-444444440005', '11111111-1111-1111-1111-111111111108', 'Ahmedabad', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), 'Vadodara', ST_SetSRID(ST_MakePoint(73.1812, 22.3072), 4326), now() - interval '2 days', 4, 1, 390, 'completed', false, 'intercity', 'Gujarat', 'Gujarat', '33333333-3333-3333-3333-333333330108'),
  ('44444444-4444-4444-4444-444444440006', '11111111-1111-1111-1111-111111111110', 'Jaipur', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), 'Delhi', ST_SetSRID(ST_MakePoint(77.1025, 28.7041), 4326), now() + interval '40 hours', 3, 2, 890, 'active', false, 'intercity', 'Rajasthan', 'Delhi', '33333333-3333-3333-3333-333333330110'),
  ('44444444-4444-4444-4444-444444440007', '11111111-1111-1111-1111-111111111105', 'Pune', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326), 'Mumbai', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), now() - interval '1 day', 3, 0, 550, 'completed', false, 'intercity', 'Maharashtra', 'Maharashtra', '33333333-3333-3333-3333-333333330105'),
  ('44444444-4444-4444-4444-444444440008', '2c42e287-b82e-4ff3-814e-b346d566e50a', 'Chennai', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), 'Bengaluru', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), now() + interval '24 hours', 3, 1, 850, 'active', false, 'intercity', 'Tamil Nadu', 'Karnataka', '33333333-3333-3333-3333-333333330199'),
  ('44444444-4444-4444-4444-444444440009', '2c42e287-b82e-4ff3-814e-b346d566e50a', 'T Nagar', ST_SetSRID(ST_MakePoint(80.2340, 13.0418), 4326), 'Velachery', ST_SetSRID(ST_MakePoint(80.2209, 12.9791), 4326), now() + interval '5 hours', 3, 3, 150, 'active', false, 'intracity', 'Tamil Nadu', 'Tamil Nadu', '33333333-3333-3333-3333-333333330199');

-- Bookings ----------------------------------------------------------------
INSERT INTO bookings (id, trip_id, passenger_id, seats_booked, subtotal, total_amount, service_fee, status, pickup_point, dropoff_point, razorpay_order_id, razorpay_payment_id, created_at) VALUES
  ('55555555-5555-5555-5555-555555550001', '44444444-4444-4444-4444-444444440001', '22222222-2222-2222-2222-222222222201', 1, 890, 89, 89, 'confirmed', ST_SetSRID(ST_MakePoint(78.2150, 12.5266), 4326), ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 'order_seed0001', 'pay_seed0001', now() - interval '2 hours'),
  ('55555555-5555-5555-5555-555555550002', '44444444-4444-4444-4444-444444440001', '22222222-2222-2222-2222-222222222203', 1, 890, 89, 89, 'confirmed', ST_SetSRID(ST_MakePoint(78.2150, 12.5266), 4326), ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 'order_seed0002', 'pay_seed0002', now() - interval '1 hour'),
  ('55555555-5555-5555-5555-555555550003', '44444444-4444-4444-4444-444444440002', '22222222-2222-2222-2222-222222222202', 1, 480, 48, 48, 'confirmed', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), ST_SetSRID(ST_MakePoint(79.8083, 11.9416), 4326), 'order_seed0003', 'pay_seed0003', now() - interval '3 hours'),
  ('55555555-5555-5555-5555-555555550004', '44444444-4444-4444-4444-444444440002', '22222222-2222-2222-2222-222222222204', 1, 480, 48, 48, 'confirmed', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), ST_SetSRID(ST_MakePoint(79.8083, 11.9416), 4326), 'order_seed0004', 'pay_seed0004', now() - interval '3 hours'),
  ('55555555-5555-5555-5555-555555550005', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222205', 1, 390, 39, 39, 'completed', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), ST_SetSRID(ST_MakePoint(73.1812, 22.3072), 4326), 'order_seed0005', 'pay_seed0005', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550006', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222206', 1, 390, 39, 39, 'completed', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), ST_SetSRID(ST_MakePoint(73.1812, 22.3072), 4326), 'order_seed0006', 'pay_seed0006', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550007', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222207', 1, 390, 39, 39, 'completed', ST_SetSRID(ST_MakePoint(72.5714, 23.0225), 4326), ST_SetSRID(ST_MakePoint(73.1812, 22.3072), 4326), 'order_seed0007', 'pay_seed0007', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550008', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222201', 1, 550, 55, 55, 'completed', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326), ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 'order_seed0008', 'pay_seed0008', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550009', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222208', 1, 550, 55, 55, 'completed', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326), ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 'order_seed0009', 'pay_seed0009', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550010', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222209', 1, 550, 55, 55, 'completed', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326), ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 'order_seed0010', 'pay_seed0010', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550011', '44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222210', 1, 850, 85, 85, 'confirmed', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 'order_seed0011', 'pay_seed0011', now() - interval '40 minutes'),
  ('55555555-5555-5555-5555-555555550012', '44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222211', 1, 850, 85, 85, 'confirmed', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 'order_seed0012', 'pay_seed0012', now() - interval '15 minutes'),
  ('55555555-5555-5555-5555-555555550013', '44444444-4444-4444-4444-444444440003', '2c42e287-b82e-4ff3-814e-b346d566e50a', 1, 720, 72, 72, 'confirmed', ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326), ST_SetSRID(ST_MakePoint(80.6480, 16.5062), 4326), 'order_seed0013', 'pay_seed0013', now() - interval '1 hour'),
  ('55555555-5555-5555-5555-555555550014', '44444444-4444-4444-4444-444444440006', '22222222-2222-2222-2222-222222222212', 1, 890, 89, 89, 'pending', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), ST_SetSRID(ST_MakePoint(77.1025, 28.7041), 4326), NULL, NULL, now() - interval '10 minutes'),
  ('55555555-5555-5555-5555-555555550015', '44444444-4444-4444-4444-444444440004', '22222222-2222-2222-2222-222222222213', 1, 180, 18, 18, 'cancelled', ST_SetSRID(ST_MakePoint(77.7500, 12.9698), 4326), ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326), NULL, NULL, now() - interval '5 hours');

-- Payments matching captured bookings --------------------------------------
INSERT INTO payments (booking_id, trip_id, payer_id, amount, service_fee, provider, type, status, razorpay_order_id, razorpay_payment_id, created_at) VALUES
  ('55555555-5555-5555-5555-555555550001', '44444444-4444-4444-4444-444444440001', '22222222-2222-2222-2222-222222222201', 89, 89, 'razorpay', 'escrow', 'captured', 'order_seed0001', 'pay_seed0001', now() - interval '2 hours'),
  ('55555555-5555-5555-5555-555555550002', '44444444-4444-4444-4444-444444440001', '22222222-2222-2222-2222-222222222203', 89, 89, 'razorpay', 'escrow', 'captured', 'order_seed0002', 'pay_seed0002', now() - interval '1 hour'),
  ('55555555-5555-5555-5555-555555550003', '44444444-4444-4444-4444-444444440002', '22222222-2222-2222-2222-222222222202', 48, 48, 'razorpay', 'escrow', 'captured', 'order_seed0003', 'pay_seed0003', now() - interval '3 hours'),
  ('55555555-5555-5555-5555-555555550004', '44444444-4444-4444-4444-444444440002', '22222222-2222-2222-2222-222222222204', 48, 48, 'razorpay', 'escrow', 'captured', 'order_seed0004', 'pay_seed0004', now() - interval '3 hours'),
  ('55555555-5555-5555-5555-555555550005', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222205', 39, 39, 'razorpay', 'escrow', 'captured', 'order_seed0005', 'pay_seed0005', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550006', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222206', 39, 39, 'razorpay', 'escrow', 'captured', 'order_seed0006', 'pay_seed0006', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550007', '44444444-4444-4444-4444-444444440005', '22222222-2222-2222-2222-222222222207', 39, 39, 'razorpay', 'escrow', 'captured', 'order_seed0007', 'pay_seed0007', now() - interval '3 days'),
  ('55555555-5555-5555-5555-555555550008', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222201', 55, 55, 'razorpay', 'escrow', 'captured', 'order_seed0008', 'pay_seed0008', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550009', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222208', 55, 55, 'razorpay', 'escrow', 'captured', 'order_seed0009', 'pay_seed0009', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550010', '44444444-4444-4444-4444-444444440007', '22222222-2222-2222-2222-222222222209', 55, 55, 'razorpay', 'escrow', 'captured', 'order_seed0010', 'pay_seed0010', now() - interval '2 days'),
  ('55555555-5555-5555-5555-555555550011', '44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222210', 85, 85, 'razorpay', 'escrow', 'captured', 'order_seed0011', 'pay_seed0011', now() - interval '40 minutes'),
  ('55555555-5555-5555-5555-555555550012', '44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222211', 85, 85, 'razorpay', 'escrow', 'captured', 'order_seed0012', 'pay_seed0012', now() - interval '15 minutes'),
  ('55555555-5555-5555-5555-555555550013', '44444444-4444-4444-4444-444444440003', '2c42e287-b82e-4ff3-814e-b346d566e50a', 72, 72, 'razorpay', 'escrow', 'captured', 'order_seed0013', 'pay_seed0013', now() - interval '1 hour');

-- Ratings for the completed trips -------------------------------------------
INSERT INTO ratings (booking_id, rater_id, ratee_id, stars, comment, tags) VALUES
  ('55555555-5555-5555-5555-555555550005', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111108', 5, 'Great driver, on time and friendly.', ARRAY['on_time','friendly']),
  ('55555555-5555-5555-5555-555555550006', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111108', 4, 'Smooth ride, clean car.', ARRAY['clean_car']),
  ('55555555-5555-5555-5555-555555550008', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105', 5, 'Very safe driving.', ARRAY['safe_driving']),
  ('55555555-5555-5555-5555-555555550009', '22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111105', 5, 'Would ride again!', ARRAY['on_time']);

-- One resolved SOS event for the safety dashboard ----------------------------
INSERT INTO safety_events (trip_id, booking_id, user_id, event_type, severity, lat, lng, metadata, resolved, resolved_by, resolved_at, created_at) VALUES
  ('44444444-4444-4444-4444-444444440001', '55555555-5555-5555-5555-555555550001', '22222222-2222-2222-2222-222222222201', 'sos', 'high', 12.6, 78.3, '{"note":"False alarm, phone pocket-pressed the button"}', true, '11111111-1111-1111-1111-111111111101', now() - interval '80 minutes', now() - interval '90 minutes');

-- A short chat thread on Dinesh's posted trip (T8) with the passenger who booked it.
INSERT INTO messages (trip_id, sender_id, body, created_at) VALUES
  ('44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222210', 'Hi! Booked a seat for tomorrow''s Chennai to Bengaluru ride. What time should I be ready?', now() - interval '35 minutes'),
  ('44444444-4444-4444-4444-444444440008', '2c42e287-b82e-4ff3-814e-b346d566e50a', 'Hi Aisha! Planning to leave around 7 AM from Guindy. Does that work for you?', now() - interval '32 minutes'),
  ('44444444-4444-4444-4444-444444440008', '22222222-2222-2222-2222-222222222210', 'Yes, 7 AM works. I''ll be at the Guindy signal, will share my exact pin closer to time.', now() - interval '28 minutes'),
  ('44444444-4444-4444-4444-444444440008', '2c42e287-b82e-4ff3-814e-b346d566e50a', 'Sounds good, see you then!', now() - interval '20 minutes');
