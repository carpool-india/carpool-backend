-- GST is no longer collected/displayed anywhere in the app; trip-start OTP was
-- replaced entirely (see 023_login_otps.sql). Drop the now-unused columns.
ALTER TABLE bookings DROP COLUMN IF EXISTS gst_amount;
ALTER TABLE bookings DROP COLUMN IF EXISTS trip_otp;
ALTER TABLE bookings DROP COLUMN IF EXISTS otp_verified;
ALTER TABLE payments DROP COLUMN IF EXISTS gst_amount;
