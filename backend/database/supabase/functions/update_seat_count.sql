CREATE OR REPLACE FUNCTION public.update_seat_count(
  p_trip_id UUID,
  p_seats INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  IF p_seats = 0 THEN
    RAISE EXCEPTION 'Seat delta cannot be zero';
  END IF;

  UPDATE trips
  SET seats_available = seats_available - p_seats
  WHERE id = p_trip_id
    AND seats_available - p_seats >= 0
    AND seats_available - p_seats <= seats_total
  RETURNING seats_available INTO v_available;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unable to update seats for trip % with delta %', p_trip_id, p_seats;
  END IF;

  RETURN v_available;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_seat_count(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_trust_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_trips(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DATE, INTEGER, DOUBLE PRECISION) TO authenticated;
