-- Add new profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS astrological_sign text,
ADD COLUMN IF NOT EXISTS preferred_social_media text,
ADD COLUMN IF NOT EXISTS social_media_link text,
ADD COLUMN IF NOT EXISTS preferred_committee text,
ADD COLUMN IF NOT EXISTS preferred_activity_type text,
ADD COLUMN IF NOT EXISTS preferred_meal text;
