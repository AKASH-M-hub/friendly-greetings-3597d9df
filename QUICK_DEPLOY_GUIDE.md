# 🚀 DEPLOY NOW - Quick Guide

## ✅ **Step 1: Deploy to Supabase (5 minutes)**

### Option A: Supabase Dashboard (RECOMMENDED)

1. **Go to**: https://supabase.com/dashboard/project/nwpjymhpfdsmiakfjoxf
2. **Click**: SQL Editor (left sidebar)
3. **Click**: "+ New Query"
4. **Copy/Paste**: The entire contents of `DEPLOY_NOW.sql`
5. **Click**: Run (or press Ctrl+Enter)
6. **Wait**: ~10 seconds for execution
7. **Verify**: Check bottom output shows "DEPLOYMENT COMPLETE ✅"

### Verification Queries

Run these in SQL Editor to confirm:

```sql
-- Check tables exist (should return 6)
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'mcq_questions',
    'mcq_attempts',
    'mcq_daily_limits',
    'knowledge_progression',
    'recovery_activities',
    'institutional_support_fund'
  );

-- Check sample questions (should return 5)
SELECT COUNT(*) FROM public.mcq_questions;

-- Check functions exist (should return 2)
SELECT COUNT(*)
FROM pg_proc
WHERE proname IN ('get_eligible_mcq_questions', 'record_mcq_attempt');
```

Expected Results:
- ✅ First query: 6 tables
- ✅ Second query: 5 questions
- ✅ Third query: 2 functions

---

## ✅ **Step 2: Test the App (2 minutes)**

### Start Development Server

```bash
cd D:\projects\chrono\friendly-greetings-3597d9df
npm run dev
# or
bun dev
```

### Test Recovery System

1. **Login** to your app (http://localhost:8080)
2. **Set credits to 0** (in Supabase SQL Editor):
   ```sql
   UPDATE public.user_credit_balances
   SET current_balance = 0
   WHERE user_id = (
     SELECT id FROM auth.users
     WHERE email = 'your-email@example.com'
     LIMIT 1
   );
   ```
3. **Refresh** the app
4. **Check**: "Recovery" link appears in navbar
5. **Click**: Recovery link → Navigate to `/recovery`
6. **Take Quiz**: Answer a question
7. **Verify**: Credits awarded (check balance and ledger)

---

## ✅ **Step 3: Verify Credits Work**

### Check Ledger Entry

```sql
SELECT 
  id,
  user_id,
  amount,
  entry_type,
  description,
  balance_after,
  metadata->>'source' as source,
  created_at
FROM public.credit_ledger
WHERE metadata->>'source' = 'mcq_quiz'
ORDER BY created_at DESC
LIMIT 5;
```

Should show:
- ✅ `entry_type`: "credit_earned"
- ✅ `amount`: 2
- ✅ `description`: "MCQ Quiz: [topic]"
- ✅ `source`: "mcq_quiz"

---

## 🔧 **Troubleshooting**

### Error: "Function does not exist"
**Solution**: Re-run Step 1, ensure entire `DEPLOY_NOW.sql` executed

### Error: "Table does not exist"
**Solution**: Check RLS policies, ensure migrations completed

### No questions available
**Solution**: Run seed section from `DEPLOY_NOW.sql` again

### Credits not awarded
**Solution**: Check user_credit_balances table exists and has row for user

---

## 📊 **Quick Status Check**

Run this query to see system health:

```sql
SELECT 
  (SELECT COUNT(*) FROM mcq_questions WHERE is_active = true) as active_questions,
  (SELECT COUNT(DISTINCT user_id) FROM mcq_attempts WHERE attempted_at >= CURRENT_DATE) as users_today,
  (SELECT SUM(credits_earned_today) FROM mcq_daily_limits WHERE date = CURRENT_DATE) as credits_earned_today;
```

---

## ✅ **You're Done!**

The Zero Credit Recovery system is now live! Users with ≤5 credits will see:
- 🔗 Recovery link in navbar
- 🧠 MCQ quiz at `/recovery`
- 💰 2 credits per correct answer
- 📊 Knowledge progression tracking

**Time to Deploy**: ~7 minutes total
**Status**: 🟢 Production Ready
