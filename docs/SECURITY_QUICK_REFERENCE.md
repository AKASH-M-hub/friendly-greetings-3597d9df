# 🔐 Six-Layer Security System - Quick Reference

## 🎯 Layer Overview

| Layer | Purpose | Key Tables | React Hook |
|-------|---------|------------|------------|
| 1️⃣ Identity | Email/Mobile/Device verification | `identity_verification`, `otp_codes` | `useIdentityVerification` |
| 2️⃣ Skills | Skill declaration & evidence | `teacher_skills`, `skill_domains` | `useTeacherSkills` |
| 3️⃣ Performance | Dynamic credibility scoring | `session_feedback`, `teacher_performance` | `useTeacherPerformance` |
| 4️⃣ Entry Control | Demo sessions for high-risk skills | `demo_sessions`, `peer_reviews` | *(TBD)* |
| 5️⃣ Oversight | Admin approval & monitoring | `teacher_approvals`, `institutions` | `useAdminDashboard` |
| 6️⃣ Anomaly | Collusion & fraud detection | `transaction_anomalies`, `session_patterns` | `useBehavioralMonitoring` |

## 📦 Database Schema

### Total Tables: 25

#### Layer 1 (4 tables)
- `identity_verification` - User verification status
- `otp_codes` - Temporary OTP storage
- `device_logs` - Device fingerprint history
- `account_creation_throttle` - Anti-bot protection

#### Layer 2 (3 tables)
- `skill_domains` - Available skill categories
- `teacher_skills` - Teacher skill declarations
- `skill_evidence` - Evidence files (portfolio, certs)

#### Layer 3 (2 tables)
- `session_feedback` - Post-session ratings & reviews
- `teacher_performance` - Aggregated teacher metrics

#### Layer 4 (3 tables)
- `demo_sessions` - Entry control for high-risk skills
- `peer_reviews` - Peer validation results
- `skill_tests` - Optional skill assessments

#### Layer 5 (5 tables)
- `institutions` - Campus/organization config
- `institution_admins` - Admin user roles
- `teacher_approvals` - Teacher approval workflow
- `admin_activity_log` - Audit trail

#### Layer 6 (4 tables)
- `transaction_anomalies` - Detected suspicious behavior
- `session_patterns` - User interaction patterns
- `credit_generation_rules` - Validation rules
- `credit_freeze_log` - Temporary credit suspensions

## 🎨 React Hooks Usage

### Layer 1: Identity Verification

```tsx
import { useIdentityVerification } from '@/hooks/useIdentityVerification';

function VerificationPage() {
  const {
    verification,
    sendOTP,
    verifyOTP,
    isVerified,
    getVerificationProgress,
  } = useIdentityVerification();
  
  const progress = getVerificationProgress(); // 0-100
  const canTeach = isVerified('email_verified'); // true/false
  
  return (
    <div>
      <p>Verification: {progress}% complete</p>
      <button onClick={() => sendOTP('email', 'user@example.com')}>
        Send OTP
      </button>
    </div>
  );
}
```

### Layer 2: Teacher Skills

```tsx
import { useTeacherSkills } from '@/hooks/useTeacherSkills';

function SkillsPage() {
  const {
    skills,
    domains,
    submitSkill,
    getApprovedSkills,
    canTeach,
  } = useTeacherSkills();
  
  const approvedSkills = getApprovedSkills();
  const canTeachPython = canTeach('python-domain-id');
  
  const handleSubmit = async () => {
    await submitSkill({
      skill_domain_id: 'domain-id',
      experience_level: 'advanced',
      teaching_scope: 'all_levels',
      description: 'I have 5 years experience...',
      github_url: 'https://github.com/username',
    });
  };
  
  return <div>{approvedSkills.length} approved skills</div>;
}
```

### Layer 3: Teacher Performance

```tsx
import { useTeacherPerformance } from '@/hooks/useTeacherPerformance';

function PerformanceCard({ teacherId }) {
  const {
    performance,
    getPerformanceBreakdown,
    getRatingDistribution,
    meetsMinimumStandards,
  } = useTeacherPerformance(teacherId);
  
  const metrics = getPerformanceBreakdown();
  // { reliability: 85, rating: 88, completion: 95, retention: 70 }
  
  const ratings = getRatingDistribution();
  // [{ stars: 5, count: 45 }, { stars: 4, count: 12 }, ...]
  
  return (
    <div>
      <p>Reliability Score: {performance?.reliability_score}/100</p>
      <p>Average Rating: {performance?.average_rating}/5</p>
      <p>Meets Standards: {meetsMinimumStandards() ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Layer 5: Admin Dashboard

```tsx
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

function AdminPanel() {
  const {
    isAdmin,
    pendingApprovals,
    anomalies,
    processApproval,
    suspendTeacher,
    getDashboardStats,
  } = useAdminDashboard();
  
  if (!isAdmin) return <p>Unauthorized</p>;
  
  const stats = getDashboardStats();
  // { pending_approvals: 5, flagged_users: 2, unresolved_anomalies: 3 }
  
  const handleApprove = (teacherId) => {
    processApproval(teacherId, 'approved');
  };
  
  return (
    <div>
      <h2>{stats.pending_approvals} Pending Approvals</h2>
      {pendingApprovals.map(approval => (
        <button onClick={() => handleApprove(approval.teacher_id)}>
          Approve
        </button>
      ))}
    </div>
  );
}
```

### Layer 6: Behavioral Monitoring

```tsx
import { useBehavioralMonitoring } from '@/hooks/useBehavioralMonitoring';

function UserDashboard() {
  const {
    creditsFrozen,
    anomalies,
    canEarnCredits,
    getBehavioralHealthScore,
    getAnomalySummary,
  } = useBehavioralMonitoring();
  
  const healthScore = getBehavioralHealthScore(); // 0-100
  const { allowed, reason } = canEarnCredits();
  const summary = getAnomalySummary();
  // { total: 3, by_severity: { low: 2, medium: 1 }, unresolved: 1 }
  
  return (
    <div>
      {creditsFrozen && <Alert>Credits Frozen: {reason}</Alert>}
      <p>Behavioral Health: {healthScore}/100</p>
      <p>Anomalies: {summary.unresolved} pending review</p>
    </div>
  );
}
```

## 🔑 Key Constants

```typescript
import { SECURITY_THRESHOLDS, VERIFICATION_BADGES } from '@/types/security';

// Identity Thresholds
SECURITY_THRESHOLDS.MAX_OTP_ATTEMPTS // 5
SECURITY_THRESHOLDS.OTP_EXPIRY_MINUTES // 10

// Performance Thresholds
SECURITY_THRESHOLDS.MIN_RELIABILITY_SCORE // 40
SECURITY_THRESHOLDS.AUTO_DEMOTE_SCORE // 30
SECURITY_THRESHOLDS.MAX_COMPLAINT_RATE // 20%

// Anomaly Thresholds
SECURITY_THRESHOLDS.MAX_REPEATED_PARTNER_SESSIONS // 15
SECURITY_THRESHOLDS.MIN_SESSION_DURATION_MINUTES // 15
SECURITY_THRESHOLDS.CREDIT_SPIKE_THRESHOLD // 50 credits/24h

// Verification Badges
VERIFICATION_BADGES.self_declared // Gray badge
VERIFICATION_BADGES.evidence_backed // Blue badge
VERIFICATION_BADGES.institution_verified // Green badge
```

## 🗄️ Database Functions

### Calculate Reliability Score
```sql
SELECT calculate_teacher_reliability_score('teacher-uuid');
-- Returns: INT (0-100)
```

### Detect Session Anomalies
```sql
SELECT detect_session_anomalies(
  'teacher-uuid',
  'learner-uuid',
  'session-uuid',
  INTERVAL '45 minutes'
);
-- Returns: BOOLEAN (true if suspicious)
```

### Validate Credit Generation
```sql
SELECT validate_credit_generation(
  'session-uuid',
  'teacher-uuid',
  'learner-uuid',
  INTERVAL '60 minutes'
);
-- Returns: BOOLEAN (true if valid)
```

## 🎯 Workflow Examples

### Complete Session with Feedback
```typescript
// 1. Session ends
// 2. Learner submits feedback
await submitFeedback({
  session_id: 'session-id',
  rating: 5,
  feedback_text: 'Great session!',
  would_recommend: true,
  session_quality: 'excellent',
  has_complaint: false,
});

// 3. Teacher confirms completion
await confirmSessionCompletion('session-id');

// 4. System validates credit generation
const canGenerate = await validate_credit_generation(...);

// 5. If valid, credits are generated
// 6. Performance metrics auto-update (trigger)
// 7. Anomaly detection runs
```

### Teacher Approval Workflow
```typescript
// 1. Teacher declares skills
await submitSkill({...});

// 2. If high-risk domain, demo session required
// (create demo_sessions record)

// 3. Admin reviews application
await processApproval(teacherId, 'approved');

// 4. Teacher can now create seminars
const canTeach = canTeach('domain-id'); // true
```

### Anomaly Detection Flow
```typescript
// System automatically detects on every session:

// 1. Check repeated partner count
// 2. Check session duration
// 3. Check credit spike patterns
// 4. Insert into transaction_anomalies if suspicious

// 5. If severity >= medium, freeze credits
// 6. Admin reviews anomaly
await resolveAnomaly(anomalyId, 'False positive - legitimate');

// 7. Credits unfrozen
```

## 📊 Admin Actions Cheat Sheet

| Action | Function | Impact |
|--------|----------|--------|
| Approve Teacher | `processApproval(id, 'approved')` | Teacher can create seminars |
| Reject Teacher | `processApproval(id, 'rejected', reason)` | Teacher notified |
| Suspend Teacher | `suspendTeacher(id, reason, days)` | Temporary suspension |
| Flag for Review | `flagForReview(id, reason)` | Marked for investigation |
| Resolve Anomaly | `resolveAnomaly(id, notes)` | Closes anomaly case |

## 🔍 Debugging Tips

### Check Verification Level
```sql
SELECT verification_level FROM identity_verification WHERE user_id = 'uuid';
```

### View Teacher Performance
```sql
SELECT * FROM teacher_performance WHERE teacher_id = 'uuid';
```

### Check Credit Freeze Status
```sql
SELECT * FROM credit_freeze_log 
WHERE user_id = 'uuid' AND status = 'active';
```

### View Anomalies
```sql
SELECT * FROM transaction_anomalies 
WHERE user_id = 'uuid' AND reviewed = false;
```

## 🚨 Security Alerts

System will automatically trigger alerts for:

- ✅ 3+ failed OTP attempts
- ✅ Multiple accounts from same IP
- ✅ 15+ sessions with same partner
- ✅ Sessions < 15 minutes (repeated)
- ✅ 50+ credits earned in 24 hours
- ✅ Complaint rate > 20%
- ✅ Reliability score < 30 (auto-demote)

## 📞 Support Commands

```bash
# Regenerate types
npx supabase gen types typescript --project-id YOUR_ID > src/integrations/supabase/types.ts

# Check database health
supabase db status

# View function logs
supabase functions logs send-otp

# Reset user verification (dev only)
UPDATE identity_verification SET verification_level = 'unverified' WHERE user_id = 'uuid';
```

---

**Version**: 1.0  
**Last Updated**: Feb 2026  
**Total Files Created**: 8  
**Total Tables**: 25  
**Total Hooks**: 5
