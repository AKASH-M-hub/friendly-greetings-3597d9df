// =============================================
// ZERO CREDIT RECOVERY TYPES
// MCQ Quiz, Recovery System
// =============================================

export interface MCQQuestion {
  id: string;
  session_id: string | null;
  topic: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  difficulty_score: number;
  times_answered: number;
  times_correct: number;
  created_at: string;
  is_active: boolean;
}

export interface MCQAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_taken_seconds: number;
  attempted_at: string;
  credits_earned: number;
  ip_address: string | null;
  session_fingerprint: string | null;
}

export interface MCQDailyLimit {
  id: string;
  user_id: string;
  date: string;
  questions_attempted: number;
  questions_correct: number;
  credits_earned_today: number;
}

export interface KnowledgeProgression {
  id: string;
  user_id: string;
  topic: string;
  skill_confidence_level: number; // 0-100
  questions_answered: number;
  questions_correct: number;
  mastery_score: number; // 0-100
  last_practiced_at: string;
  teaching_readiness: boolean;
  created_at: string;
  updated_at: string;
}

export type RecoveryActivityType = 
  | 'peer_teaching'        // Layer 1: Micro-sessions for 1 credit
  | 'micro_contribution'   // Layer 2: Docs/notes contribution
  | 'assisted_teaching'    // Layer 3: Co-teaching with mentor
  | 'institutional_support'; // Layer 4: Foundation/scholarship

export interface RecoveryActivity {
  id: string;
  user_id: string;
  activity_type: RecoveryActivityType;
  credits_earned: number;
  description: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InstitutionalGrant {
  id: string;
  recipient_user_id: string;
  credits_granted: number;
  reason: string;
  granted_by: 'system' | 'admin' | 'foundation';
  grant_source: 'platform_reserve' | 'donation' | 'scholarship';
  expires_at: string | null;
  created_at: string;
}

export interface MCQAttemptResult {
  success: boolean;
  is_correct?: boolean;
  correct_option?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  credits_earned?: number;
  questions_remaining_today?: number;
  daily_credits_earned?: number;
  error?: string;
}

// Recovery Layer Descriptors
export const RECOVERY_LAYERS = {
  peer_teaching: {
    title: 'Peer Teaching',
    description: 'Teach micro-sessions (5-10 min) to earn 1 credit per session',
    credits_per_action: 1,
    icon: '👥',
    color: 'text-blue-500',
  },
  micro_contribution: {
    title: 'Knowledge Contribution',
    description: 'Submit notes, diagrams, or Q&A to earn 1-3 credits per contribution',
    credits_per_action: 2,
    icon: '📝',
    color: 'text-green-500',
  },
  assisted_teaching: {
    title: 'Assisted Co-Teaching',
    description: 'Co-teach with an experienced mentor to earn 3-5 credits',
    credits_per_action: 4,
    icon: '🤝',
    color: 'text-purple-500',
  },
  institutional_support: {
    title: 'Institutional Support',
    description: 'Apply for foundation grants or scholarships (5-20 credits)',
    credits_per_action: 10,
    icon: '🏛️',
    color: 'text-gold-500',
  },
} as const;

export const MCQ_RULES = {
  CREDITS_PER_CORRECT_ANSWER: 2,
  MAX_QUESTIONS_PER_DAY: 5,
  MAX_DAILY_CREDITS: 10,
  QUESTION_COOLDOWN_DAYS: 7,
  MIN_TIME_SECONDS: 5, // Minimum time to prevent instant answers
} as const;
