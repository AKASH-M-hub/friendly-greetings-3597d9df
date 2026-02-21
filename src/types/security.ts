// =====================================================
// SIX-LAYER SECURITY SYSTEM - TYPESCRIPT TYPES
// =====================================================

// =====================================================
// LAYER 1: IDENTITY VERIFICATION TYPES
// =====================================================

export type VerificationLevel =
  | 'unverified'
  | 'email_verified'
  | 'mobile_verified'
  | 'institutional_verified'
  | 'fully_verified';

export interface IdentityVerification {
  id: string;
  user_id: string;
  
  // Email Verification
  email_verified: boolean;
  email_verified_at?: string;
  email_otp_sent_at?: string;
  email_otp_attempts: number;
  
  // Mobile Verification
  mobile_number?: string;
  mobile_verified: boolean;
  mobile_verified_at?: string;
  mobile_otp_sent_at?: string;
  mobile_otp_attempts: number;
  
  // Institutional Email
  institutional_email?: string;
  institutional_verified: boolean;
  institutional_verified_at?: string;
  institution_name?: string;
  
  // Device Fingerprinting
  device_fingerprint: any[];
  last_device_fingerprint?: string;
  last_login_ip?: string;
  last_login_at?: string;
  
  // Account Creation
  account_creation_ip?: string;
  account_creation_timestamp: string;
  
  verification_level: VerificationLevel;
  created_at: string;
  updated_at: string;
}

export type OTPType = 'email' | 'mobile' | 'institutional';

export interface OTPCode {
  id: string;
  user_id: string;
  otp_type: OTPType;
  otp_code: string;
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  attempts: number;
  created_at: string;
}

export interface DeviceLog {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent?: string;
  login_timestamp: string;
  suspicious: boolean;
  created_at: string;
}

export interface AccountCreationThrottle {
  id: string;
  ip_address: string;
  created_at: string;
}

// =====================================================
// LAYER 2: SKILL DECLARATION TYPES
// =====================================================

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type TeachingScope = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

export type VerificationStatus =
  | 'self_declared'
  | 'evidence_backed'
  | 'peer_reviewed'
  | 'institution_verified'
  | 'admin_approved';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface SkillDomain {
  id: string;
  name: string;
  category: string;
  requires_validation: boolean;
  is_high_risk: boolean;
  description?: string;
  created_at: string;
}

export interface TeacherSkill {
  id: string;
  teacher_id: string;
  skill_domain_id: string;
  
  // Skill Details
  experience_level: ExperienceLevel;
  teaching_scope: TeachingScope;
  years_of_experience?: number;
  description?: string;
  
  // Evidence
  portfolio_url?: string;
  github_url?: string;
  certification_url?: string;
  resume_url?: string;
  
  // Verification
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  
  // Approval
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  skill_domain?: SkillDomain;
}

export type EvidenceType =
  | 'portfolio'
  | 'certification'
  | 'project'
  | 'resume'
  | 'reference'
  | 'other';

export interface SkillEvidence {
  id: string;
  teacher_skill_id: string;
  evidence_type: EvidenceType;
  file_url: string;
  description?: string;
  verified: boolean;
  created_at: string;
}

// =====================================================
// LAYER 3: PERFORMANCE VALIDATION TYPES
// =====================================================

export type SessionQuality = 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';

export interface SessionFeedback {
  id: string;
  session_id: string;
  learner_id: string;
  teacher_id: string;
  
  // Confirmation
  learner_confirmed: boolean;
  teacher_confirmed: boolean;
  session_completed: boolean;
  
  // Feedback
  rating?: number; // 1-5
  feedback_text?: string;
  would_recommend?: boolean;
  
  // Quality Indicators
  session_quality?: SessionQuality;
  content_accuracy?: boolean;
  teaching_effectiveness?: boolean;
  communication_quality?: boolean;
  
  // Complaints
  has_complaint: boolean;
  complaint_text?: string;
  complaint_category?: string;
  
  created_at: string;
  updated_at: string;
}

export type VisibilityLevel = 'high' | 'normal' | 'low' | 'hidden';

export interface TeacherPerformance {
  id: string;
  teacher_id: string;
  
  // Reliability Metrics
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  completion_rate: number; // 0-100
  
  // Feedback Metrics
  total_ratings: number;
  average_rating: number; // 0-5
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  
  // Learner Retention
  unique_learners: number;
  repeat_learners: number;
  repeat_learner_ratio: number; // 0-100
  
  // Complaint Metrics
  total_complaints: number;
  resolved_complaints: number;
  complaint_rate: number; // 0-100
  
  // Overall Score
  reliability_score: number; // 0-100
  
  // Visibility Controls
  visibility_level: VisibilityLevel;
  auto_demotion_count: number;
  
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// LAYER 4: SKILL ENTRY CONTROL TYPES
// =====================================================

export type DemoType = 'mandatory' | 'voluntary' | 'peer_requested';
export type DemoStatus = 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled';

export interface DemoSession {
  id: string;
  teacher_id: string;
  skill_domain_id: string;
  teacher_skill_id?: string;
  
  // Demo Details
  demo_type: DemoType;
  demo_status: DemoStatus;
  
  // Scheduling
  scheduled_at?: string;
  completed_at?: string;
  
  // Review
  reviewer_id?: string;
  review_notes?: string;
  passed?: boolean;
  score?: number; // 0-100
  
  // Approval
  approved_to_teach: boolean;
  approval_badge?: string;
  approval_date?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  skill_domain?: SkillDomain;
}

export interface PeerReview {
  id: string;
  demo_session_id: string;
  reviewer_id: string;
  
  // Review Criteria (1-5)
  content_knowledge: number;
  teaching_ability: number;
  communication_skills: number;
  overall_recommendation: boolean;
  
  review_text?: string;
  created_at: string;
}

export type TestType = 'multiple_choice' | 'coding' | 'project' | 'interview';

export interface SkillTest {
  id: string;
  skill_domain_id: string;
  test_name: string;
  test_type: TestType;
  passing_score: number;
  questions: any; // JSONB
  active: boolean;
  created_at: string;
}

// =====================================================
// LAYER 5: INSTITUTIONAL OVERSIGHT TYPES
// =====================================================

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface Institution {
  id: string;
  name: string;
  domain: string;
  admin_approval_required: boolean;
  email_verification_required: boolean;
  active: boolean;
  settings: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface InstitutionAdmin {
  id: string;
  institution_id: string;
  user_id: string;
  role: AdminRole;
  permissions: any; // JSONB
  active: boolean;
  created_at: string;
  
  // Relations
  institution?: Institution;
}

export type TeacherApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'under_review';

export interface TeacherApproval {
  id: string;
  teacher_id: string;
  institution_id?: string;
  
  // Approval
  approval_status: TeacherApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Monitoring
  flagged_for_review: boolean;
  flag_reason?: string;
  suspension_reason?: string;
  suspended_until?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  institution?: Institution;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  institution_id?: string;
  action_type: string;
  target_user_id?: string;
  action_details?: any; // JSONB
  created_at: string;
}

// =====================================================
// LAYER 6: BEHAVIORAL ANOMALY TYPES
// =====================================================

export type AnomalyType =
  | 'repeated_partner'
  | 'short_session_spam'
  | 'credit_spike'
  | 'low_feedback_high_credits'
  | 'collusion_detected'
  | 'time_fraud'
  | 'other';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export type AnomalyAction =
  | 'flagged'
  | 'credit_freeze'
  | 'account_review'
  | 'visibility_limit'
  | 'suspension'
  | 'resolved';

export interface TransactionAnomaly {
  id: string;
  user_id: string;
  
  // Anomaly Details
  anomaly_type: AnomalyType;
  detection_timestamp: string;
  severity: AnomalySeverity;
  
  // Evidence
  evidence?: any; // JSONB
  partner_user_id?: string;
  session_ids?: string[];
  
  // Response
  action_taken?: AnomalyAction;
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  
  created_at: string;
}

export interface SessionPattern {
  id: string;
  user_id: string;
  partner_id: string;
  
  // Statistics
  total_sessions_together: number;
  average_session_duration?: string; // interval
  shortest_session?: string;
  longest_session?: string;
  
  // Flags
  suspicious_pattern: boolean;
  pattern_type?: string;
  last_session_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreditGenerationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  rule_config: any; // JSONB
  active: boolean;
  created_at: string;
}

export type FreezeStatus = 'active' | 'resolved' | 'permanent';

export interface CreditFreezeLog {
  id: string;
  user_id: string;
  freeze_reason: string;
  frozen_at: string;
  unfrozen_at?: string;
  frozen_by_system: boolean;
  frozen_by_admin_id?: string;
  credits_frozen?: number;
  status: FreezeStatus;
}

// =====================================================
// COMPOSITE TYPES & UTILITY TYPES
// =====================================================

export interface SecurityProfile {
  identity: IdentityVerification;
  skills: TeacherSkill[];
  performance?: TeacherPerformance;
  approval?: TeacherApproval;
  anomalies: TransactionAnomaly[];
}

export interface TeacherVerificationBadge {
  level: VerificationStatus;
  label: string;
  color: string;
  icon: string;
}

export interface PerformanceMetrics {
  reliability: number;
  rating: number;
  completion: number;
  retention: number;
}

// =====================================================
// CONSTANTS & CONFIGURATION
// =====================================================

export const VERIFICATION_BADGES: Record<VerificationStatus, TeacherVerificationBadge> = {
  self_declared: {
    level: 'self_declared',
    label: 'Self-Declared',
    color: 'gray',
    icon: 'User',
  },
  evidence_backed: {
    level: 'evidence_backed',
    label: 'Evidence-Backed',
    color: 'blue',
    icon: 'FileCheck',
  },
  peer_reviewed: {
    level: 'peer_reviewed',
    label: 'Peer-Reviewed',
    color: 'purple',
    icon: 'Users',
  },
  institution_verified: {
    level: 'institution_verified',
    label: 'Institution Verified',
    color: 'green',
    icon: 'Building',
  },
  admin_approved: {
    level: 'admin_approved',
    label: 'Admin Approved',
    color: 'emerald',
    icon: 'ShieldCheck',
  },
};

export const SECURITY_THRESHOLDS = {
  // Layer 1: Identity
  MAX_OTP_ATTEMPTS: 5,
  OTP_EXPIRY_MINUTES: 10,
  ACCOUNT_CREATION_THROTTLE_HOURS: 24,
  MAX_ACCOUNTS_PER_IP: 3,
  
  // Layer 2: Skills
  MIN_YEARS_EXPERIENCE_EXPERT: 5,
  MAX_SKILLS_PER_TEACHER: 10,
  
  // Layer 3: Performance
  MIN_RELIABILITY_SCORE: 40,
  AUTO_DEMOTE_SCORE: 30,
  HIGH_VISIBILITY_SCORE: 80,
  MAX_COMPLAINT_RATE: 20, // percentage
  
  // Layer 4: Entry Control
  DEMO_REQUIRED_FOR_HIGH_RISK: true,
  MIN_PEER_REVIEWS_REQUIRED: 2,
  DEMO_PASSING_SCORE: 70,
  
  // Layer 5: Institutional
  ADMIN_APPROVAL_TIMEOUT_DAYS: 7,
  MAX_SUSPENSION_DAYS: 90,
  
  // Layer 6: Anomaly Detection
  MAX_REPEATED_PARTNER_SESSIONS: 15,
  MIN_SESSION_DURATION_MINUTES: 15,
  CREDIT_SPIKE_THRESHOLD: 50, // credits in 24h
  MAX_SESSIONS_PER_DAY: 10,
  COLLUSION_SESSION_WINDOW_DAYS: 30,
} as const;

export const SKILL_CATEGORIES = [
  'Technology',
  'Design',
  'Business',
  'Professional',
  'Arts',
  'Education',
  'Health',
  'Language',
  'Science',
  'Other',
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

// =====================================================
// REQUEST/RESPONSE TYPES FOR API
// =====================================================

export interface VerifyOTPRequest {
  userId: string;
  code: string;
  type: OTPType;
}

export interface VerifyOTPResponse {
  success: boolean;
  verification_level: VerificationLevel;
  message: string;
}

export interface SubmitSkillRequest {
  skill_domain_id: string;
  experience_level: ExperienceLevel;
  teaching_scope: TeachingScope;
  years_of_experience?: number;
  description: string;
  portfolio_url?: string;
  github_url?: string;
  certification_url?: string;
}

export interface SubmitFeedbackRequest {
  session_id: string;
  rating: number;
  feedback_text?: string;
  would_recommend: boolean;
  session_quality: SessionQuality;
  has_complaint: boolean;
  complaint_text?: string;
}

export interface RequestDemoSessionRequest {
  skill_domain_id: string;
  preferred_date?: string;
}

export interface AdminApprovalRequest {
  teacher_id: string;
  approval_status: TeacherApprovalStatus;
  reason?: string;
}
