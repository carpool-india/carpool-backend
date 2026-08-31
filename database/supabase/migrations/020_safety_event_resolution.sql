ALTER TABLE safety_events ADD COLUMN resolved_by UUID REFERENCES users(id);
ALTER TABLE safety_events ADD COLUMN resolved_at TIMESTAMPTZ;
