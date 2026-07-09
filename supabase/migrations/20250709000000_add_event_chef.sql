-- Add event_chef officer role
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_chef_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_event_chef ON events(event_chef_id);
