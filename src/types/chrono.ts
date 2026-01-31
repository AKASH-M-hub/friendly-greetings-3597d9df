// =============================================
// MODEL 14: CHRONO CORRECTION LAYER
// Type Definitions
// =============================================

// Value Unit conversion rates (system rules)
export const VALUE_UNIT_RATES = {
  TEACHING_HOUR: 2,    // 1 hour teaching → 2 VU
  LEARNING_HOUR: 1,    // 1 hour learning → 1 VU
  COMPLETED_SESSION: 1, // 1 completed session → 1 VU
  CREDIT_UTILIZED: 1,  // 1 credit utilized → 1 VU
} as const;

export interface ValueRestoration {
  userId: string;
  period: 'week' | 'month' | 'all-time';
  
  // Raw metrics
  hoursTeaching: number;
  hoursLearning: number;
  sessionsCompleted: number;
  creditsEarned: number;
  creditsUtilized: number;
  
  // Calculated Value Units
  teachingVU: number;
  learningVU: number;
  sessionVU: number;
  utilizationVU: number;
  totalVU: number;
  
  // Derived insights
  peopleHelped: number;
  peopleLearnedFrom: number;
  skillsActivated: string[];
  
  calculatedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'teaching' | 'learning' | 'session_completed' | 'credit_earned' | 'credit_spent';
  timestamp: string;
  description: string;
  valueUnits: number;
  skillInvolved?: string;
  partnerName?: string;
}

export interface CreditUtilization {
  id: string;
  creditAmount: number;
  usedFor: string;
  category: 'resume' | 'portfolio' | 'skill_unlock' | 'session' | 'other';
  outcome: string | null;
  timestamp: string;
}

export interface SkillActivation {
  skill: string;
  timesUsed: number;
  lastUsed: string | null;
  isActive: boolean;
  totalVUGenerated: number;
}

export interface MonthlyValueSummary {
  month: string;
  year: number;
  totalVU: number;
  hoursRestored: number;
  skillsApplied: number;
  connectionsFormed: number;
  highlights: string[];
  isShareable: boolean;
}

// =============================================
// MODEL 11: SESSION MEMORY & CONTINUITY ENGINE
// Type Definitions
// =============================================

export type SessionOutcome = 'solved' | 'partial' | 'not_solved' | 'cancelled';

export interface SessionMemory {
  id: string;
  sessionId: string;
  teacherId: string;
  learnerId: string;
  teacherName: string;
  learnerName: string;
  skillUsed: string;
  durationMinutes: number;
  outcome: SessionOutcome;
  feedbackTags: FeedbackTag[];
  qualityScore: number; // 1-5 derived from outcome + tags
  createdAt: string;
}

export type FeedbackTag = 
  | 'clear_explanation'
  | 'fast_help'
  | 'beginner_friendly'
  | 'patient_teacher'
  | 'advanced_knowledge'
  | 'good_listener'
  | 'engaging'
  | 'professional';

export const FEEDBACK_TAG_LABELS: Record<FeedbackTag, string> = {
  clear_explanation: 'Clear Explanation',
  fast_help: 'Fast Help',
  beginner_friendly: 'Beginner Friendly',
  patient_teacher: 'Patient Teacher',
  advanced_knowledge: 'Advanced Knowledge',
  good_listener: 'Good Listener',
  engaging: 'Engaging',
  professional: 'Professional',
};

export interface RepeatSuggestion {
  userId: string;
  userName: string;
  avatarUrl?: string;
  skill: string;
  previousSessions: number;
  averageQuality: number;
  lastSessionDate: string;
  commonTags: FeedbackTag[];
  matchScore: number; // 0-100 relevance score
}

export interface SessionDefaults {
  suggestedSkill: string | null;
  suggestedDuration: number; // minutes
  suggestedExchangeType: 'one-way' | 'mutual';
  basedOnPreviousSessions: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface QualityFilter {
  minQualityScore: number;
  excludeOutcomes: SessionOutcome[];
  preferredTags: FeedbackTag[];
}
