-- =============================================
-- ZERO CREDIT RECOVERY SYSTEM - FULL MIGRATION
-- Timestamp: 20260221151933
-- =============================================

-- 1. MCQ Question Bank
CREATE TABLE IF NOT EXISTS public.mcq_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.teaching_sessions(id), -- Source session for topic
  topic TEXT NOT NULL,
  skill_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty_score INTEGER DEFAULT 1 CHECK (difficulty_score BETWEEN 1 AND 5),
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mcq_topic ON public.mcq_questions(topic);
CREATE INDEX IF NOT EXISTS idx_mcq_session ON public.mcq_questions(session_id);

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MCQ questions viewable by authenticated users" ON public.mcq_questions;
CREATE POLICY "MCQ questions viewable by authenticated users" 
  ON public.mcq_questions FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. MCQ Attempts (Anti-Abuse Tracking)
CREATE TABLE IF NOT EXISTS public.mcq_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  question_id UUID REFERENCES public.mcq_questions(id) NOT NULL,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  credits_earned INTEGER DEFAULT 0,
  ip_address TEXT,
  session_fingerprint TEXT -- Browser fingerprint for abuse detection
);

CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user ON public.mcq_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_question ON public.mcq_attempts(user_id, question_id);

ALTER TABLE public.mcq_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own mcq attempts" ON public.mcq_attempts;
CREATE POLICY "Users view own mcq attempts" 
  ON public.mcq_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mcq attempts" ON public.mcq_attempts;
CREATE POLICY "Users can insert own mcq attempts" 
  ON public.mcq_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Daily MCQ Limits (Max 5 questions/day = 10 credits max)
CREATE TABLE IF NOT EXISTS public.mcq_daily_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  credits_earned_today INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mcq_daily_user_date ON public.mcq_daily_limits(user_id, date);

ALTER TABLE public.mcq_daily_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own daily limits" ON public.mcq_daily_limits;
CREATE POLICY "Users view own daily limits" 
  ON public.mcq_daily_limits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage daily limits" ON public.mcq_daily_limits;
CREATE POLICY "Users can manage daily limits" 
  ON public.mcq_daily_limits FOR ALL USING (auth.uid() = user_id);

-- 4. Knowledge Progression Tracking
CREATE TABLE IF NOT EXISTS public.knowledge_progression (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  topic TEXT NOT NULL,
  skill_confidence_level INTEGER DEFAULT 0 CHECK (skill_confidence_level BETWEEN 0 AND 100),
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_score INTEGER DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  last_practiced_at TIMESTAMPTZ,
  teaching_readiness BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_user ON public.knowledge_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_topic ON public.knowledge_progression(topic);

ALTER TABLE public.knowledge_progression ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own progression" ON public.knowledge_progression;
CREATE POLICY "Users view own progression" 
  ON public.knowledge_progression FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage progression" ON public.knowledge_progression;
CREATE POLICY "Users can manage progression" 
  ON public.knowledge_progression FOR ALL USING (auth.uid() = user_id);

-- 5. Recovery Activities (4-Layer System)
DO $$ BEGIN
    CREATE TYPE recovery_activity_type AS ENUM (
      'peer_teaching',        -- Layer 1: Micro-sessions for 1 credit
      'micro_contribution',   -- Layer 2: Docs/notes contribution
      'assisted_teaching',    -- Layer 3: Co-teaching with mentor
      'institutional_support' -- Layer 4: Foundation/scholarship fund
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.recovery_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  activity_type recovery_activity_type NOT NULL,
  credits_earned INTEGER NOT NULL,
  description TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_user ON public.recovery_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_type ON public.recovery_activities(activity_type);

ALTER TABLE public.recovery_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own recovery activities" ON public.recovery_activities;
CREATE POLICY "Users view own recovery activities" 
  ON public.recovery_activities FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert recovery activities" ON public.recovery_activities;
CREATE POLICY "Users can insert recovery activities" 
  ON public.recovery_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Institutional Support Fund (Layer 4)
CREATE TABLE IF NOT EXISTS public.institutional_support_fund (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  credits_granted INTEGER NOT NULL,
  reason TEXT NOT NULL,
  granted_by TEXT NOT NULL, -- 'system', 'admin', 'foundation'
  grant_source TEXT, -- 'platform_reserve', 'donation', 'scholarship'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.institutional_support_fund ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own grants" ON public.institutional_support_fund;
CREATE POLICY "Users view own grants" 
  ON public.institutional_support_fund FOR SELECT USING (auth.uid() = recipient_user_id);

-- Function: Get eligible MCQ questions (not answered in last 7 days)
CREATE OR REPLACE FUNCTION get_eligible_mcq_questions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  skill_level TEXT,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  difficulty_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.topic,
    q.skill_level,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.difficulty_score
  FROM public.mcq_questions q
  WHERE q.is_active = TRUE
    AND q.id NOT IN (
      SELECT question_id 
      FROM public.mcq_attempts 
      WHERE user_id = p_user_id 
        AND attempted_at > NOW() - INTERVAL '7 days'
    )
    -- Prefer questions from sessions user participated in
    AND (
      q.session_id IN (
        SELECT id FROM public.teaching_sessions 
        WHERE (teacher_id = p_user_id OR learner_id = p_user_id)
          AND status = 'completed'
      )
      OR q.session_id IS NULL
    )
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record MCQ Attempt & Award Credits
CREATE OR REPLACE FUNCTION record_mcq_attempt(
  p_user_id UUID,
  p_question_id UUID,
  p_selected_option TEXT,
  p_time_taken_seconds INTEGER,
  p_ip_address TEXT DEFAULT NULL,
  p_session_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_question RECORD;
  v_is_correct BOOLEAN;
  v_credits_earned INTEGER := 0;
  v_daily_limit RECORD;
  v_current_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Get question details
  SELECT * INTO v_question FROM public.mcq_questions WHERE id = p_question_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Question not found');
  END IF;
  
  -- Check if correct
  v_is_correct := (v_question.correct_option = p_selected_option);
  
  -- Check daily limits
  INSERT INTO public.mcq_daily_limits (user_id, date, questions_attempted, questions_correct, credits_earned_today)
  VALUES (p_user_id, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  
  SELECT * INTO v_daily_limit FROM public.mcq_daily_limits 
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- Enforce 5 questions/day limit
  IF v_daily_limit.questions_attempted >= 5 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Daily limit reached (5 questions max)');
  END IF;
  
  -- Award 2 credits for correct answer
  IF v_is_correct AND v_daily_limit.credits_earned_today < 10 THEN
    v_credits_earned := 2;
  END IF;
  
  -- Insert attempt record
  INSERT INTO public.mcq_attempts (
    user_id, question_id, selected_option, is_correct, 
    time_taken_seconds, credits_earned, ip_address, session_fingerprint
  ) VALUES (
    p_user_id, p_question_id, p_selected_option, v_is_correct,
    p_time_taken_seconds, v_credits_earned, p_ip_address, p_session_fingerprint
  );
  
  -- Update daily limits
  UPDATE public.mcq_daily_limits
  SET 
    questions_attempted = questions_attempted + 1,
    questions_correct = questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
    credits_earned_today = credits_earned_today + v_credits_earned
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- Update question stats
  UPDATE public.mcq_questions
  SET 
    times_answered = times_answered + 1,
    times_correct = times_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END)
  WHERE id = p_question_id;
  
  -- Award credits to ledger if earned
  IF v_credits_earned > 0 THEN
    SELECT COALESCE(current_balance, 0) INTO v_current_balance
    FROM public.user_credit_balances
    WHERE user_id = p_user_id;
    
    INSERT INTO public.credit_ledger (
      user_id, amount, entry_type, description, balance_after, metadata
    ) VALUES (
      p_user_id, v_credits_earned, 'credit_earned', 
      'MCQ Quiz: ' || v_question.topic,
      v_current_balance + v_credits_earned,
      jsonb_build_object(
        'source', 'mcq_quiz',
        'question_id', p_question_id,
        'topic', v_question.topic
      )
    );
    
    -- Update balance
    INSERT INTO public.user_credit_balances (user_id, current_balance, total_earned)
    VALUES (p_user_id, v_credits_earned, v_credits_earned)
    ON CONFLICT (user_id) DO UPDATE SET
      current_balance = user_credit_balances.current_balance + v_credits_earned,
      total_earned = user_credit_balances.total_earned + v_credits_earned,
      updated_at = NOW();
  END IF;
  
  -- Update knowledge progression
  INSERT INTO public.knowledge_progression (
    user_id, topic, questions_answered, questions_correct, last_practiced_at
  ) VALUES (
    p_user_id, v_question.topic, 1, (CASE WHEN v_is_correct THEN 1 ELSE 0 END), NOW()
  )
  ON CONFLICT (user_id, topic) DO UPDATE SET
    questions_answered = knowledge_progression.questions_answered + 1,
    questions_correct = knowledge_progression.questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
    skill_confidence_level = LEAST(100, (
      (knowledge_progression.questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END))::FLOAT / 
      (knowledge_progression.questions_answered + 1)::FLOAT * 100
    )::INTEGER),
    mastery_score = LEAST(100, (
      (knowledge_progression.questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END))::FLOAT / 
      GREATEST((knowledge_progression.questions_answered + 1), 10)::FLOAT * 100
    )::INTEGER),
    teaching_readiness = (
      (knowledge_progression.questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END)) >= 5 AND
      ((knowledge_progression.questions_correct + (CASE WHEN v_is_correct THEN 1 ELSE 0 END))::FLOAT / 
       (knowledge_progression.questions_answered + 1)::FLOAT) >= 0.7
    ),
    last_practiced_at = NOW(),
    updated_at = NOW();
  
  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'explanation', v_question.explanation,
    'credits_earned', v_credits_earned,
    'questions_remaining_today', 5 - (v_daily_limit.questions_attempted + 1),
    'daily_credits_earned', v_daily_limit.credits_earned_today + v_credits_earned
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
