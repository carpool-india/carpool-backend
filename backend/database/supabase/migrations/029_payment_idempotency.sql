-- Backstop against double-charging/double-refunding a booking when two requests
-- race (retry, double-tap, or two admins acting on the same booking at once).
-- The app already checks-then-inserts; these unique indexes make the check
-- atomic at the database level too.
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_refund_per_booking
  ON payments (booking_id)
  WHERE type = 'refund' AND booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_one_escrow_per_booking
  ON payments (booking_id)
  WHERE type = 'escrow' AND booking_id IS NOT NULL;
