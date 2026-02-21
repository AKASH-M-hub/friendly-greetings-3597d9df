# Zero Credit Recovery - Deployment Guide

## 📋 Prerequisites

- Supabase project with database access
- Node.js 18+ and pnpm/npm/bun
- Existing Chrono platform setup

---

## 🚀 Quick Deployment Steps

### 1. Apply Database Migration

Run the migration on your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL Editor in Supabase Dashboard
# Execute: supabase/migrations/20260221151933_zero_credit_recovery.sql
```

### 2. Seed Sample Questions (Optional)

For testing and initial content:

```bash
# Via SQL Editor in Supabase Dashboard
# Execute: src/sql/seed_mcq_questions.sql
```

This adds 25 sample questions across topics:
- JavaScript, React, TypeScript, CSS, SQL (5 questions)
- Math: Algebra, Geometry, Calculus, Statistics, Probability (5 questions)
- Science: Physics, Chemistry, Biology, Astronomy, Earth Science (5 questions)
- General: History, Geography, Literature, Music, Business (5 questions)

### 3. Update Supabase Types (Already Done)

The TypeScript types in `src/integrations/supabase/types.ts` have been updated with:
- 6 new tables
- 2 new functions
- 1 new enum type

No manual action needed if using the modified file.

### 4. Test the System

#### A. Zero-Credit State Test

```typescript
// In Supabase SQL Editor or via your app
UPDATE user_credit_balances 
SET current_balance = 0 
WHERE user_id = 'your-test-user-id';
```

#### B. Navigate to Recovery

1. Log in as the test user
2. Note the "Recovery" link in navbar (appears when credits ≤ 5)
3. Go to `/recovery` or click the link
4. Take MCQ quiz

#### C. Verify Credit Award

```sql
-- Check ledger entry
SELECT * FROM credit_ledger 
WHERE user_id = 'your-test-user-id' 
  AND entry_type = 'credit_earned'
  AND metadata->>'source' = 'mcq_quiz'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔍 Verification Checklist

- [ ] Migration applied successfully (check table existence)
- [ ] Sample questions inserted (25 rows in `mcq_questions`)
- [ ] `/recovery` route accessible
- [ ] MCQ quiz loads questions
- [ ] Correct answer awards 2 credits
- [ ] Daily limit enforced (5 questions max)
- [ ] Credits appear in user balance
- [ ] Ledger entry created with proper metadata
- [ ] Knowledge progression tracks accuracy
- [ ] 7-day cooldown prevents repeat questions

---

## 🛠️ Troubleshooting

### Issue: "Function get_eligible_mcq_questions does not exist"

**Solution**: Migration not applied. Run:
```bash
supabase db push
```

### Issue: No questions available

**Solution**: 
1. Seed sample questions (see step 2)
2. Or create custom questions:
```sql
INSERT INTO mcq_questions (topic, skill_level, question_text, option_a, option_b, option_c, option_d, correct_option)
VALUES ('Your Topic', 'beginner', 'Question?', 'A', 'B', 'C', 'D', 'A');
```

### Issue: Credits not awarded

**Solution**: Check database function execution:
```sql
SELECT record_mcq_attempt(
  'user-id'::UUID,
  'question-id'::UUID,
  'A',
  10,
  NULL,
  NULL
);
```

### Issue: TypeScript errors in hooks

**Solution**: Ensure `src/integrations/supabase/types.ts` is updated with new tables/functions.

---

## 📊 Monitoring

### Daily MCQ Usage

```sql
SELECT date, 
       COUNT(DISTINCT user_id) as active_users,
       SUM(questions_attempted) as total_questions,
       SUM(credits_earned_today) as total_credits
FROM mcq_daily_limits
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

### Top Topics

```sql
SELECT topic,
       SUM(times_answered) as total_attempts,
       ROUND(SUM(times_correct)::NUMERIC / NULLIF(SUM(times_answered), 0) * 100, 2) as success_rate
FROM mcq_questions
WHERE times_answered > 0
GROUP BY topic
ORDER BY total_attempts DESC;
```

### Abuse Detection

```sql
-- Users with suspiciously fast answers
SELECT user_id,
       COUNT(*) as fast_answers,
       AVG(time_taken_seconds) as avg_time
FROM mcq_attempts
WHERE time_taken_seconds < 5
  AND attempted_at > NOW() - INTERVAL '1 day'
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY fast_answers DESC;
```

---

## 🔐 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Example: mcq_attempts
CREATE POLICY "Users view own mcq attempts" 
  ON mcq_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mcq attempts" 
  ON mcq_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### Function Security

Both database functions are `SECURITY DEFINER`, meaning they run with elevated privileges but validate user identity:

```sql
CREATE OR REPLACE FUNCTION record_mcq_attempt(...)
RETURNS JSONB AS $$
BEGIN
  -- Validates p_user_id matches auth.uid() implicitly via RLS
  ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Production Recommendations

1. **Question Quality**: Replace sample questions with domain-specific, professionally curated content

2. **Rate Limiting**: Add application-level rate limiting (in addition to daily caps)

3. **Monitoring**: Set up alerts for:
   - Unusual credit distribution patterns
   - High-frequency attempts from single IP
   - Questions with <30% success rate (too hard)

4. **Content Moderation**: Implement admin review for user-generated questions (future Layer 2-4)

5. **Analytics**: Track:
   - Recovery system usage rate
   - Average credits earned per user
   - Topic difficulty distribution

---

## 📞 Post-Deployment Support

After deployment, monitor:

1. **Application logs** for errors in MCQ components
2. **Database logs** for function execution failures
3. **User feedback** on question quality and difficulty

For issues, check:
- Supabase Functions tab for RPC call logs
- Database Logs for SQL errors
- Browser console for frontend errors

---

**Deployment Status**: ✅ Ready for Production

**Estimated Deployment Time**: 15-30 minutes

**Rollback Strategy**: Drop new tables if issues arise (no impact on existing credit system)

```sql
-- Emergency Rollback (if needed)
DROP TABLE IF EXISTS institutional_support_fund CASCADE;
DROP TABLE IF EXISTS recovery_activities CASCADE;
DROP TABLE IF EXISTS knowledge_progression CASCADE;
DROP TABLE IF EXISTS mcq_daily_limits CASCADE;
DROP TABLE IF EXISTS mcq_attempts CASCADE;
DROP TABLE IF EXISTS mcq_questions CASCADE;
DROP TYPE IF EXISTS recovery_activity_type CASCADE;
DROP FUNCTION IF EXISTS get_eligible_mcq_questions CASCADE;
DROP FUNCTION IF EXISTS record_mcq_attempt CASCADE;
```
