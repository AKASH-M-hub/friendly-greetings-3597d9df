// =============================================
// MODEL 10: SECURE TRANSACTION & DATA INTEGRITY
// Type Definitions
// =============================================

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'disputed';

export type LedgerEntryType =
  | 'credit_earned'
  | 'credit_spent'
  | 'credit_adjustment'
  | 'credit_rollback'
  | 'credit_dispute_hold'
  | 'credit_dispute_release';

// Immutable Credit Ledger Entry
export interface CreditLedgerEntry {
  id: string;
  transaction_id: string;
  user_id: string;
  entry_type: LedgerEntryType;
  amount: number;
  balance_after: number;
  session_id: string | null;
  partner_user_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Session Transaction (atomic session-credit operation)
export interface SessionTransaction {
  id: string;
  session_id: string;
  teacher_id: string;
  learner_id: string;
  status: TransactionStatus;
  duration_minutes: number;
  credits_amount: number;
  teacher_confirmed: boolean;
  learner_confirmed: boolean;
  teacher_confirmed_at: string | null;
  learner_confirmed_at: string | null;
  consistency_hash: string | null;
  error_message: string | null;
  recovery_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Transaction Audit Log Entry
export interface TransactionLogEntry {
  id: string;
  transaction_id: string;
  previous_status: TransactionStatus | null;
  new_status: TransactionStatus;
  action: string;
  actor_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// User Credit Balance (cached view)
export interface UserCreditBalance {
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  held_credits: number;
  last_ledger_entry_id: string | null;
  updated_at: string;
}

// Transaction Integrity Status
export interface TransactionIntegrityStatus {
  isConsistent: boolean;
  lastVerified: string;
  pendingTransactions: number;
  disputedTransactions: number;
  ledgerEntryCount: number;
  consistencyHash: string | null;
}

// Dual-User Confirmation Status
export interface DualConfirmationStatus {
  transactionId: string;
  sessionId: string;
  teacherConfirmed: boolean;
  learnerConfirmed: boolean;
  bothConfirmed: boolean;
  waitingFor: 'teacher' | 'learner' | null;
  canProcess: boolean;
}

// Recovery Data Structure
export interface RecoveryData {
  originalStatus: TransactionStatus;
  attemptedAt: string;
  errorCode: string;
  errorMessage: string;
  retryCount: number;
  lastRetryAt: string | null;
  canRecover: boolean;
}
