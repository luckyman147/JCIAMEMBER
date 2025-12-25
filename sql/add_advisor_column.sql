-- Add advisor_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS advisor_id UUID REFERENCES public.profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_advisor_id ON public.profiles(advisor_id);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.advisor_id IS 'References the member who acts as an advisor to this member.';
