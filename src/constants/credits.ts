// =============================================
// CREDIT SYSTEM CONSTANTS
// Centralized credit rules for the entire app
// =============================================

/**
 * Credit calculation rates
 * - Teachers: 2 credits per minute
 * - Learners: 1 credit per minute (spent)
 */
export const CREDIT_RATES = {
  // Per minute rates
  TEACHER_CREDITS_PER_MINUTE: 2,
  LEARNER_CREDITS_PER_MINUTE: 1,
  
  // Starting credits for new users
  INITIAL_FREE_CREDITS: 10,
} as const;

/**
 * Calculate credits earned by a teacher for a session
 * @param minutes - Duration in minutes
 * @returns Credits earned (positive number)
 */
export function calculateTeacherCredits(minutes: number): number {
  return Math.max(0, Math.round(minutes * CREDIT_RATES.TEACHER_CREDITS_PER_MINUTE));
}

/**
 * Calculate credits spent by a learner for a session
 * @param minutes - Duration in minutes
 * @returns Credits spent (positive number, caller should negate if needed)
 */
export function calculateLearnerCredits(minutes: number): number {
  return Math.max(0, Math.round(minutes * CREDIT_RATES.LEARNER_CREDITS_PER_MINUTE));
}

/**
 * Format credit rate display text
 */
export function getCreditRateText(role: 'teacher' | 'learner'): string {
  if (role === 'teacher') {
    return `+${CREDIT_RATES.TEACHER_CREDITS_PER_MINUTE} credits per minute`;
  }
  return `-${CREDIT_RATES.LEARNER_CREDITS_PER_MINUTE} credit per minute`;
}

/**
 * Get the initial balance for a new user
 */
export function getInitialBalance(): number {
  return CREDIT_RATES.INITIAL_FREE_CREDITS;
}
