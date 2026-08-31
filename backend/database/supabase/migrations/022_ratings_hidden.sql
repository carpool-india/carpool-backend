ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ratings_hidden_idx ON ratings (hidden);
