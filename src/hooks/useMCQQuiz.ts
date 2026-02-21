import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  MCQQuestion, 
  MCQAttempt, 
  MCQDailyLimit, 
  KnowledgeProgression,
  MCQAttemptResult 
} from '@/types/recovery';

export function useMCQQuiz() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<MCQQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [dailyLimit, setDailyLimit] = useState<MCQDailyLimit | null>(null);
  const [attempts, setAttempts] = useState<MCQAttempt[]>([]);
  const [progression, setProgression] = useState<KnowledgeProgression[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Fetch eligible questions for user
  const fetchEligibleQuestions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_eligible_mcq_questions', {
        p_user_id: user.id,
        p_limit: 5,
      });

      if (error) throw error;

      const typedData = (data || []) as unknown as MCQQuestion[];
      setQuestions(typedData);
      
      if (typedData.length > 0) {
        setCurrentQuestion(typedData[0]);
        setQuestionIndex(0);
        setStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error fetching MCQ questions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch daily limits
  const fetchDailyLimit = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('mcq_daily_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setDailyLimit(data as MCQDailyLimit);
    } catch (err) {
      console.error('Error fetching daily limit:', err);
    }
  }, [user]);

  // Fetch user's knowledge progression
  const fetchProgression = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_progression')
        .select('*')
        .eq('user_id', user.id)
        .order('mastery_score', { ascending: false });

      if (error) throw error;
      setProgression((data || []) as KnowledgeProgression[]);
    } catch (err) {
      console.error('Error fetching progression:', err);
    }
  }, [user]);

  // Submit answer
  const submitAnswer = useCallback(async (
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): Promise<MCQAttemptResult> => {
    if (!user || !currentQuestion || !startTime) {
      return { success: false, error: 'Invalid state' };
    }

    try {
      setSubmitting(true);

      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Call the database function to record attempt and award credits
      const { data, error } = await supabase.rpc('record_mcq_attempt', {
        p_user_id: user.id,
        p_question_id: currentQuestion.id,
        p_selected_option: selectedOption,
        p_time_taken_seconds: timeTaken,
        p_ip_address: null,
        p_session_fingerprint: null,
      });

      if (error) throw error;

      const result = data as unknown as MCQAttemptResult;

      // Refresh daily limit and progression
      await Promise.all([
        fetchDailyLimit(),
        fetchProgression(),
      ]);

      return result;
    } catch (err) {
      console.error('Error submitting answer:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to submit answer' 
      };
    } finally {
      setSubmitting(false);
    }
  }, [user, currentQuestion, startTime, fetchDailyLimit, fetchProgression]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (questionIndex < questions.length - 1) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      setCurrentQuestion(questions[nextIdx]);
      setStartTime(Date.now());
    } else {
      setCurrentQuestion(null);
    }
  }, [questionIndex, questions]);

  // Check if user can take more quizzes today
  const canTakeQuiz = useCallback(() => {
    if (!dailyLimit) return true;
    return dailyLimit.questions_attempted < 5;
  }, [dailyLimit]);

  // Get remaining questions for today
  const getRemainingQuestions = useCallback(() => {
    if (!dailyLimit) return 5;
    return Math.max(0, 5 - dailyLimit.questions_attempted);
  }, [dailyLimit]);

  // Get credits earned today
  const getCreditsEarnedToday = useCallback(() => {
    return dailyLimit?.credits_earned_today || 0;
  }, [dailyLimit]);

  // Initialize
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchEligibleQuestions(),
        fetchDailyLimit(),
        fetchProgression(),
      ]);
    }
  }, [user, fetchEligibleQuestions, fetchDailyLimit, fetchProgression]);

  return {
    questions,
    currentQuestion,
    questionIndex,
    dailyLimit,
    progression,
    loading,
    submitting,
    submitAnswer,
    nextQuestion,
    canTakeQuiz,
    getRemainingQuestions,
    getCreditsEarnedToday,
    refetch: fetchEligibleQuestions,
  };
}
