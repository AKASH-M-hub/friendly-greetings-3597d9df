import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { calculateTeacherCredits, calculateLearnerCredits, CREDIT_RATES } from '@/constants/credits';

export interface SessionData {
  id: string;
  title: string;
  type: 'teaching' | 'learning';
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  partnerId: string | null;
  partnerName: string;
  rating?: number;
  feedback?: string;
  creditsChange: number;
  status: 'completed' | 'in-progress' | 'pending' | 'cancelled';
}

export interface SessionStats {
  totalSessions: number;
  teachingSessions: number;
  learningSessions: number;
  totalHours: number;
}

export interface WalletStats {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  heldCredits: number;
  earnedThisWeek: number;
  spentThisWeek: number;
}

export interface CreditTransaction {
  id: string;
  type: 'earned' | 'spent' | 'held' | 'released';
  amount: number;
  description: string;
  partnerName: string;
  date: string;
  time: string;
  sessionDuration: string;
  status: 'completed' | 'pending' | 'disputed';
}

export interface SessionLogEntry {
  id: string;
  sessionId: string;
  role: 'teacher' | 'learner';
  partnerName: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  creditsEarned?: number;
  creditsSpent?: number;
  status: 'completed' | 'in-progress' | 'disputed' | 'pending-confirmation';
  confirmedByTeacher: boolean;
  confirmedByLearner: boolean;
}

function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInDays(new Date(), date);
  if (days <= 7) return `${days} days ago`;
  return format(date, 'MMM d, yyyy');
}

function formatSessionTime(dateString: string): string {
  return format(new Date(dateString), 'h:mm a');
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function useSessionData() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    if (user.id === 'mock-user-id') {
      // Mock data for demo user - using new credit rates (1 min = 2 credits for teacher, 1 min = 1 credit for learner)
      const mockSessions: SessionData[] = [
        {
          id: 'mock-1',
          title: 'React Fundamentals',
          type: 'teaching',
          date: 'Today',
          time: '10:00 AM',
          duration: '30m',
          durationMinutes: 30,
          partnerId: 'mock-learner-1',
          partnerName: 'Alice Learner',
          creditsChange: calculateTeacherCredits(30), // 30 min × 2 = 60 credits
          status: 'completed',
          rating: 5,
        },
        {
          id: 'mock-2',
          title: 'Advanced Guitar',
          type: 'learning',
          date: 'Yesterday',
          time: '2:00 PM',
          duration: '45m',
          durationMinutes: 45,
          partnerId: 'mock-teacher-1',
          partnerName: 'Bob Teacher',
          creditsChange: -calculateLearnerCredits(45), // 45 min × 1 = -45 credits
          status: 'completed',
          rating: 5,
        }
      ];
      setSessions(mockSessions);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch sessions where user is teacher
      const { data: teachingSessions, error: teachingError } = await supabase
        .from('teaching_sessions')
        .select(`
          id,
          title,
          status,
          actual_minutes,
          credits_earned,
          created_at,
          started_at,
          ended_at,
          learner_id,
          teacher_id
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (teachingError) throw teachingError;

      // Fetch sessions where user is learner
      const { data: learningSessions, error: learningError } = await supabase
        .from('teaching_sessions')
        .select(`
          id,
          title,
          status,
          actual_minutes,
          credits_earned,
          created_at,
          started_at,
          ended_at,
          learner_id,
          teacher_id
        `)
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false });

      if (learningError) throw learningError;

      // Fetch reviews for ratings
      const { data: reviews } = await supabase
        .from('teaching_reviews')
        .select('session_id, experience_rating, feedback')
        .in('session_id', [
          ...(teachingSessions?.map(s => s.id) || []),
          ...(learningSessions?.map(s => s.id) || [])
        ]);

      const reviewMap = new Map(reviews?.map(r => [r.session_id, r]) || []);

      // Fetch partner profiles
      const partnerIds = new Set([
        ...(teachingSessions?.map(s => s.learner_id).filter(Boolean) || []),
        ...(learningSessions?.map(s => s.teacher_id).filter(Boolean) || [])
      ]);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(partnerIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name || 'Anonymous']) || []);

      // Combine and transform sessions
      const allSessions: SessionData[] = [
        ...(teachingSessions?.map(s => ({
          id: s.id,
          title: s.title || 'Teaching Session',
          type: 'teaching' as const,
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          duration: formatDuration(s.actual_minutes),
          durationMinutes: s.actual_minutes || 0,
          partnerId: s.learner_id,
          partnerName: s.learner_id ? (profileMap.get(s.learner_id) || 'Learner') : 'No learner',
          rating: reviewMap.get(s.id)?.experience_rating,
          feedback: reviewMap.get(s.id)?.feedback || undefined,
          creditsChange: s.credits_earned || calculateTeacherCredits(s.actual_minutes || 0),
          status: mapStatus(s.status),
        })) || []),
        ...(learningSessions?.map(s => ({
          id: s.id,
          title: s.title || 'Learning Session',
          type: 'learning' as const,
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          duration: formatDuration(s.actual_minutes),
          durationMinutes: s.actual_minutes || 0,
          partnerId: s.teacher_id,
          partnerName: profileMap.get(s.teacher_id) || 'Teacher',
          rating: reviewMap.get(s.id)?.experience_rating,
          feedback: reviewMap.get(s.id)?.feedback || undefined,
          creditsChange: -calculateLearnerCredits(s.actual_minutes || 0),
          status: mapStatus(s.status),
        })) || []),
      ].sort((a, b) => {
        // Sort by date (most recent first)
        if (a.date === 'Today' && b.date !== 'Today') return -1;
        if (b.date === 'Today' && a.date !== 'Today') return 1;
        if (a.date === 'Yesterday' && b.date !== 'Yesterday') return -1;
        if (b.date === 'Yesterday' && a.date !== 'Yesterday') return 1;
        return 0;
      });

      setSessions(allSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const stats: SessionStats = {
    totalSessions: sessions.length,
    teachingSessions: sessions.filter(s => s.type === 'teaching').length,
    learningSessions: sessions.filter(s => s.type === 'learning').length,
    totalHours: Math.round(sessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60 * 10) / 10,
  };

  return { sessions, stats, loading, error, refetch: fetchSessions };
}

function mapStatus(status: string): SessionData['status'] {
  switch (status) {
    case 'completed': return 'completed';
    case 'in_progress': return 'in-progress';
    case 'pending': return 'pending';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
}

export function useCreditData() {
  const { user } = useAuth();
  const [walletStats, setWalletStats] = useState<WalletStats>({
    totalBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    heldCredits: 0,
    earnedThisWeek: 0,
    spentThisWeek: 0,
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.id === 'mock-user-id') {
      // Mock wallet stats - includes 10 free starting credits
      // User earned 180 (30min teaching × 2 × 3 sessions) + 10 initial = 190
      // User spent 90 (90min learning × 1)
      setWalletStats({
        totalBalance: CREDIT_RATES.INITIAL_FREE_CREDITS + 180 - 90, // 10 + 180 - 90 = 100
        totalEarned: 180,
        totalSpent: 90,
        heldCredits: 15,
        earnedThisWeek: 60, // 30min × 2 credits
        spentThisWeek: 45, // 45min × 1 credit
      });

      // Mock transactions - using new credit rates (1 min = 2 for teacher, 1 min = 1 for learner)
      setTransactions([
        {
          id: 'mock-tx-1',
          type: 'earned',
          amount: calculateTeacherCredits(30), // 30 min × 2 = 60 credits
          description: 'Web Development Basics',
          partnerName: 'Sarah Smith',
          date: 'Today',
          time: '2:30 PM',
          sessionDuration: '30m',
          status: 'completed',
        },
        {
          id: 'mock-tx-2',
          type: 'spent',
          amount: calculateLearnerCredits(45), // 45 min × 1 = 45 credits
          description: 'Piano Lessons',
          partnerName: 'John Doe',
          date: 'Yesterday',
          time: '11:00 AM',
          sessionDuration: '45m',
          status: 'completed',
        },
        {
          id: 'mock-tx-3',
          type: 'held',
          amount: 15,
          description: 'Pending Verification',
          partnerName: 'System',
          date: 'Yesterday',
          time: '5:00 PM',
          sessionDuration: '-',
          status: 'pending',
        }
      ]);

      // Mock session log - using new credit rates
      setSessionLog([
        {
          id: 'mock-log-1',
          sessionId: 'sess-1',
          role: 'teacher',
          partnerName: 'Alice Learner',
          topic: 'React Fundamentals',
          date: 'Today',
          time: '10:00 AM',
          duration: '30m',
          durationMinutes: 30,
          creditsEarned: calculateTeacherCredits(30), // 30 × 2 = 60
          status: 'completed',
          confirmedByTeacher: true,
          confirmedByLearner: true,
        },
        {
          id: 'mock-log-2',
          sessionId: 'sess-2',
          role: 'learner',
          partnerName: 'Bob Teacher',
          topic: 'Advanced Guitar',
          date: 'Yesterday',
          time: '2:00 PM',
          duration: '45m',
          durationMinutes: 45,
          creditsSpent: calculateLearnerCredits(45), // 45 × 1 = 45
          status: 'completed',
          confirmedByTeacher: true,
          confirmedByLearner: true,
        }
      ]);

      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch teaching sessions (where user earned credits)
      const { data: teachingSessions, error: teachingError } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (teachingError) throw teachingError;

      // Fetch learning sessions (where user spent credits)
      const { data: learningSessions, error: learningError } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false });

      if (learningError) throw learningError;

      // Fetch partner profiles
      const partnerIds = new Set([
        ...(teachingSessions?.map(s => s.learner_id).filter(Boolean) || []),
        ...(learningSessions?.map(s => s.teacher_id).filter(Boolean) || [])
      ]);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(partnerIds) as string[]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name || 'Anonymous']) || []);

      // Calculate wallet stats using new credit rates (1 min = 2 credits for teacher, 1 min = 1 credit for learner)
      const completedTeaching = teachingSessions?.filter(s => s.status === 'completed') || [];
      const completedLearning = learningSessions?.filter(s => s.status === 'completed') || [];

      // Teacher earns: minutes × 2 credits
      const totalEarned = completedTeaching.reduce((sum, s) => sum + (s.credits_earned || calculateTeacherCredits(s.actual_minutes || 0)), 0);
      // Learner spends: minutes × 1 credit
      const totalSpent = completedLearning.reduce((sum, s) => sum + calculateLearnerCredits(s.actual_minutes || 0), 0);

      const weekTeaching = completedTeaching.filter(s => new Date(s.created_at) >= weekAgo);
      const weekLearning = completedLearning.filter(s => new Date(s.created_at) >= weekAgo);

      const earnedThisWeek = weekTeaching.reduce((sum, s) => sum + (s.credits_earned || calculateTeacherCredits(s.actual_minutes || 0)), 0);
      const spentThisWeek = weekLearning.reduce((sum, s) => sum + calculateLearnerCredits(s.actual_minutes || 0), 0);

      const pendingSessions = [
        ...(teachingSessions?.filter(s => s.status === 'pending') || []),
        ...(learningSessions?.filter(s => s.status === 'pending') || [])
      ];
      const heldCredits = pendingSessions.reduce((sum, s) => sum + (s.credits_earned || 0), 0);

      // Balance includes initial free credits for new users
      setWalletStats({
        totalBalance: CREDIT_RATES.INITIAL_FREE_CREDITS + totalEarned - totalSpent,
        totalEarned,
        totalSpent,
        heldCredits,
        earnedThisWeek,
        spentThisWeek,
      });

      // Build transactions list
      const allTransactions: CreditTransaction[] = [
        ...(completedTeaching.map(s => ({
          id: s.id,
          type: 'earned' as const,
          amount: s.credits_earned || 0,
          description: s.title || 'Teaching Session',
          partnerName: s.learner_id ? (profileMap.get(s.learner_id) || 'Learner') : 'No learner',
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          sessionDuration: formatDuration(s.actual_minutes),
          status: 'completed' as const,
        }))),
        ...(completedLearning.map(s => ({
          id: s.id,
          type: 'spent' as const,
          amount: calculateLearnerCredits(s.actual_minutes || 0),
          description: s.title || 'Learning Session',
          partnerName: profileMap.get(s.teacher_id) || 'Teacher',
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          sessionDuration: formatDuration(s.actual_minutes),
          status: 'completed' as const,
        }))),
      ].filter(t => t.amount > 0);

      setTransactions(allTransactions);

      // Build session log
      const allSessionLog: SessionLogEntry[] = [
        ...(teachingSessions?.map(s => ({
          id: s.id,
          sessionId: s.id,
          role: 'teacher' as const,
          partnerName: s.learner_id ? (profileMap.get(s.learner_id) || 'Learner') : 'No learner',
          topic: s.title || 'Teaching Session',
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          duration: formatDuration(s.actual_minutes),
          durationMinutes: s.actual_minutes || 0,
          creditsEarned: s.credits_earned || 0,
          status: mapSessionLogStatus(s.status),
          confirmedByTeacher: s.status === 'completed',
          confirmedByLearner: s.status === 'completed',
        })) || []),
        ...(learningSessions?.map(s => ({
          id: `learning-${s.id}`,
          sessionId: s.id,
          role: 'learner' as const,
          partnerName: profileMap.get(s.teacher_id) || 'Teacher',
          topic: s.title || 'Learning Session',
          date: formatSessionDate(s.created_at),
          time: formatSessionTime(s.started_at || s.created_at),
          duration: formatDuration(s.actual_minutes),
          durationMinutes: s.actual_minutes || 0,
          creditsSpent: Math.ceil((s.actual_minutes || 0) / 60),
          status: mapSessionLogStatus(s.status),
          confirmedByTeacher: s.status === 'completed',
          confirmedByLearner: s.status === 'completed',
        })) || []),
      ];

      setSessionLog(allSessionLog);
    } catch (err) {
      console.error('Error fetching credit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { walletStats, transactions, sessionLog, loading, error, refetch: fetchData };
}

function mapSessionLogStatus(status: string): SessionLogEntry['status'] {
  switch (status) {
    case 'completed': return 'completed';
    case 'in_progress': return 'in-progress';
    case 'disputed': return 'disputed';
    default: return 'pending-confirmation';
  }
}
