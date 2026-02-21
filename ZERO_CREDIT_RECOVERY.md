# Zero Credit Recovery System

## Overview

The **Zero Credit Recovery System** provides a comprehensive, multi-layered approach to help learners earn credits when their balance reaches zero. It prevents economic lockout while maintaining platform integrity through anti-abuse safeguards.

---

## 🎯 Core Philosophy

**Economic Lockout Prevention**: No learner should be permanently excluded from the platform due to credit scarcity.

**Value-Based Recovery**: All recovery methods require active contribution—knowledge demonstration, teaching, or community participation.

**Anti-Inflation Safeguards**: Daily limits, cooldown periods, and verification systems prevent credit farming and maintain economic balance.

---

## 📊 System Architecture

### 4-Layer Recovery Model

#### **Layer 1: MCQ Knowledge Quiz** 🧠
- **Type**: Automated, Instant
- **Credits**: 2 credits per correct answer
- **Daily Limit**: 5 questions max (10 credits/day)
- **Requirements**: 
  - Topics from completed learning sessions
  - 7-day cooldown per question
  - Minimum 5 seconds per answer
- **Use Case**: Immediate credit recovery for active learners

#### **Layer 2: Peer Teaching** 👥
- **Type**: Semi-Automated
- **Credits**: 1 credit per micro-session
- **Duration**: 5-10 minutes
- **Requirements**: 
  - 70% mastery score on topic
  - Teaching readiness badge
- **Use Case**: Quick sessions to rebuild teaching reputation
- **Status**: Coming Soon

#### **Layer 3: Knowledge Contribution** 📝
- **Type**: Manual Verification
- **Credits**: 1-3 credits per contribution
- **Types**: 
  - Notes/Documents: 1-2 credits
  - Diagrams/Visuals: 2-3 credits
  - Q&A Solutions: 1-2 credits
- **Verification**: Community vote or moderator approval
- **Status**: Coming Soon

#### **Layer 4: Assisted Co-Teaching** 🤝
- **Type**: Mentor-Supervised
- **Credits**: 3-5 credits per session
- **Duration**: 15-30 minutes
- **Requirements**: 
  - Mentor partnership approval
  - Good standing history
- **Use Case**: Rebuild trust after disputes or low ratings
- **Status**: Coming Soon

#### **Layer 5: Institutional Support** 🏛️
- **Type**: Application-Based
- **Credits**: 5-20 credits (one-time)
- **Sources**: 
  - Platform reserve fund
  - Foundation scholarships
  - Emergency hardship support
- **Requirements**: Application with justification
- **Status**: Coming Soon

---

## 🧩 Database Schema

### Tables

#### `mcq_questions`
Stores quiz questions generated from session topics.

```sql
CREATE TABLE mcq_questions (
  id UUID PRIMARY KEY,
  session_id UUID, -- Source session
  topic TEXT NOT NULL,
  skill_level TEXT, -- beginner/intermediate/advanced
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT CHECK (correct_option IN ('A','B','C','D')),
  explanation TEXT,
  difficulty_score INTEGER (1-5),
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

#### `mcq_attempts`
Tracks user quiz attempts with anti-abuse metadata.

```sql
CREATE TABLE mcq_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  question_id UUID REFERENCES mcq_questions(id),
  selected_option TEXT,
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  credits_earned INTEGER DEFAULT 0,
  ip_address TEXT, -- Anti-abuse tracking
  session_fingerprint TEXT -- Browser fingerprint
);
```

#### `mcq_daily_limits`
Enforces daily quiz limits per user.

```sql
CREATE TABLE mcq_daily_limits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE DEFAULT CURRENT_DATE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  credits_earned_today INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

#### `knowledge_progression`
Tracks user mastery and teaching readiness.

```sql
CREATE TABLE knowledge_progression (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  topic TEXT,
  skill_confidence_level INTEGER (0-100),
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_score INTEGER (0-100),
  last_practiced_at TIMESTAMPTZ,
  teaching_readiness BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, topic)
);
```

---

## 🔐 Anti-Abuse Mechanisms

### MCQ Quiz Safeguards

1. **Daily Limits**
   - Max 5 questions per day
   - Max 10 credits per day from MCQ
   - Reset at midnight UTC

2. **Question Cooldowns**
   - 7-day cooldown per question
   - Prevents memorization abuse
   - Questions from user's completed sessions prioritized

3. **Time Validation**
   - Minimum 5 seconds per answer
   - Prevents instant-click farming
   - Time tracking in `mcq_attempts`

4. **IP & Fingerprint Logging**
   - Tracks IP address per attempt
   - Browser fingerprinting
   - Enables pattern detection for multi-account abuse

5. **Credit Ledger Integration**
   - All MCQ credits logged in `credit_ledger`
   - Entry type: `credit_earned` with metadata `{source: 'mcq_quiz'}`
   - Auditable transaction history

---

## 🚀 Usage

### For Users

#### Accessing Recovery Dashboard
Navigate to `/recovery` when credit balance ≤ 5.

#### Taking MCQ Quiz
1. Click "MCQ Quiz" tab
2. Answer questions from your completed session topics
3. Submit answer to see immediate feedback
4. Correct answers award 2 credits instantly

#### Checking Progression
View your knowledge progression card showing:
- Mastery score per topic
- Teaching readiness badges
- Questions answered vs. correct

### For Developers

#### Check if User Needs Recovery
```typescript
import { useCreditLedger } from '@/hooks/useCreditLedger';

const { balance } = useCreditLedger();
const needsRecovery = balance.current_balance <= 0;
```

#### Fetch Eligible Questions
```typescript
const { data } = await supabase.rpc('get_eligible_mcq_questions', {
  p_user_id: userId,
  p_limit: 5
});
```

#### Submit MCQ Answer
```typescript
const { data } = await supabase.rpc('record_mcq_attempt', {
  p_user_id: userId,
  p_question_id: questionId,
  p_selected_option: 'B',
  p_time_taken_seconds: 15
});
```

---

## 📈 Credit Economics

### MCQ System Impact

- **Daily Cap**: 10 credits max per user
- **Platform Daily Max** (1000 users): 10,000 credits/day
- **Average Earn Rate**: ~4 credits/day (assuming 40% accuracy)
- **Inflation Control**: Fixed daily cap prevents exponential growth

### Recovery Layer Credits Summary

| Layer | Credits/Action | Daily Limit | Verification | Economic Impact |
|-------|----------------|-------------|--------------|-----------------|
| MCQ Quiz | 2 | 10/day | Automatic | Low (capped) |
| Peer Teaching | 1 | Unlimited | Automatic + Rating | Medium (time-limited) |
| Contributions | 1-3 | Unlimited | Manual | Low (verification bottleneck) |
| Co-Teaching | 3-5 | Unlimited | Mentor Approval | Low (partnership required) |
| Institutional | 5-20 | One-time | Application | Negligible (reserve fund) |

---

## 🛠️ Technical Implementation

### Frontend Components

- **`ZeroCreditRecovery.tsx`**: Main recovery dashboard with 5 tabs
- **`MCQQuiz.tsx`**: Interactive quiz UI with real-time feedback
- **`useMCQQuiz.ts`**: React hook for quiz state management

### Backend Functions

- **`get_eligible_mcq_questions()`**: Fetches questions with cooldown logic
- **`record_mcq_attempt()`**: Processes answer, awards credits, updates progression

### Database Migrations

- **`20260221151933_zero_credit_recovery.sql`**: Full schema creation
- **`seed_mcq_questions.sql`**: Sample 25 questions across topics

---

## 🧪 Testing

### Manual Testing Steps

1. **Setup Test User**
   ```sql
   -- Set user balance to 0
   UPDATE user_credit_balances 
   SET current_balance = 0 
   WHERE user_id = 'test-user-id';
   ```

2. **Seed Questions**
   ```bash
   psql -U postgres -d chrono -f src/sql/seed_mcq_questions.sql
   ```

3. **Test Quiz Flow**
   - Navigate to `/recovery`
   - Take MCQ quiz
   - Verify credit award in ledger
   - Check daily limit enforcement

4. **Test Anti-Abuse**
   - Attempt 6th question (should fail)
   - Re-attempt same question within 7 days (should not appear)
   - Submit answer < 5 seconds (should warn/reject)

---

## 📦 Files Created

### Migration Files
- `supabase/migrations/20260221151933_zero_credit_recovery.sql`
- `src/sql/zero_credit_recovery.sql`
- `src/sql/seed_mcq_questions.sql`

### Types
- `src/types/recovery.ts`

### Hooks
- `src/hooks/useMCQQuiz.ts`

### Components
- `src/components/credits/MCQQuiz.tsx`
- `src/components/credits/ZeroCreditRecovery.tsx`

### Pages
- `src/pages/Recovery.tsx`

### Integration Updates
- `src/integrations/supabase/types.ts` (added 6 new tables, 2 functions, 1 enum)
- `src/App.tsx` (added `/recovery` route)
- `src/components/layout/TopNavbar.tsx` (added Recovery nav link when credits ≤ 5)

---

## 🔮 Roadmap

- [x] MCQ Quiz System (Layer 1)
- [ ] Peer Teaching Micro-Sessions (Layer 2)
- [ ] Knowledge Contribution System (Layer 3)
- [ ] Assisted Co-Teaching (Layer 4)
- [ ] Institutional Support Applications (Layer 5)
- [ ] Admin dashboard for verification workflows
- [ ] Automated question generation from session transcripts
- [ ] ML-based abuse detection
- [ ] Mobile-optimized recovery flow

---

## 💡 Best Practices

### For Platform Admins
- Monitor daily MCQ credit distribution
- Review abuse patterns in `mcq_attempts`
- Adjust daily limits if inflation detected
- Curate high-quality questions

### For Users
- Complete learning sessions to unlock topic-specific questions
- Aim for >70% accuracy to earn teaching readiness
- Use recovery as temporary bridge, not primary income
- Contribute back through peer teaching once credits recovered

---

## 📞 Support

For issues or questions:
- Check logs: `SELECT * FROM mcq_attempts WHERE user_id = 'your-id'`
- Verify daily limits: `SELECT * FROM mcq_daily_limits WHERE user_id = 'your-id'`
- Review progression: `SELECT * FROM knowledge_progression WHERE user_id = 'your-id'`

---

**Status**: ✅ Production Ready (Layer 1 - MCQ Quiz)

**Last Updated**: 2026-02-21
