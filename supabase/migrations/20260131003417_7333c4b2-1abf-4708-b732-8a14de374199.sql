-- Create teacher_expertise table
CREATE TABLE public.teacher_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expertise_text TEXT NOT NULL,
  domain_tag TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_expertise ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active expertise"
ON public.teacher_expertise FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert their expertise"
ON public.teacher_expertise FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their expertise"
ON public.teacher_expertise FOR UPDATE
USING (auth.uid() = user_id);

-- Create teaching_sessions table
CREATE TABLE public.teaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  actual_minutes INTEGER,
  credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teaching_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their sessions"
ON public.teaching_sessions FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Learners can view their sessions"
ON public.teaching_sessions FOR SELECT
USING (auth.uid() = learner_id);

CREATE POLICY "Teachers can insert sessions"
ON public.teaching_sessions FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their sessions"
ON public.teaching_sessions FOR UPDATE
USING (auth.uid() = teacher_id);

-- Create teaching_reviews table
CREATE TABLE public.teaching_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.teaching_sessions(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  experience_rating INTEGER NOT NULL CHECK (experience_rating >= 1 AND experience_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teaching_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Teachers can view their reviews"
ON public.teaching_reviews FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Learners can create reviews"
ON public.teaching_reviews FOR INSERT
WITH CHECK (auth.uid() = learner_id OR auth.uid() = teacher_id);

-- Add triggers
CREATE TRIGGER update_teacher_expertise_updated_at
BEFORE UPDATE ON public.teacher_expertise
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teaching_sessions_updated_at
BEFORE UPDATE ON public.teaching_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();