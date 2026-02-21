-- Migration to enhance teaching_sessions and support enrollment flow

-- 1. Add missing columns to teaching_sessions to support Seminar features
ALTER TABLE public.teaching_sessions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'All Levels',
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1h',
ADD COLUMN IF NOT EXISTS max_learners INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS prerequisites TEXT;

-- 2. Ensure foreign key relationship exists between teaching_sessions and profiles (teacher)
-- This allows Supabase to infer the relationship for joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'teaching_sessions_teacher_id_fkey'
    ) THEN
        ALTER TABLE public.teaching_sessions
        ADD CONSTRAINT teaching_sessions_teacher_id_fkey
        FOREIGN KEY (teacher_id)
        REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. Ensure foreign key relationship exists between session_requests and teaching_sessions
-- This links a request to the specific session/seminar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'session_requests_session_id_fkey'
    ) THEN
        ALTER TABLE public.session_requests
        ADD CONSTRAINT session_requests_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES public.teaching_sessions(id);
    END IF;
END $$;

-- 4. Create a policy to allow public read access to scheduled sessions (Seminars)
-- This ensures Learners can see available seminars before requesting
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teaching_sessions;
CREATE POLICY "Enable read access for all users"
ON public.teaching_sessions FOR SELECT
USING (true);

-- 5. Enable read access for profiles so users can see teacher details
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
