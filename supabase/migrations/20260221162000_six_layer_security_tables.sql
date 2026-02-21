-- =====================================================
-- SIX-LAYER SECURITY SYSTEM - TIMESTAMPED MIGRATION
-- Timestamp: 20260221162000
-- Purpose: Create all missing security schema tables
-- All statements use IF NOT EXISTS to be idempotent
-- =====================================================

-- =====================================================
-- LAYER 1: IDENTITY VERIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS identity_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  email_otp_sent_at TIMESTAMPTZ,
  email_otp_attempts INT DEFAULT 0,
  mobile_number VARCHAR(20),
  mobile_verified BOOLEAN DEFAULT FALSE,
  mobile_verified_at TIMESTAMPTZ,
  mobile_otp_sent_at TIMESTAMPTZ,
  mobile_otp_attempts INT DEFAULT 0,
  institutional_email VARCHAR(255),
  institutional_verified BOOLEAN DEFAULT FALSE,
  institutional_verified_at TIMESTAMPTZ,
  institution_name VARCHAR(255),
  device_fingerprint JSONB DEFAULT '[]'::jsonb,
  last_device_fingerprint TEXT,
  last_login_ip INET,
  last_login_at TIMESTAMPTZ,
  account_creation_ip INET,
  account_creation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  verification_level VARCHAR(50) DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified','email_verified','mobile_verified','institutional_verified','fully_verified')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('email','mobile','institutional')),
  otp_code VARCHAR(6) NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  login_timestamp TIMESTAMPTZ DEFAULT NOW(),
  suspicious BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_creation_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_address, created_at)
);

-- =====================================================
-- LAYER 2: STRUCTURED SKILL DECLARATION
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  requires_validation BOOLEAN DEFAULT FALSE,
  is_high_risk BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_domain_id UUID NOT NULL REFERENCES skill_domains(id) ON DELETE CASCADE,
  experience_level VARCHAR(50) NOT NULL
    CHECK (experience_level IN ('beginner','intermediate','advanced','expert')),
  teaching_scope VARCHAR(50) NOT NULL
    CHECK (teaching_scope IN ('beginner','intermediate','advanced','all_levels')),
  years_of_experience INT,
  description TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  certification_url TEXT,
  resume_url TEXT,
  verification_status VARCHAR(50) DEFAULT 'self_declared'
    CHECK (verification_status IN ('self_declared','evidence_backed','peer_reviewed','institution_verified','admin_approved')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  approval_status VARCHAR(50) DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','under_review')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, skill_domain_id)
);

CREATE TABLE IF NOT EXISTS skill_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_skill_id UUID NOT NULL REFERENCES teacher_skills(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL
    CHECK (evidence_type IN ('portfolio','certification','project','resume','reference','other')),
  file_url TEXT NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAYER 3: PERFORMANCE-BASED VALIDATION
-- =====================================================

CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES teaching_sessions(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_confirmed BOOLEAN DEFAULT FALSE,
  teacher_confirmed BOOLEAN DEFAULT FALSE,
  session_completed BOOLEAN DEFAULT FALSE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  session_quality VARCHAR(50)
    CHECK (session_quality IN ('excellent','good','average','poor','very_poor')),
  content_accuracy BOOLEAN,
  teaching_effectiveness BOOLEAN,
  communication_quality BOOLEAN,
  has_complaint BOOLEAN DEFAULT FALSE,
  complaint_text TEXT,
  complaint_category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, learner_id)
);

CREATE TABLE IF NOT EXISTS teacher_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_sessions INT DEFAULT 0,
  completed_sessions INT DEFAULT 0,
  cancelled_sessions INT DEFAULT 0,
  no_show_sessions INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  total_ratings INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  five_star_count INT DEFAULT 0,
  four_star_count INT DEFAULT 0,
  three_star_count INT DEFAULT 0,
  two_star_count INT DEFAULT 0,
  one_star_count INT DEFAULT 0,
  unique_learners INT DEFAULT 0,
  repeat_learners INT DEFAULT 0,
  repeat_learner_ratio DECIMAL(5,2) DEFAULT 0.00,
  total_complaints INT DEFAULT 0,
  resolved_complaints INT DEFAULT 0,
  complaint_rate DECIMAL(5,2) DEFAULT 0.00,
  reliability_score INT DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  visibility_level VARCHAR(50) DEFAULT 'normal'
    CHECK (visibility_level IN ('high','normal','low','hidden')),
  auto_demotion_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAYER 4: SKILL ENTRY CONTROL
-- =====================================================

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_domain_id UUID NOT NULL REFERENCES skill_domains(id) ON DELETE CASCADE,
  teacher_skill_id UUID REFERENCES teacher_skills(id) ON DELETE CASCADE,
  demo_type VARCHAR(50) NOT NULL
    CHECK (demo_type IN ('mandatory','voluntary','peer_requested')),
  demo_status VARCHAR(50) DEFAULT 'pending'
    CHECK (demo_status IN ('pending','scheduled','completed','passed','failed','cancelled')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  passed BOOLEAN,
  score INT CHECK (score >= 0 AND score <= 100),
  approved_to_teach BOOLEAN DEFAULT FALSE,
  approval_badge VARCHAR(50),
  approval_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, skill_domain_id)
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_knowledge INT CHECK (content_knowledge >= 1 AND content_knowledge <= 5),
  teaching_ability INT CHECK (teaching_ability >= 1 AND teaching_ability <= 5),
  communication_skills INT CHECK (communication_skills >= 1 AND communication_skills <= 5),
  overall_recommendation BOOLEAN,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(demo_session_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS skill_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_domain_id UUID NOT NULL REFERENCES skill_domains(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  test_type VARCHAR(50) CHECK (test_type IN ('multiple_choice','coding','project','interview')),
  passing_score INT DEFAULT 70,
  questions JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAYER 5: INSTITUTIONAL OVERSIGHT
-- =====================================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  admin_approval_required BOOLEAN DEFAULT TRUE,
  email_verification_required BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'moderator'
    CHECK (role IN ('super_admin','admin','moderator')),
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institution_id, user_id)
);

CREATE TABLE IF NOT EXISTS teacher_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  approval_status VARCHAR(50) DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','suspended','under_review')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  suspension_reason TEXT,
  suspended_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, institution_id)
);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAYER 6: BEHAVIORAL ANOMALY & LEDGER MONITORING
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type VARCHAR(100) NOT NULL
    CHECK (anomaly_type IN ('repeated_partner','short_session_spam','credit_spike','low_feedback_high_credits','collusion_detected','time_fraud','other')),
  detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
  severity VARCHAR(50) DEFAULT 'low'
    CHECK (severity IN ('low','medium','high','critical')),
  evidence JSONB,
  partner_user_id UUID REFERENCES auth.users(id),
  session_ids UUID[],
  action_taken VARCHAR(50)
    CHECK (action_taken IN ('flagged','credit_freeze','account_review','visibility_limit','suspension','resolved')),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions_together INT DEFAULT 0,
  average_session_duration INTERVAL,
  shortest_session INTERVAL,
  longest_session INTERVAL,
  suspicious_pattern BOOLEAN DEFAULT FALSE,
  pattern_type VARCHAR(100),
  last_session_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

CREATE TABLE IF NOT EXISTS credit_generation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  rule_config JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_freeze_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freeze_reason VARCHAR(255) NOT NULL,
  frozen_at TIMESTAMPTZ DEFAULT NOW(),
  unfrozen_at TIMESTAMPTZ,
  frozen_by_system BOOLEAN DEFAULT TRUE,
  frozen_by_admin_id UUID REFERENCES auth.users(id),
  credits_frozen DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active','resolved','permanent'))
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_identity_verification_user_id ON identity_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_logs_user_id ON device_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_teacher_id ON teacher_skills(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_skills_domain ON teacher_skills(skill_domain_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_teacher_id ON session_feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_performance_teacher_id ON teacher_performance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_performance_score ON teacher_performance(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_institution_admins_user_id ON institution_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_admins_institution_id ON institution_admins(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_approvals_teacher_id ON teacher_approvals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_user_id ON transaction_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_anomalies_severity ON transaction_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_session_patterns_user_partner ON session_patterns(user_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_credit_freeze_log_user_id ON credit_freeze_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_freeze_log_status ON credit_freeze_log(user_id, status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE identity_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_creation_throttle ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_generation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_freeze_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop-then-create for idempotency)
DROP POLICY IF EXISTS "Users can view own identity verification" ON identity_verification;
CREATE POLICY "Users can view own identity verification"
  ON identity_verification FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own identity verification" ON identity_verification;
CREATE POLICY "Users can update own identity verification"
  ON identity_verification FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own identity verification" ON identity_verification;
CREATE POLICY "Users can insert own identity verification"
  ON identity_verification FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view skill domains" ON skill_domains;
CREATE POLICY "Anyone can view skill domains"
  ON skill_domains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view approved teacher skills" ON teacher_skills;
CREATE POLICY "Anyone can view approved teacher skills"
  ON teacher_skills FOR SELECT USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Teachers can manage own skills" ON teacher_skills;
CREATE POLICY "Teachers can manage own skills"
  ON teacher_skills FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Learners can create feedback" ON session_feedback;
CREATE POLICY "Learners can create feedback"
  ON session_feedback FOR INSERT WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "Users can view own session feedback" ON session_feedback;
CREATE POLICY "Users can view own session feedback"
  ON session_feedback FOR SELECT USING (auth.uid() = learner_id OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Anyone can view teacher performance" ON teacher_performance;
CREATE POLICY "Anyone can view teacher performance"
  ON teacher_performance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can view own institution admin record" ON institution_admins;
CREATE POLICY "Admins can view own institution admin record"
  ON institution_admins FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own anomalies" ON transaction_anomalies;
CREATE POLICY "Users can view own anomalies"
  ON transaction_anomalies FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert anomalies" ON transaction_anomalies;
CREATE POLICY "System can insert anomalies"
  ON transaction_anomalies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own credit freeze log" ON credit_freeze_log;
CREATE POLICY "Users can view own credit freeze log"
  ON credit_freeze_log FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own session patterns" ON session_patterns;
CREATE POLICY "Users can view own session patterns"
  ON session_patterns FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_teacher_reliability_score(teacher_uuid UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_weight DECIMAL := 0.35;
  rating_weight DECIMAL := 0.30;
  retention_weight DECIMAL := 0.20;
  complaint_weight DECIMAL := 0.15;
  completion_score INT;
  rating_score INT;
  retention_score INT;
  complaint_penalty INT;
  final_score INT;
BEGIN
  SELECT COALESCE(
    CASE
      WHEN completed_sessions >= 10 THEN (completion_rate * completion_weight * 100)::INT
      ELSE ((completed_sessions::DECIMAL / 10) * completion_rate * completion_weight * 100)::INT
    END, 0)
  INTO completion_score
  FROM teacher_performance WHERE teacher_id = teacher_uuid;

  SELECT COALESCE((average_rating / 5.0 * rating_weight * 100)::INT, 0)
  INTO rating_score
  FROM teacher_performance WHERE teacher_id = teacher_uuid;

  SELECT COALESCE((repeat_learner_ratio * retention_weight * 100)::INT, 0)
  INTO retention_score
  FROM teacher_performance WHERE teacher_id = teacher_uuid;

  SELECT COALESCE(
    CASE
      WHEN complaint_rate > 0.20 THEN 15
      WHEN complaint_rate > 0.10 THEN 10
      WHEN complaint_rate > 0.05 THEN 5
      ELSE 0
    END, 0)
  INTO complaint_penalty
  FROM teacher_performance WHERE teacher_id = teacher_uuid;

  final_score := GREATEST(0, LEAST(100,
    completion_score + rating_score + retention_score - complaint_penalty + 15
  ));
  RETURN final_score;
END;
$$;

CREATE OR REPLACE FUNCTION update_teacher_performance_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO teacher_performance (teacher_id, total_ratings, average_rating)
  VALUES (NEW.teacher_id, 1, NEW.rating)
  ON CONFLICT (teacher_id) DO UPDATE SET
    total_ratings = teacher_performance.total_ratings + 1,
    average_rating = (
      (teacher_performance.average_rating * teacher_performance.total_ratings + NEW.rating)
      / (teacher_performance.total_ratings + 1)
    ),
    five_star_count  = CASE WHEN NEW.rating = 5 THEN teacher_performance.five_star_count  + 1 ELSE teacher_performance.five_star_count  END,
    four_star_count  = CASE WHEN NEW.rating = 4 THEN teacher_performance.four_star_count  + 1 ELSE teacher_performance.four_star_count  END,
    three_star_count = CASE WHEN NEW.rating = 3 THEN teacher_performance.three_star_count + 1 ELSE teacher_performance.three_star_count END,
    two_star_count   = CASE WHEN NEW.rating = 2 THEN teacher_performance.two_star_count   + 1 ELSE teacher_performance.two_star_count   END,
    one_star_count   = CASE WHEN NEW.rating = 1 THEN teacher_performance.one_star_count   + 1 ELSE teacher_performance.one_star_count   END,
    total_complaints = CASE WHEN NEW.has_complaint THEN teacher_performance.total_complaints + 1 ELSE teacher_performance.total_complaints END,
    complaint_rate = CASE
      WHEN teacher_performance.total_sessions > 0
      THEN (teacher_performance.total_complaints::DECIMAL / teacher_performance.total_sessions * 100)
      ELSE 0
    END,
    updated_at = NOW();

  UPDATE teacher_performance
  SET reliability_score = calculate_teacher_reliability_score(NEW.teacher_id)
  WHERE teacher_id = NEW.teacher_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_teacher_performance ON session_feedback;
CREATE TRIGGER trigger_update_teacher_performance
AFTER INSERT OR UPDATE ON session_feedback
FOR EACH ROW EXECUTE FUNCTION update_teacher_performance_metrics();

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO skill_domains (name, category, requires_validation, is_high_risk, description) VALUES
  ('Web Development',       'Technology',   TRUE,  TRUE,  'HTML, CSS, JavaScript, React, Node.js'),
  ('Mobile App Development','Technology',   TRUE,  TRUE,  'iOS, Android, React Native, Flutter'),
  ('Data Science',          'Technology',   TRUE,  TRUE,  'Python, Machine Learning, Data Analysis'),
  ('Career Counseling',     'Professional', TRUE,  FALSE, 'Resume building, Interview prep, Career planning'),
  ('Graphic Design',        'Design',       FALSE, FALSE, 'Photoshop, Illustrator, Figma'),
  ('Music Theory',          'Arts',         FALSE, FALSE, 'Composition, Reading music, Instruments'),
  ('Language Learning',     'Education',    FALSE, FALSE, 'English, Spanish, French, etc.'),
  ('Fitness Training',      'Health',       FALSE, FALSE, 'Workout routines, Nutrition basics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO credit_generation_rules (rule_name, rule_type, rule_config) VALUES
  ('Minimum Session Duration', 'duration',     '{"minimum_minutes": 15}'::jsonb),
  ('Dual Confirmation Required','confirmation', '{"learner_confirm": true, "teacher_confirm": true}'::jsonb),
  ('Maximum Sessions Per Day',  'throttle',     '{"max_sessions": 10}'::jsonb),
  ('Repeated Partner Limit',    'anti_abuse',   '{"max_repeated_sessions": 15, "window_days": 30}'::jsonb)
ON CONFLICT DO NOTHING;
