-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create reviews table for product reviews
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies - anyone can read
CREATE POLICY "Reviews are viewable by everyone"
ON public.product_reviews FOR SELECT
USING (true);

-- Only authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create seminars table for teaching content
CREATE TABLE public.seminars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  skill_level TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT NOT NULL DEFAULT '1h',
  max_learners INTEGER NOT NULL DEFAULT 10,
  prerequisites TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on seminars
ALTER TABLE public.seminars ENABLE ROW LEVEL SECURITY;

-- Seminars policies - anyone can view active seminars
CREATE POLICY "Active seminars are viewable by everyone"
ON public.seminars FOR SELECT
USING (is_active = true);

-- Teachers can create seminars
CREATE POLICY "Teachers can create seminars"
ON public.seminars FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their seminars
CREATE POLICY "Teachers can update their seminars"
ON public.seminars FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their seminars
CREATE POLICY "Teachers can delete their seminars"
ON public.seminars FOR DELETE
USING (auth.uid() = teacher_id);

-- Create session requests table
CREATE TABLE public.session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id UUID REFERENCES public.seminars(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seminar_id, learner_id)
);

-- Enable RLS on session requests
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;

-- Learners can view their own requests
CREATE POLICY "Learners can view their requests"
ON public.session_requests FOR SELECT
USING (auth.uid() = learner_id);

-- Teachers can view requests for their seminars
CREATE POLICY "Teachers can view requests for their seminars"
ON public.session_requests FOR SELECT
USING (auth.uid() = teacher_id);

-- Learners can create requests
CREATE POLICY "Learners can create requests"
ON public.session_requests FOR INSERT
WITH CHECK (auth.uid() = learner_id);

-- Teachers can update request status
CREATE POLICY "Teachers can update request status"
ON public.session_requests FOR UPDATE
USING (auth.uid() = teacher_id);

-- Learners can cancel their requests
CREATE POLICY "Learners can cancel their requests"
ON public.session_requests FOR UPDATE
USING (auth.uid() = learner_id AND status = 'pending');

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seminars_updated_at
BEFORE UPDATE ON public.seminars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_requests_updated_at
BEFORE UPDATE ON public.session_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_requests;