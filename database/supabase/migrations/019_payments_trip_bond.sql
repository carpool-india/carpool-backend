ALTER TABLE payments ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE payments ADD COLUMN trip_id UUID REFERENCES trips(id);

CREATE POLICY payments_update_payer ON payments
  FOR UPDATE TO authenticated
  USING (payer_id = public.current_app_user_id())
  WITH CHECK (payer_id = public.current_app_user_id());
