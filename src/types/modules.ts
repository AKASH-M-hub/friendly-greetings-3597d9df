// Trust Score & Reliability Types
export interface TrustScore {
  id: string;
  user_id: string;
  data_source: string;
  confidence_percentage: number;
  last_calculated: string;
  data_freshness_days: number;
  data_consistency_score: number;
  created_at: string;
  updated_at: string;
}

export interface DecisionReliability {
  id: string;
  user_id: string;
  decision_type: string;
  reliability_index: number;
  explanation: string | null;
  uncertainty_flagged: boolean;
  created_at: string;
}

export interface HistoricalAccuracy {
  id: string;
  user_id: string;
  recommendation_type: string;
  prediction_made: string | null;
  actual_outcome: string | null;
  accuracy_score: number | null;
  evaluated_at: string | null;
  created_at: string;
}

// Fair Exchange Guardian Types
export interface FairnessTracking {
  id: string;
  user_id: string;
  total_given_hours: number;
  total_received_hours: number;
  give_receive_ratio: number;
  fairness_score: number;
  one_sided_flags: number;
  cooldown_until: string | null;
  last_nudge_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeEvent {
  id: string;
  user_id: string;
  event_type: 'give' | 'receive';
  hours: number;
  partner_user_id: string | null;
  session_id: string | null;
  created_at: string;
}

// Credi.AI Chat Types
export interface ChatConversation {
  id: string;
  user_id: string;
  context_mode: 'teaching' | 'learning' | null;
  context_session_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserContext {
  mode: 'teaching' | 'learning' | null;
  creditBalance: number;
  activeSession: boolean;
  sessionMinutesRemaining: number;
  totalTeachingHours: number;
  totalLearningHours: number;
  fairnessScore: number;
  giveReceiveRatio: number;
}

// Trust Advisory Types
export type TrustLevel = 'high' | 'medium' | 'low' | 'uncertain';

export interface TrustAdvisory {
  level: TrustLevel;
  message: string;
  dataPoints: number;
  confidenceRange: [number, number];
}

// Fairness Advisory Types
export interface FairnessAdvisory {
  isBalanced: boolean;
  message: string;
  suggestedAction: string | null;
  cooldownActive: boolean;
}
