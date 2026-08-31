CREATE OR REPLACE FUNCTION public.calculate_trust_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_aadhaar BOOLEAN;
  v_dl BOOLEAN;
  v_face BOOLEAN;
  v_avg_stars NUMERIC;
  v_rating_count INTEGER;
  v_completed INTEGER;
  v_cancellations INTEGER;
  v_fraud INTEGER;
  v_kyc INTEGER;
  v_rating_points NUMERIC;
  v_completion INTEGER;
  v_cancel_penalty INTEGER;
  v_fraud_penalty INTEGER;
  v_total INTEGER;
BEGIN
  SELECT
    COALESCE(u.aadhaar_verified, false),
    COALESCE(u.dl_verified, false),
    COALESCE(u.face_match_done, false)
  INTO v_aadhaar, v_dl, v_face
  FROM users u
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(AVG(r.stars), 0), COUNT(*)
  INTO v_avg_stars, v_rating_count
  FROM ratings r
  WHERE r.ratee_id = p_user_id;

  SELECT COUNT(*)
  INTO v_completed
  FROM bookings b
  WHERE b.passenger_id = p_user_id AND b.status = 'completed';

  SELECT COALESCE(dp.cancellation_count, 0) + (
    SELECT COUNT(*) FROM bookings b2
    WHERE b2.passenger_id = p_user_id AND b2.status = 'cancelled'
  )
  INTO v_cancellations
  FROM driver_profiles dp
  WHERE dp.user_id = p_user_id;

  IF v_cancellations IS NULL THEN
    SELECT COUNT(*) INTO v_cancellations
    FROM bookings b3
    WHERE b3.passenger_id = p_user_id AND b3.status = 'cancelled';
  END IF;

  SELECT COUNT(*)
  INTO v_fraud
  FROM safety_events se
  WHERE se.user_id = p_user_id AND se.event_type = 'fraud_flag';

  v_kyc := (CASE WHEN v_aadhaar THEN 15 ELSE 0 END)
         + (CASE WHEN v_dl THEN 15 ELSE 0 END)
         + (CASE WHEN v_face THEN 10 ELSE 0 END);

  IF v_rating_count = 0 THEN
    v_rating_points := 15;
  ELSE
    v_rating_points := LEAST(30, (v_avg_stars / 5.0) * 30);
  END IF;

  v_completion := LEAST(20, v_completed * 2);
  v_cancel_penalty := LEAST(15, v_cancellations * 5);
  v_fraud_penalty := LEAST(20, v_fraud * 10);

  v_total := ROUND(v_kyc + v_rating_points + v_completion - v_cancel_penalty - v_fraud_penalty);
  RETURN GREATEST(0, LEAST(100, v_total));
END;
$$;
