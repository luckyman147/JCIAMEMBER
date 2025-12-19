-- Add Strengths and Weaknesses columns to the profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weaknesses text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN profiles.strengths IS 'Array of member professional strengths';
COMMENT ON COLUMN profiles.weaknesses IS 'Array of member professional areas for development';

-- Update RLS policies if necessary (usually not needed for just adding columns 
-- if you already have a SELECT/UPDATE policy on the profiles table)
