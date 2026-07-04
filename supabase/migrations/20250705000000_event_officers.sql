-- Add event-level officer roles
ALTER TABLE events ADD COLUMN IF NOT EXISTS treasurer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS general_secretary_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_treasurer ON events(treasurer_id);
CREATE INDEX IF NOT EXISTS idx_events_general_secretary ON events(general_secretary_id);
