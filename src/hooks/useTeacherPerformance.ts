// =====================================================
// LAYER 3: TEACHER PERFORMANCE METRICS HOOK
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  TeacherPerformance,
  SessionFeedback,
  SubmitFeedbackRequest,
  SessionQuality,
  PerformanceMetrics,
} from '@/types/security';
import { toast } from 'sonner';

export function useTeacherPerformance(teacherId?: string) {
  const { user } = useAuth();
  const targetUserId = teacherId || user?.id;
  const db = supabase as any;

  const [performance, setPerformance] = useState<TeacherPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const isSecuritySchemaError = (error: any) => {
    const code = error?.code;
    const message = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' ||
      code === '42501' ||
      code === 'PGRST200' ||
      code === 'PGRST205' ||
      message.includes('relationship') ||
      message.includes('relation') ||
      message.includes('does not exist')
    );
  };

  const fetchLegacyPerformance = async () => {
    if (!targetUserId) {
      setPerformance(null);
      return;
    }

    try {
      const [{ data: reviewRows }, { data: sessionRows }] = await Promise.all([
        db
          .from('teaching_reviews')
          .select('experience_rating')
          .eq('teacher_id', targetUserId),
        db
          .from('teaching_sessions')
          .select('status')
          .eq('teacher_id', targetUserId),
      ]);

      const ratings: number[] = (reviewRows || [])
        .map((row: any) => Number(row.experience_rating || 0))
        .filter((value: number) => value > 0);

      const totalRatings = ratings.length;
      const averageRating = totalRatings
        ? ratings.reduce((sum, value) => sum + value, 0) / totalRatings
        : 0;

      const totalSessions = (sessionRows || []).length;
      const completedSessions = (sessionRows || []).filter((row: any) => row.status === 'completed').length;
      const cancelledSessions = (sessionRows || []).filter((row: any) => row.status === 'cancelled').length;
      const noShowSessions = (sessionRows || []).filter((row: any) => row.status === 'no_show').length;
      const completionRate = totalSessions ? (completedSessions / totalSessions) * 100 : 0;

      const legacyPerformance: TeacherPerformance = {
        id: `legacy-${targetUserId}`,
        teacher_id: targetUserId,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        cancelled_sessions: cancelledSessions,
        no_show_sessions: noShowSessions,
        completion_rate: Number(completionRate.toFixed(2)),
        total_ratings: totalRatings,
        average_rating: Number(averageRating.toFixed(2)),
        five_star_count: ratings.filter((value) => value === 5).length,
        four_star_count: ratings.filter((value) => value === 4).length,
        three_star_count: ratings.filter((value) => value === 3).length,
        two_star_count: ratings.filter((value) => value === 2).length,
        one_star_count: ratings.filter((value) => value === 1).length,
        unique_learners: 0,
        repeat_learners: 0,
        repeat_learner_ratio: 0,
        total_complaints: 0,
        resolved_complaints: 0,
        complaint_rate: 0,
        reliability_score: Math.max(20, Math.min(100, Math.round((completionRate * 0.5) + ((averageRating / 5) * 50)))),
        visibility_level: 'normal',
        auto_demotion_count: 0,
        last_calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPerformance(legacyPerformance);
    } catch {
      setPerformance(null);
    }
  };

  // Fetch teacher performance metrics
  const fetchPerformance = async () => {
    if (!targetUserId) {
      setPerformance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await db
        .from('teacher_performance')
        .select('*')
        .eq('teacher_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isSecuritySchemaError(error)) {
          await fetchLegacyPerformance();
          return;
        }
        throw error;
      }

      if (!data) {
        // Initialize performance record
        const { data: newPerformance, error: createError } = await db
          .from('teacher_performance')
          .insert({
            teacher_id: targetUserId,
            reliability_score: 50,
          })
          .select()
          .single();

        if (createError) {
          if (isSecuritySchemaError(createError)) {
            await fetchLegacyPerformance();
            return;
          }
          throw createError;
        }
        setPerformance(newPerformance);
      } else {
        setPerformance(data);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
      await fetchLegacyPerformance();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [targetUserId]);

  // Submit session feedback
  const submitFeedback = async (feedbackData: SubmitFeedbackRequest): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in first');
      return false;
    }

    setSubmittingFeedback(true);
    try {
      // Get session details to find teacher_id
      const { data: session, error: sessionError } = await db
        .from('teaching_sessions')
        .select('teacher_id')
        .eq('id', feedbackData.session_id)
        .single();

      if (sessionError) throw sessionError;

      // Insert feedback
      const { error } = await db.from('session_feedback').insert({
        session_id: feedbackData.session_id,
        learner_id: user.id,
        teacher_id: session.teacher_id,
        learner_confirmed: true,
        rating: feedbackData.rating,
        feedback_text: feedbackData.feedback_text,
        would_recommend: feedbackData.would_recommend,
        session_quality: feedbackData.session_quality,
        has_complaint: feedbackData.has_complaint,
        complaint_text: feedbackData.complaint_text,
        session_completed: true,
      });

      if (error) throw error;

      toast.success('Feedback submitted successfully', {
        description: 'Thank you for helping us improve!',
      });

      // Refresh performance metrics
      await fetchPerformance();
      return true;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback');
      return false;
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Confirm session completion (teacher side)
  const confirmSessionCompletion = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await db
        .from('session_feedback')
        .update({
          teacher_confirmed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      toast.success('Session marked as completed');
      return true;
    } catch (error: any) {
      console.error('Error confirming session:', error);
      toast.error('Failed to confirm session');
      return false;
    }
  };

  // Get performance breakdown
  const getPerformanceBreakdown = (): PerformanceMetrics | null => {
    if (!performance) return null;

    return {
      reliability: performance.reliability_score,
      rating: Number((performance.average_rating * 20).toFixed(1)), // Convert 0-5 to 0-100
      completion: Number(performance.completion_rate),
      retention: Number(performance.repeat_learner_ratio),
    };
  };

  // Get rating distribution
  const getRatingDistribution = () => {
    if (!performance) return [];

    return [
      { stars: 5, count: performance.five_star_count },
      { stars: 4, count: performance.four_star_count },
      { stars: 3, count: performance.three_star_count },
      { stars: 2, count: performance.two_star_count },
      { stars: 1, count: performance.one_star_count },
    ];
  };

  // Check if performance meets minimum standards
  const meetsMinimumStandards = (): boolean => {
    if (!performance) return false;

    const MIN_RELIABILITY = 40;
    const MAX_COMPLAINT_RATE = 20;

    return (
      performance.reliability_score >= MIN_RELIABILITY &&
      performance.complaint_rate <= MAX_COMPLAINT_RATE
    );
  };

  // Get visibility status
  const getVisibilityStatus = () => {
    if (!performance) return { level: 'normal', message: 'Standard visibility' };

    const messages = {
      high: 'Featured in search results',
      normal: 'Standard visibility',
      low: 'Reduced visibility due to performance',
      hidden: 'Not visible in search - under review',
    };

    return {
      level: performance.visibility_level,
      message: messages[performance.visibility_level],
    };
  };

  // Calculate completion streak
  const getCompletionStreak = () => {
    if (!performance) return 0;
    
    // This would need session history data
    // For now return a calculated value
    const ratio = performance.completed_sessions / Math.max(performance.total_sessions, 1);
    return Math.floor(ratio * 10);
  };

  return {
    performance,
    loading,
    submittingFeedback,
    submitFeedback,
    confirmSessionCompletion,
    getPerformanceBreakdown,
    getRatingDistribution,
    meetsMinimumStandards,
    getVisibilityStatus,
    getCompletionStreak,
    refresh: fetchPerformance,
  };
}
