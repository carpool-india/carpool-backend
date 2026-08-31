CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payer_id UUID NOT NULL REFERENCES users(id),
  payee_id UUID REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL CHECK (provider IN ('razorpay','cashfree')),
  type TEXT NOT NULL CHECK (type IN ('escrow','payout','refund','cancellation_bond')),
  status TEXT DEFAULT 'created' CHECK (status IN ('created','authorized','captured','refunded','failed','transferred')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  cashfree_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
