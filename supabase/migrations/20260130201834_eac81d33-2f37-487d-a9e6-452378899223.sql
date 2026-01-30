-- Create domain tags enum for expertise
CREATE TYPE public.domain_tag AS ENUM ('cs', 'math', 'design', 'science', 'language', 'music', 'business', 'other');

-- Create session status enum
CREATE TYPE public.session_status AS ENUM ('pending', 'accepted', 'declined', 'scheduled', 'active', 'completed', 'cancelled');

-- Create request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'declined', 'scheduled');

-- Profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teacher expertise table (what teachers are confident teaching)
CREATE TABLE public.teacher_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expertise_text TEXT NOT NULL,
    domain_tag domain_tag NOT NULL DEFAULT 'other',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teaching sessions table
CREATE TABLE public.teaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    status session_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    actual_minutes INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session requests from learners
CREATE TABLE public.session_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.teaching_sessions(id) ON DELETE CASCADE,
    expertise_id UUID REFERENCES public.teacher_expertise(id) ON DELETE CASCADE,
    learner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Teaching reviews (after session completion)
CREATE TABLE public.teaching_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.teaching_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    experience_rating INTEGER NOT NULL CHECK (experience_rating >= 1 AND experience_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teacher expertise policies
CREATE POLICY "Anyone can view active expertise" ON public.teacher_expertise FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers can insert their expertise" ON public.teacher_expertise FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can update their expertise" ON public.teacher_expertise FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers can delete their expertise" ON public.teacher_expertise FOR DELETE USING (auth.uid() = user_id);

-- Teaching sessions policies
CREATE POLICY "Teachers can view their sessions" ON public.teaching_sessions FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Learners can view active sessions" ON public.teaching_sessions FOR SELECT USING (status = 'active');
CREATE POLICY "Teachers can insert their sessions" ON public.teaching_sessions FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their sessions" ON public.teaching_sessions FOR UPDATE USING (auth.uid() = teacher_id);

-- Session requests policies
CREATE POLICY "Teachers can view requests for their sessions" ON public.session_requests FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Learners can view their own requests" ON public.session_requests FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Learners can insert requests" ON public.session_requests FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Teachers can update requests" ON public.session_requests FOR UPDATE USING (auth.uid() = teacher_id);

-- Teaching reviews policies
CREATE POLICY "Teachers can view their reviews" ON public.teaching_reviews FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert their reviews" ON public.teaching_reviews FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_expertise_updated_at BEFORE UPDATE ON public.teacher_expertise FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teaching_sessions_updated_at BEFORE UPDATE ON public.teaching_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_session_requests_updated_at BEFORE UPDATE ON public.session_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for session updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.teaching_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_requests;