-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Module 12: Skill Intent & Energy Matching Engine

-- Table to store user intent and energy preferences before sessions
CREATE TABLE public.session_intent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intent_type TEXT NOT NULL CHECK (intent_type IN ('quick_help', 'practice', 'deep_learning')),
  energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high')),
  preferred_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store compatibility scores between users
CREATE TABLE public.compatibility_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  intent_compatibility INTEGER DEFAULT 0 CHECK (intent_compatibility >= 0 AND intent_compatibility <= 100),
  energy_compatibility INTEGER DEFAULT 0 CHECK (energy_compatibility >= 0 AND energy_compatibility <= 100),
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_a_id, user_b_id)
);

-- Table for dynamic session adjustments
CREATE TABLE public.session_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.teaching_sessions(id),
  original_duration_minutes INTEGER NOT NULL,
  adjusted_duration_minutes INTEGER NOT NULL,
  adjustment_reason TEXT,
  adjusted_by TEXT CHECK (adjusted_by IN ('system', 'teacher', 'learner', 'mutual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.session_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_intent
CREATE POLICY "Users can view their own intent"
  ON public.session_intent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intent"
  ON public.session_intent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intent"
  ON public.session_intent FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intent"
  ON public.session_intent FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for compatibility_scores (users can view scores where they're involved)
CREATE POLICY "Users can view their compatibility scores"
  ON public.compatibility_scores FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "System can manage compatibility scores"
  ON public.compatibility_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for session_adjustments
CREATE POLICY "Users can view adjustments for their sessions"
  ON public.session_adjustments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teaching_sessions ts
      WHERE ts.id = session_id
      AND (ts.teacher_id = auth.uid() OR ts.learner_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert adjustments for their sessions"
  ON public.session_adjustments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teaching_sessions ts
      WHERE ts.id = session_id
      AND (ts.teacher_id = auth.uid() OR ts.learner_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_session_intent_user_id ON public.session_intent(user_id);
CREATE INDEX idx_session_intent_active ON public.session_intent(is_active) WHERE is_active = true;
CREATE INDEX idx_compatibility_user_a ON public.compatibility_scores(user_a_id);
CREATE INDEX idx_compatibility_user_b ON public.compatibility_scores(user_b_id);
CREATE INDEX idx_session_adjustments_session ON public.session_adjustments(session_id);

-- Triggers for updated_at
CREATE TRIGGER update_session_intent_updated_at
  BEFORE UPDATE ON public.session_intent
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compatibility_scores_updated_at
  BEFORE UPDATE ON public.compatibility_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();