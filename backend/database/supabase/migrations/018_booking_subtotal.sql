ALTER TABLE bookings ADD COLUMN subtotal NUMERIC(10,2);
UPDATE bookings b
SET subtotal = t.price_per_seat * b.seats_booked
FROM trips t
WHERE b.trip_id = t.id AND b.subtotal IS NULL;
ALTER TABLE bookings ALTER COLUMN subtotal SET NOT NULL;
