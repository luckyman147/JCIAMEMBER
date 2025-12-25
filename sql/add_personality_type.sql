-- Add personality_type column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personality_type text CHECK (personality_type IN ('Dominant', 'Influence', 'Steadiness', 'Conscientious'));

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.personality_type IS 'DISC personality profile type (Dominant, Influence, Steadiness, Conscientious)';
