-- Migration to add video support to activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS recap_videos TEXT[];

-- Add comments for clarity
COMMENT ON COLUMN activities.video_url IS 'URL to the main cover video for the activity';
COMMENT ON COLUMN activities.recap_videos IS 'Array of URLs for recap videos documenting the activity';
