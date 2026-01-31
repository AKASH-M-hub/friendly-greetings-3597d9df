-- Add columns for Google Meet integration and Session Timer
ALTER TABLE public.teaching_sessions
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_paused_at TIMESTAMP WITH TIME ZONE;
