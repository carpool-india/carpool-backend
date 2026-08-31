ALTER TABLE vehicles
  ADD COLUMN vehicle_type TEXT NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('car', 'bike'));

ALTER TABLE trips
  ADD COLUMN vehicle_id UUID REFERENCES vehicles(id);
