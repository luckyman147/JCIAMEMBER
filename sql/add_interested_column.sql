-- Add is_interested column to activity_participants
ALTER TABLE public.activity_participants
ADD COLUMN IF NOT EXISTS is_interested boolean DEFAULT false;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_participants_interested ON public.activity_participants(is_interested) WHERE is_interested = true;
