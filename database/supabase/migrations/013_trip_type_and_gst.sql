ALTER TABLE trips
  ADD COLUMN trip_type TEXT NOT NULL DEFAULT 'intracity' CHECK (trip_type IN ('intracity', 'intercity')),
  ADD COLUMN origin_state TEXT,
  ADD COLUMN destination_state TEXT;
