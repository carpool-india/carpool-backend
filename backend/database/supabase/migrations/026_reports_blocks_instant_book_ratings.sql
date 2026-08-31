-- Trust & safety: report/block, instant-book vs request-to-book, cached rating display

ALTER TABLE users ADD COLUMN IF NOT EXISTS average_stars NUMERIC(2,1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS instant_book BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending_approval','pending','confirmed','cancelled','completed','rejected'));

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_id UUID NOT NULL REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  booking_id UUID REFERENCES bookings(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id),
  blocked_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_reports_insert_own ON user_reports;
CREATE POLICY user_reports_insert_own ON user_reports
  FOR INSERT WITH CHECK (reporter_id = current_app_user_id());

DROP POLICY IF EXISTS user_reports_select_own ON user_reports;
CREATE POLICY user_reports_select_own ON user_reports
  FOR SELECT USING (reporter_id = current_app_user_id());

DROP POLICY IF EXISTS user_blocks_manage_own ON user_blocks;
CREATE POLICY user_blocks_manage_own ON user_blocks
  FOR ALL USING (blocker_id = current_app_user_id()) WITH CHECK (blocker_id = current_app_user_id());
