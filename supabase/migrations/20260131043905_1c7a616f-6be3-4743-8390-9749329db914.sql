-- =============================================
-- CHRONO CREDIT LEDGER SYSTEM
-- Full ACID-Compliant Transaction System
-- =============================================

-- 1. User Credit Balances Table (Cached view of user balances)
CREATE TABLE public.user_credit_balances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    held_credits INTEGER NOT NULL DEFAULT 0,
    last_ledger_entry_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Credit Ledger Table (Immutable, Append-Only)
CREATE TABLE public.credit_ledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID,
    user_id UUID NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'credit_earned',
        'credit_spent',
        'credit_adjustment',
        'credit_rollback',
        'credit_dispute_hold',
        'credit_dispute_release'
    )),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    session_id UUID,
    partner_user_id UUID,
    role TEXT CHECK (role IN ('teacher', 'learner')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Session Transactions Table (Atomic session-credit operations)
CREATE TABLE public.session_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    learner_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'rolled_back',
        'disputed'
    )),
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    credits_amount INTEGER NOT NULL DEFAULT 0,
    teacher_confirmed BOOLEAN NOT NULL DEFAULT false,
    learner_confirmed BOOLEAN NOT NULL DEFAULT false,
    teacher_confirmed_at TIMESTAMP WITH TIME ZONE,
    learner_confirmed_at TIMESTAMP WITH TIME ZONE,
    consistency_hash TEXT,
    error_message TEXT,
    recovery_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_session_transaction UNIQUE (session_id)
);

-- 4. Transaction Audit Log (For recovery and debugging)
CREATE TABLE public.transaction_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES public.session_transactions(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. WebRTC Session Rooms (For real-time video sessions)
CREATE TABLE public.session_rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.teaching_sessions(id) ON DELETE CASCADE,
    room_code TEXT NOT NULL UNIQUE,
    teacher_id UUID NOT NULL,
    learner_id UUID,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN (
        'waiting',
        'active',
        'ended',
        'cancelled'
    )),
    teacher_joined_at TIMESTAMP WITH TIME ZONE,
    learner_joined_at TIMESTAMP WITH TIME ZONE,
    session_started_at TIMESTAMP WITH TIME ZONE,
    session_ended_at TIMESTAMP WITH TIME ZONE,
    actual_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Add learner_id to teaching_sessions if not exists (for WebRTC linking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teaching_sessions' 
                   AND column_name = 'learner_id') THEN
        ALTER TABLE public.teaching_sessions ADD COLUMN learner_id UUID;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credit_balances
CREATE POLICY "Users can view their own balance"
ON public.user_credit_balances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance"
ON public.user_credit_balances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update balances"
ON public.user_credit_balances FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for credit_ledger
CREATE POLICY "Users can view their own ledger entries"
ON public.credit_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert ledger entries"
ON public.credit_ledger FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_user_id);

-- RLS Policies for session_transactions
CREATE POLICY "Users can view their own transactions"
ON public.session_transactions FOR SELECT
USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

CREATE POLICY "Teachers can insert transactions"
ON public.session_transactions FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Participants can update transactions"
ON public.session_transactions FOR UPDATE
USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- RLS Policies for transaction_audit_log
CREATE POLICY "Users can view their transaction logs"
ON public.transaction_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.session_transactions st
        WHERE st.id = transaction_audit_log.transaction_id
        AND (st.teacher_id = auth.uid() OR st.learner_id = auth.uid())
    )
);

-- RLS Policies for session_rooms
CREATE POLICY "Users can view rooms they participate in"
ON public.session_rooms FOR SELECT
USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

CREATE POLICY "Teachers can create rooms"
ON public.session_rooms FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Participants can update rooms"
ON public.session_rooms FOR UPDATE
USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- Create indexes for performance
CREATE INDEX idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_session_id ON public.credit_ledger(session_id);
CREATE INDEX idx_credit_ledger_created_at ON public.credit_ledger(created_at DESC);
CREATE INDEX idx_session_transactions_session_id ON public.session_transactions(session_id);
CREATE INDEX idx_session_transactions_teacher_id ON public.session_transactions(teacher_id);
CREATE INDEX idx_session_transactions_learner_id ON public.session_transactions(learner_id);
CREATE INDEX idx_session_rooms_room_code ON public.session_rooms(room_code);
CREATE INDEX idx_session_rooms_session_id ON public.session_rooms(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_credit_balances_updated_at
BEFORE UPDATE ON public.user_credit_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_transactions_updated_at
BEFORE UPDATE ON public.session_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_rooms_updated_at
BEFORE UPDATE ON public.session_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for session rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_ledger;