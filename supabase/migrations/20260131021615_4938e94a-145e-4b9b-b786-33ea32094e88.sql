-- Trust Score & Reliability Tables
CREATE TABLE trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    data_source TEXT NOT NULL,
    confidence_percentage INTEGER NOT NULL DEFAULT 0 CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    data_freshness_days INTEGER DEFAULT 0,
    data_consistency_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE decision_reliability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    decision_type TEXT NOT NULL,
    reliability_index INTEGER NOT NULL DEFAULT 0 CHECK (reliability_index >= 0 AND reliability_index <= 100),
    explanation TEXT,
    uncertainty_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE historical_accuracy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_type TEXT NOT NULL,
    prediction_made TEXT,
    actual_outcome TEXT,
    accuracy_score DECIMAL(3,2),
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fair Exchange Guardian Tables
CREATE TABLE fairness_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    total_given_hours DECIMAL(10,2) DEFAULT 0,
    total_received_hours DECIMAL(10,2) DEFAULT 0,
    give_receive_ratio DECIMAL(5,2) DEFAULT 1.00,
    fairness_score INTEGER DEFAULT 100 CHECK (fairness_score >= 0 AND fairness_score <= 100),
    one_sided_flags INTEGER DEFAULT 0,
    cooldown_until TIMESTAMPTZ,
    last_nudge_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exchange_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('give', 'receive')),
    hours DECIMAL(6,2) NOT NULL,
    partner_user_id UUID,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credi.AI Chat Tables
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    context_mode TEXT CHECK (context_mode IN ('teaching', 'learning')),
    context_session_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX idx_decision_reliability_user ON decision_reliability(user_id);
CREATE INDEX idx_historical_accuracy_user ON historical_accuracy(user_id);
CREATE INDEX idx_fairness_tracking_user ON fairness_tracking(user_id);
CREATE INDEX idx_exchange_events_user ON exchange_events(user_id);
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

-- Enable RLS
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_reliability ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trust scores" ON trust_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trust scores" ON trust_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trust scores" ON trust_scores FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own decision reliability" ON decision_reliability FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decision reliability" ON decision_reliability FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own historical accuracy" ON historical_accuracy FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own historical accuracy" ON historical_accuracy FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own historical accuracy" ON historical_accuracy FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fairness tracking" ON fairness_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fairness tracking" ON fairness_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fairness tracking" ON fairness_tracking FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exchange events" ON exchange_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exchange events" ON exchange_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversations" ON chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage messages in own conversations" ON chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid())
);