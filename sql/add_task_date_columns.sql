-- Add start_date and deadline columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS deadline date;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.start_date IS 'Optional start date for the task';
COMMENT ON COLUMN public.tasks.deadline IS 'Optional deadline/due date for the task';
