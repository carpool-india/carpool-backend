CREATE OR REPLACE FUNCTION public.find_nearby_trips(
  p_origin_lng DOUBLE PRECISION,
  p_origin_lat DOUBLE PRECISION,
  p_dest_lng DOUBLE PRECISION,
  p_dest_lat DOUBLE PRECISION,
  p_departure_date DATE,
  p_seats_needed INTEGER,
  p_radius_km DOUBLE PRECISION DEFAULT 25
)
RETURNS TABLE (
  trip_id UUID,
  driver_id UUID,
  origin_name TEXT,
  destination_name TEXT,
  departure_time TIMESTAMPTZ,
  seats_available INTEGER,
  price_per_seat NUMERIC,
  is_women_only BOOLEAN,
  origin_distance_km DOUBLE PRECISION,
  dest_distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.id,
    t.driver_id,
    t.origin_name,
    t.destination_name,
    t.departure_time,
    t.seats_available,
    t.price_per_seat,
    t.is_women_only,
    ST_Distance(t.origin_point::geography, ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography) / 1000.0 AS origin_distance_km,
    ST_Distance(t.destination_point::geography, ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography) / 1000.0 AS dest_distance_km
  FROM trips t
  WHERE t.status = 'active'
    AND t.seats_available >= p_seats_needed
    AND t.departure_time::date = p_departure_date
    AND ST_DWithin(
      t.origin_point::geography,
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography,
      p_radius_km * 1000
    )
    AND ST_DWithin(
      t.destination_point::geography,
      ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY origin_distance_km ASC;
$$;
