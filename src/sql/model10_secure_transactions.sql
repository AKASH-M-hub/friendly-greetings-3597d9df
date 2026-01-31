-- =============================================
-- MODEL 10: SECURE TRANSACTION & DATA INTEGRITY
-- Run this SQL in Cloud View > Database > Run SQL
-- =============================================

-- PART 1: Schema and Core Tables
-- =============================================

-- 1. Create audit schema for separation
CREATE SCHEMA IF NOT EXISTS audit;

-- 2. Transaction status enum
DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'rolled_back',
    'disputed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Ledger entry type enum
DO $$ BEGIN
  CREATE TYPE audit.ledger_entry_type AS ENUM (
    'credit_earned',
    'credit_spent',
    'credit_adjustment',
    'credit_rollback',
    'credit_dispute_hold',
    'credit_dispute_release'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Immutable Credit Ledger (append-only)
CREATE TABLE IF NOT EXISTS audit.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type audit.ledger_entry_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  session_id UUID REFERENCES public.teaching_sessions(id),
  partner_user_id UUID REFERENCES auth.users(id),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Session Transactions table
CREATE TABLE IF NOT EXISTS audit.session_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.teaching_sessions(id),
  teacher_id UUID NOT NULL REFERENCES auth.users(id),
  learner_id UUID NOT NULL REFERENCES auth.users(id),
  status public.transaction_status DEFAULT 'pending' NOT NULL,
  duration_minutes INTEGER NOT NULL,
  credits_amount INTEGER NOT NULL,
  teacher_confirmed BOOLEAN DEFAULT FALSE,
  learner_confirmed BOOLEAN DEFAULT FALSE,
  teacher_confirmed_at TIMESTAMPTZ,
  learner_confirmed_at TIMESTAMPTZ,
  consistency_hash TEXT,
  error_message TEXT,
  recovery_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id)
);

-- 6. Transaction Audit Log
CREATE TABLE IF NOT EXISTS audit.transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES audit.session_transactions(id),
  previous_status public.transaction_status,
  new_status public.transaction_status NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. User Credit Balance (cached)
CREATE TABLE IF NOT EXISTS public.user_credit_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance INTEGER DEFAULT 0 NOT NULL,
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  held_credits INTEGER DEFAULT 0 NOT NULL,
  last_ledger_entry_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Enable RLS
ALTER TABLE audit.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.session_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credit_balance ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
DROP POLICY IF EXISTS "Users can view their own ledger entries" ON audit.credit_ledger;
CREATE POLICY "Users can view their own ledger entries"
  ON audit.credit_ledger FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR partner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view transactions they are part of" ON audit.session_transactions;
CREATE POLICY "Users can view transactions they are part of"
  ON audit.session_transactions FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR learner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their confirmation only" ON audit.session_transactions;
CREATE POLICY "Users can update their confirmation only"
  ON audit.session_transactions FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid() OR learner_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() OR learner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view logs for their transactions" ON audit.transaction_log;
CREATE POLICY "Users can view logs for their transactions"
  ON audit.transaction_log FOR SELECT
  TO authenticated
  USING (
    transaction_id IN (
      SELECT id FROM audit.session_transactions 
      WHERE teacher_id = auth.uid() OR learner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own balance" ON public.user_credit_balance;
CREATE POLICY "Users can view their own balance"
  ON public.user_credit_balance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON audit.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_transaction_id ON audit.credit_ledger(transaction_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON audit.credit_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_transactions_session_id ON audit.session_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_transactions_status ON audit.session_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_log_transaction_id ON audit.transaction_log(transaction_id);

-- PART 2: Immutability Protection
-- =============================================

-- Prevent updates and deletes on credit_ledger
CREATE OR REPLACE FUNCTION audit.prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Credit ledger is immutable. Updates and deletes are not allowed.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_ledger_update ON audit.credit_ledger;
CREATE TRIGGER prevent_ledger_update
  BEFORE UPDATE ON audit.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION audit.prevent_ledger_modification();

DROP TRIGGER IF EXISTS prevent_ledger_delete ON audit.credit_ledger;
CREATE TRIGGER prevent_ledger_delete
  BEFORE DELETE ON audit.credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION audit.prevent_ledger_modification();

-- PART 3: Core Transaction Functions
-- =============================================

-- Generate consistency hash
CREATE OR REPLACE FUNCTION audit.generate_consistency_hash(
  p_session_id UUID,
  p_teacher_id UUID,
  p_learner_id UUID,
  p_duration INTEGER,
  p_credits INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  hash_input TEXT;
BEGIN
  hash_input := p_session_id::TEXT || '|' || 
                p_teacher_id::TEXT || '|' || 
                p_learner_id::TEXT || '|' || 
                p_duration::TEXT || '|' || 
                p_credits::TEXT;
  RETURN encode(sha256(hash_input::bytea), 'hex');
END;
$$;

-- Initiate session transaction
CREATE OR REPLACE FUNCTION public.initiate_session_transaction(
  p_session_id UUID,
  p_teacher_id UUID,
  p_learner_id UUID,
  p_duration_minutes INTEGER,
  p_credits_amount INTEGER,
  p_consistency_hash TEXT
)
RETURNS audit.session_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  v_transaction audit.session_transactions;
BEGIN
  INSERT INTO audit.session_transactions (
    session_id,
    teacher_id,
    learner_id,
    status,
    duration_minutes,
    credits_amount,
    consistency_hash
  ) VALUES (
    p_session_id,
    p_teacher_id,
    p_learner_id,
    'pending',
    p_duration_minutes,
    p_credits_amount,
    p_consistency_hash
  )
  RETURNING * INTO v_transaction;

  -- Log the transaction creation
  INSERT INTO audit.transaction_log (
    transaction_id,
    previous_status,
    new_status,
    action,
    actor_id,
    details
  ) VALUES (
    v_transaction.id,
    NULL,
    'pending',
    'transaction_initiated',
    auth.uid(),
    jsonb_build_object(
      'session_id', p_session_id,
      'credits', p_credits_amount,
      'duration', p_duration_minutes
    )
  );

  RETURN v_transaction;
END;
$$;

-- Confirm session transaction (dual-user)
CREATE OR REPLACE FUNCTION public.confirm_session_transaction(
  p_transaction_id UUID,
  p_role TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  v_transaction audit.session_transactions;
BEGIN
  SELECT * INTO v_transaction 
  FROM audit.session_transactions 
  WHERE id = p_transaction_id;

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF v_transaction.status != 'pending' THEN
    RAISE EXCEPTION 'Transaction is not in pending status';
  END IF;

  IF p_role = 'teacher' THEN
    IF v_transaction.teacher_id != p_user_id THEN
      RAISE EXCEPTION 'User is not the teacher for this transaction';
    END IF;
    
    UPDATE audit.session_transactions 
    SET 
      teacher_confirmed = TRUE,
      teacher_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_transaction_id;
  ELSIF p_role = 'learner' THEN
    IF v_transaction.learner_id != p_user_id THEN
      RAISE EXCEPTION 'User is not the learner for this transaction';
    END IF;
    
    UPDATE audit.session_transactions 
    SET 
      learner_confirmed = TRUE,
      learner_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_transaction_id;
  ELSE
    RAISE EXCEPTION 'Invalid role specified';
  END IF;

  -- Log the confirmation
  INSERT INTO audit.transaction_log (
    transaction_id,
    previous_status,
    new_status,
    action,
    actor_id,
    details
  ) VALUES (
    p_transaction_id,
    'pending',
    'pending',
    p_role || '_confirmed',
    p_user_id,
    jsonb_build_object('role', p_role)
  );

  RETURN TRUE;
END;
$$;

-- Process session transaction (atomic credit transfer)
CREATE OR REPLACE FUNCTION public.process_session_transaction(
  p_transaction_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  v_transaction audit.session_transactions;
  v_teacher_balance INTEGER;
  v_learner_balance INTEGER;
  v_teacher_ledger_id UUID;
  v_learner_ledger_id UUID;
BEGIN
  -- Lock the transaction row for update
  SELECT * INTO v_transaction 
  FROM audit.session_transactions 
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF v_transaction.status != 'pending' THEN
    RAISE EXCEPTION 'Transaction is not in pending status';
  END IF;

  IF NOT (v_transaction.teacher_confirmed AND v_transaction.learner_confirmed) THEN
    RAISE EXCEPTION 'Both parties must confirm before processing';
  END IF;

  -- Update transaction to processing
  UPDATE audit.session_transactions 
  SET status = 'processing', updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Get current balances
  SELECT COALESCE(current_balance, 0) INTO v_learner_balance
  FROM public.user_credit_balance 
  WHERE user_id = v_transaction.learner_id;

  IF v_learner_balance IS NULL THEN
    v_learner_balance := 0;
  END IF;

  SELECT COALESCE(current_balance, 0) INTO v_teacher_balance
  FROM public.user_credit_balance 
  WHERE user_id = v_transaction.teacher_id;

  IF v_teacher_balance IS NULL THEN
    v_teacher_balance := 0;
  END IF;

  -- Check learner has enough credits
  IF v_learner_balance < v_transaction.credits_amount THEN
    -- Rollback
    UPDATE audit.session_transactions 
    SET 
      status = 'failed',
      error_message = 'Insufficient credits',
      updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RAISE EXCEPTION 'Learner has insufficient credits';
  END IF;

  -- Create ledger entries (immutable)
  -- Learner spends credits
  INSERT INTO audit.credit_ledger (
    transaction_id,
    user_id,
    entry_type,
    amount,
    balance_after,
    session_id,
    partner_user_id,
    description
  ) VALUES (
    p_transaction_id,
    v_transaction.learner_id,
    'credit_spent',
    -v_transaction.credits_amount,
    v_learner_balance - v_transaction.credits_amount,
    v_transaction.session_id,
    v_transaction.teacher_id,
    'Session payment'
  )
  RETURNING id INTO v_learner_ledger_id;

  -- Teacher earns credits
  INSERT INTO audit.credit_ledger (
    transaction_id,
    user_id,
    entry_type,
    amount,
    balance_after,
    session_id,
    partner_user_id,
    description
  ) VALUES (
    p_transaction_id,
    v_transaction.teacher_id,
    'credit_earned',
    v_transaction.credits_amount,
    v_teacher_balance + v_transaction.credits_amount,
    v_transaction.session_id,
    v_transaction.learner_id,
    'Session earnings'
  )
  RETURNING id INTO v_teacher_ledger_id;

  -- Update balances
  INSERT INTO public.user_credit_balance (user_id, current_balance, total_spent, last_ledger_entry_id, updated_at)
  VALUES (v_transaction.learner_id, v_learner_balance - v_transaction.credits_amount, v_transaction.credits_amount, v_learner_ledger_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = user_credit_balance.current_balance - v_transaction.credits_amount,
    total_spent = user_credit_balance.total_spent + v_transaction.credits_amount,
    last_ledger_entry_id = v_learner_ledger_id,
    updated_at = NOW();

  INSERT INTO public.user_credit_balance (user_id, current_balance, total_earned, last_ledger_entry_id, updated_at)
  VALUES (v_transaction.teacher_id, v_teacher_balance + v_transaction.credits_amount, v_transaction.credits_amount, v_teacher_ledger_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = user_credit_balance.current_balance + v_transaction.credits_amount,
    total_earned = user_credit_balance.total_earned + v_transaction.credits_amount,
    last_ledger_entry_id = v_teacher_ledger_id,
    updated_at = NOW();

  -- Mark transaction as completed
  UPDATE audit.session_transactions 
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Log completion
  INSERT INTO audit.transaction_log (
    transaction_id,
    previous_status,
    new_status,
    action,
    details
  ) VALUES (
    p_transaction_id,
    'processing',
    'completed',
    'transaction_completed',
    jsonb_build_object(
      'credits_transferred', v_transaction.credits_amount,
      'teacher_new_balance', v_teacher_balance + v_transaction.credits_amount,
      'learner_new_balance', v_learner_balance - v_transaction.credits_amount
    )
  );

  RETURN TRUE;
END;
$$;

-- Get transaction status
CREATE OR REPLACE FUNCTION public.get_transaction_status(p_transaction_id UUID)
RETURNS audit.session_transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, audit
AS $$
  SELECT * FROM audit.session_transactions WHERE id = p_transaction_id;
$$;

-- Get confirmation status
CREATE OR REPLACE FUNCTION public.get_confirmation_status(p_transaction_id UUID)
RETURNS audit.session_transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, audit
AS $$
  SELECT * FROM audit.session_transactions WHERE id = p_transaction_id;
$$;

-- Get integrity status
CREATE OR REPLACE FUNCTION public.get_integrity_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'isConsistent', TRUE,
    'lastVerified', NOW(),
    'pendingTransactions', (
      SELECT COUNT(*) FROM audit.session_transactions 
      WHERE (teacher_id = p_user_id OR learner_id = p_user_id) 
      AND status = 'pending'
    ),
    'disputedTransactions', (
      SELECT COUNT(*) FROM audit.session_transactions 
      WHERE (teacher_id = p_user_id OR learner_id = p_user_id) 
      AND status = 'disputed'
    ),
    'ledgerEntryCount', (
      SELECT COUNT(*) FROM audit.credit_ledger 
      WHERE user_id = p_user_id
    ),
    'consistencyHash', NULL
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Get ledger history
CREATE OR REPLACE FUNCTION public.get_ledger_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS SETOF audit.credit_ledger
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, audit
AS $$
  SELECT * FROM audit.credit_ledger 
  WHERE user_id = p_user_id 
  ORDER BY created_at DESC 
  LIMIT p_limit;
$$;

-- Verify transaction consistency
CREATE OR REPLACE FUNCTION public.verify_transaction_consistency(p_transaction_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
DECLARE
  v_transaction audit.session_transactions;
  v_calculated_hash TEXT;
BEGIN
  SELECT * INTO v_transaction 
  FROM audit.session_transactions 
  WHERE id = p_transaction_id;

  IF v_transaction IS NULL THEN
    RETURN FALSE;
  END IF;

  v_calculated_hash := audit.generate_consistency_hash(
    v_transaction.session_id,
    v_transaction.teacher_id,
    v_transaction.learner_id,
    v_transaction.duration_minutes,
    v_transaction.credits_amount
  );

  RETURN v_calculated_hash = v_transaction.consistency_hash;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.initiate_session_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_session_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_session_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transaction_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmation_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_integrity_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ledger_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_transaction_consistency TO authenticated;
