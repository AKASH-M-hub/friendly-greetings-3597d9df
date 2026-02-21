-- Credit Mining Engine
-- Handles the transfer of credits based on time

CREATE OR REPLACE FUNCTION public.process_session_tick(
  p_session_id UUID, 
  p_duration_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as database owner to bypass RLS for ledger updates
AS $$
DECLARE
  v_session RECORD;
  v_teacher_id UUID;
  v_learner_id UUID;
  v_learner_balance INTEGER;
  v_credits_to_transfer INTEGER;
  v_previous_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- 1. Get Session Info
  SELECT * INTO v_session 
  FROM public.teaching_sessions 
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  v_teacher_id := v_session.teacher_id;
  v_learner_id := v_session.learner_id;

  -- 2. Validate Participants
  IF v_learner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No learner in session');
  END IF;

  -- 3. Calculate Credits Scored (1 min = 1 credit)
  -- We assume p_duration_seconds is the TOTAL duration so far.
  -- We calculate how many credits SHOULD have been transferred vs how many HAVE been.
  v_new_credits := floor(p_duration_seconds / 60);
  v_previous_credits := COALESCE(v_session.credits_earned, 0);
  
  v_credits_to_transfer := v_new_credits - v_previous_credits;

  IF v_credits_to_transfer <= 0 THEN
    RETURN jsonb_build_object('success', true, 'transferred', 0, 'message', 'No new minute passed');
  END IF;

  -- 4. Check Learner Balance
  SELECT current_balance INTO v_learner_balance
  FROM public.user_credit_balances
  WHERE user_id = v_learner_id;

  IF v_learner_balance < v_credits_to_transfer THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- 5. Execute Transfer (Atomic)
  
  -- Deduct from Learner
  UPDATE public.user_credit_balances
  SET current_balance = current_balance - v_credits_to_transfer,
      total_spent = total_spent + v_credits_to_transfer,
      updated_at = NOW()
  WHERE user_id = v_learner_id;

  INSERT INTO public.credit_ledger (user_id, amount, entry_type, description, balance_after, session_id)
  VALUES (v_learner_id, -v_credits_to_transfer, 'learning', 'Session minute cost', v_learner_balance - v_credits_to_transfer, p_session_id);

  -- Add to Teacher
  UPDATE public.user_credit_balances
  SET current_balance = current_balance + v_credits_to_transfer,
      total_earned = total_earned + v_credits_to_transfer,
      updated_at = NOW()
  WHERE user_id = v_teacher_id;

  -- (We need teacher's new balance for the ledger log, fetching it or calculating)
  -- For simplicity, just subquerying or blindly adding. Let's do subquery for accuracy in logs.
  INSERT INTO public.credit_ledger (user_id, amount, entry_type, description, balance_after, session_id)
  SELECT 
    v_teacher_id, 
    v_credits_to_transfer, 
    'teaching', 
    'Session minute earning', 
    current_balance, 
    p_session_id
  FROM public.user_credit_balances WHERE user_id = v_teacher_id;

  -- 6. Update Session Stats
  UPDATE public.teaching_sessions
  SET credits_earned = v_new_credits,
      actual_minutes = floor(p_duration_seconds / 60),
      updated_at = NOW()
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'transferred', v_credits_to_transfer);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
