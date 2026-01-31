-- Core Platform Tables (recreating from previous schema)

-- Profiles table for user data
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher expertise table
CREATE TABLE teacher_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    expertise_text TEXT NOT NULL,
    domain_tag TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seminars table
CREATE TABLE seminars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    skill_level TEXT DEFAULT 'beginner',
    duration TEXT DEFAULT '1 hour',
    max_learners INTEGER DEFAULT 5,
    prerequisites TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teaching sessions table
CREATE TABLE teaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    learner_id UUID,
    title TEXT,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    actual_minutes INTEGER,
    credits_earned INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session requests table
CREATE TABLE session_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seminar_id UUID NOT NULL REFERENCES seminars(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    message TEXT,
    scheduled_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teaching reviews table
CREATE TABLE teaching_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teaching_sessions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL,
    learner_id UUID,
    experience_rating INTEGER NOT NULL CHECK (experience_rating >= 1 AND experience_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product reviews table (for platform reviews)
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_teacher_expertise_user ON teacher_expertise(user_id);
CREATE INDEX idx_seminars_teacher ON seminars(teacher_id);
CREATE INDEX idx_teaching_sessions_teacher ON teaching_sessions(teacher_id);
CREATE INDEX idx_teaching_sessions_learner ON teaching_sessions(learner_id);
CREATE INDEX idx_session_requests_seminar ON session_requests(seminar_id);
CREATE INDEX idx_session_requests_learner ON session_requests(learner_id);
CREATE INDEX idx_session_requests_teacher ON session_requests(teacher_id);
CREATE INDEX idx_teaching_reviews_session ON teaching_reviews(session_id);
CREATE INDEX idx_teaching_reviews_teacher ON teaching_reviews(teacher_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are publicly viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teacher expertise policies
CREATE POLICY "Expertise is publicly viewable" ON teacher_expertise FOR SELECT USING (true);
CREATE POLICY "Users can manage own expertise" ON teacher_expertise FOR ALL USING (auth.uid() = user_id);

-- Seminars policies
CREATE POLICY "Active seminars are publicly viewable" ON seminars FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers can manage own seminars" ON seminars FOR ALL USING (auth.uid() = teacher_id);

-- Teaching sessions policies
CREATE POLICY "Users can view own sessions as teacher or learner" ON teaching_sessions FOR SELECT 
    USING (auth.uid() = teacher_id OR auth.uid() = learner_id);
CREATE POLICY "Teachers can insert sessions" ON teaching_sessions FOR INSERT 
    WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own sessions" ON teaching_sessions FOR UPDATE 
    USING (auth.uid() = teacher_id);

-- Session requests policies
CREATE POLICY "Users can view own requests" ON session_requests FOR SELECT 
    USING (auth.uid() = learner_id OR auth.uid() = teacher_id);
CREATE POLICY "Learners can create requests" ON session_requests FOR INSERT 
    WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Teachers can update requests" ON session_requests FOR UPDATE 
    USING (auth.uid() = teacher_id);

-- Teaching reviews policies
CREATE POLICY "Reviews are publicly viewable" ON teaching_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews for sessions they participated in" ON teaching_reviews FOR INSERT 
    WITH CHECK (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- Product reviews policies
CREATE POLICY "Product reviews are publicly viewable" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own product reviews" ON product_reviews FOR ALL USING (auth.uid() = user_id);