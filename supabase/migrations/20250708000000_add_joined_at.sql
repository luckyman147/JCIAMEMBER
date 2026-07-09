-- Add joined_at column to profiles table
-- joined_at: editable date field initialized with created_at for existing members

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_at DATE;

-- Initialize joined_at with created_at for existing rows where it's null
UPDATE profiles SET joined_at = created_at::DATE WHERE joined_at IS NULL;
