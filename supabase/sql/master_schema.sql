-- Master Schema for Chrono
-- Includes: Auth, Sessions, Requests, GMeet Rooms, Credits, Reviews

-- 1. Profiles (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' -- 'teacher', 'learner', 'admin'
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Teacher Expertise
DO $$ BEGIN
    CREATE TYPE domain_tag AS ENUM ('cs', 'math', 'design', 'science', 'language', 'music', 'business', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE TABLE IF NOT EXISTS public.teacher_expertise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  expertise_text TEXT NOT NULL,
  domain_tag domain_tag NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teacher_expertise ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expertise viewable by everyone" ON public.teacher_expertise;
CREATE POLICY "Expertise viewable by everyone" ON public.teacher_expertise FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can manage own expertise" ON public.teacher_expertise;
CREATE POLICY "Teachers can manage own expertise" ON public.teacher_expertise FOR ALL USING (auth.uid() = user_id);

-- 3. Teaching Sessions
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('pending', 'accepted', 'declined', 'scheduled', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE TABLE IF NOT EXISTS public.teaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
  learner_id UUID REFERENCES public.profiles(id), -- Nullable initially
  title TEXT,
  description TEXT,
  category TEXT,
  skill_level TEXT,
  duration TEXT, -- '15m', '30m', '1h'
  status session_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_minutes INTEGER,
  credits_earned INTEGER
);

ALTER TABLE public.teaching_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions viewable by everyone" ON public.teaching_sessions;
CREATE POLICY "Sessions viewable by everyone" ON public.teaching_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can insert sessions" ON public.teaching_sessions;
CREATE POLICY "Teachers can insert sessions" ON public.teaching_sessions FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update own sessions" ON public.teaching_sessions;
CREATE POLICY "Teachers can update own sessions" ON public.teaching_sessions FOR UPDATE USING (auth.uid() = teacher_id);

-- 4. Session Requests (Learner booking flow)
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE TABLE IF NOT EXISTS public.session_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID REFERENCES public.profiles(id) NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
  session_id UUID REFERENCES public.teaching_sessions(id), -- If specific session
  expertise_id UUID REFERENCES public.teacher_expertise(id), -- If requesting based on skill
  message TEXT,
  status request_status DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own requests" ON public.session_requests;
CREATE POLICY "Users can see their own requests" ON public.session_requests FOR SELECT USING (auth.uid() = learner_id OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Learners can create requests" ON public.session_requests;
CREATE POLICY "Learners can create requests" ON public.session_requests FOR INSERT WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "Participants can update requests" ON public.session_requests;
CREATE POLICY "Participants can update requests" ON public.session_requests FOR UPDATE USING (auth.uid() = learner_id OR auth.uid() = teacher_id);

-- 5. Session Rooms (GMeet & Timer)
-- This stores the active state of a meeting
CREATE TABLE IF NOT EXISTS public.session_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.teaching_sessions(id) NOT NULL,
  room_code TEXT, -- Stores the Google Meet Link
  status TEXT DEFAULT 'waiting', -- 'waiting', 'running', 'paused', 'stopped'
  actual_duration_seconds INTEGER DEFAULT 0,
  teacher_id UUID REFERENCES public.profiles(id),
  learner_id UUID REFERENCES public.profiles(id),
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_rooms ENABLE ROW LEVEL SECURITY;
-- Anyone can theoretically read if they know the UUID? Better to restrict to participants.
-- Or just allow public read for simplicity if session_id is obscure.
-- Secure approach:
DROP POLICY IF EXISTS "Participants can view room" ON public.session_rooms;
CREATE POLICY "Participants can view room" ON public.session_rooms 
  FOR SELECT USING (
    auth.uid() = teacher_id OR 
    auth.uid() = learner_id OR
    EXISTS (SELECT 1 FROM public.teaching_sessions WHERE id = session_id AND (teacher_id = auth.uid() OR learner_id = auth.uid()))
  );
  
DROP POLICY IF EXISTS "Teachers can manage room" ON public.session_rooms;
CREATE POLICY "Teachers can manage room" ON public.session_rooms 
  FOR ALL USING (auth.uid() = teacher_id);

-- 6. Credit Ledger (Model 14)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount INTEGER NOT NULL, -- Positive (earn) or Negative (spend)
  entry_type TEXT NOT NULL, -- 'teaching', 'learning', 'bonus', 'penalty'
  description TEXT,
  balance_after INTEGER NOT NULL,
  session_id UUID REFERENCES public.teaching_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ledger" ON public.credit_ledger;
CREATE POLICY "Users view own ledger" ON public.credit_ledger FOR SELECT USING (auth.uid() = user_id);

-- 7. User Balances (Aggregated view)
CREATE TABLE IF NOT EXISTS public.user_credit_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  current_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credit_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own balance" ON public.user_credit_balances;
CREATE POLICY "Users view own balance" ON public.user_credit_balances FOR SELECT USING (auth.uid() = user_id);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.teaching_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.teaching_sessions(id) NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) NOT NULL,
  experience_rating INTEGER NOT NULL CHECK (experience_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teaching_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public" ON public.teaching_reviews;
CREATE POLICY "Reviews are public" ON public.teaching_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Learners can leave reviews" ON public.teaching_reviews;
CREATE POLICY "Learners can leave reviews" ON public.teaching_reviews FOR INSERT WITH CHECK (auth.uid() IN (SELECT learner_id FROM public.teaching_sessions WHERE id = session_id));

DROP POLICY IF EXISTS "Teachers can leave reviews" ON public.teaching_reviews;
CREATE POLICY "Teachers can leave reviews" ON public.teaching_reviews FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Trigger to create profile on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Initialize balance
  insert into public.user_credit_balances (user_id, current_balance)
  values (new.id, 5); -- Start with 5 credits
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger binding (if not exists)
-- Trigger binding (if not exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
