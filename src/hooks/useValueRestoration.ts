import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ValueRestoration, 
  TimelineEvent, 
  SkillActivation,
  MonthlyValueSummary,
  VALUE_UNIT_RATES 
} from '@/types/chrono';

export function useValueRestoration() {
  const { user } = useAuth();
  const [restoration, setRestoration] = useState<ValueRestoration | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [skills, setSkills] = useState<SkillActivation[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlyValueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateValueRestoration = useCallback(async (
    period: 'week' | 'month' | 'all-time' = 'month'
  ) => {
    if (!user) return null;

    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all-time':
        startDate = new Date(0);
        break;
    }

    try {
      // Fetch teaching sessions (using 'title' column for skill)
      const { data: teachingSessions } = await supabase
        .from('teaching_sessions')
        .select('actual_minutes, learner_id, title, created_at, status')
        .eq('teacher_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Fetch learning sessions (where user is learner)
      const { data: learningSessions } = await supabase
        .from('teaching_sessions')
        .select('actual_minutes, teacher_id, title, created_at, status')
        .eq('learner_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      // Calculate raw metrics
      const hoursTeaching = (teachingSessions || []).reduce(
        (sum, s) => sum + (s.actual_minutes || 0) / 60, 0
      );
      const hoursLearning = (learningSessions || []).reduce(
        (sum, s) => sum + (s.actual_minutes || 0) / 60, 0
      );
      const sessionsCompleted = 
        (teachingSessions?.length || 0) + (learningSessions?.length || 0);

      // Credits calculation
      const creditsEarned = (teachingSessions || []).reduce(
        (sum, s) => sum + Math.ceil((s.actual_minutes || 0) / 15), 0
      );
      const creditsUtilized = (learningSessions || []).reduce(
        (sum, s) => sum + Math.ceil((s.actual_minutes || 0) / 15), 0
      );

      // Calculate Value Units
      const teachingVU = hoursTeaching * VALUE_UNIT_RATES.TEACHING_HOUR;
      const learningVU = hoursLearning * VALUE_UNIT_RATES.LEARNING_HOUR;
      const sessionVU = sessionsCompleted * VALUE_UNIT_RATES.COMPLETED_SESSION;
      const utilizationVU = creditsUtilized * VALUE_UNIT_RATES.CREDIT_UTILIZED;
      const totalVU = teachingVU + learningVU + sessionVU + utilizationVU;

      // Unique people interacted with
      const peopleHelped = new Set(teachingSessions?.map(s => s.learner_id)).size;
      const peopleLearnedFrom = new Set(learningSessions?.map(s => s.teacher_id)).size;

      // Skills activated (using title as skill name)
      const allSkills = [
        ...(teachingSessions || []).map(s => s.title),
        ...(learningSessions || []).map(s => s.title),
      ].filter(Boolean) as string[];
      const skillsActivated = [...new Set(allSkills)];

      const result: ValueRestoration = {
        userId: user.id,
        period,
        hoursTeaching: Math.round(hoursTeaching * 10) / 10,
        hoursLearning: Math.round(hoursLearning * 10) / 10,
        sessionsCompleted,
        creditsEarned,
        creditsUtilized,
        teachingVU: Math.round(teachingVU * 10) / 10,
        learningVU: Math.round(learningVU * 10) / 10,
        sessionVU,
        utilizationVU,
        totalVU: Math.round(totalVU * 10) / 10,
        peopleHelped,
        peopleLearnedFrom,
        skillsActivated,
        calculatedAt: new Date().toISOString(),
      };

      setRestoration(result);
      return result;
    } catch (error) {
      console.error('Error calculating value restoration:', error);
      return null;
    }
  }, [user]);

  const fetchTimeline = useCallback(async (limit = 20) => {
    if (!user) return [];

    try {
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('id, teacher_id, learner_id, actual_minutes, title, created_at, status')
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      const events: TimelineEvent[] = (sessions || []).map(session => {
        const isTeacher = session.teacher_id === user.id;
        const hours = (session.actual_minutes || 0) / 60;
        const vu = isTeacher 
          ? hours * VALUE_UNIT_RATES.TEACHING_HOUR 
          : hours * VALUE_UNIT_RATES.LEARNING_HOUR;

        return {
          id: session.id,
          type: isTeacher ? 'teaching' : 'learning',
          timestamp: session.created_at || new Date().toISOString(),
          description: isTeacher 
            ? `Taught ${session.title || 'a skill'} for ${session.actual_minutes} minutes`
            : `Learned ${session.title || 'a skill'} for ${session.actual_minutes} minutes`,
          valueUnits: Math.round(vu * 10) / 10,
          skillInvolved: session.title || undefined,
        };
      });

      setTimeline(events);
      return events;
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }
  }, [user]);

  const fetchSkillActivations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('title, actual_minutes, teacher_id, created_at')
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .eq('status', 'completed');

      const skillMap = new Map<string, SkillActivation>();

      (sessions || []).forEach(session => {
        const skill = session.title;
        if (!skill) return;

        const isTeacher = session.teacher_id === user.id;
        const hours = (session.actual_minutes || 0) / 60;
        const vu = isTeacher 
          ? hours * VALUE_UNIT_RATES.TEACHING_HOUR 
          : hours * VALUE_UNIT_RATES.LEARNING_HOUR;

        const existing = skillMap.get(skill);
        if (existing) {
          existing.timesUsed += 1;
          existing.totalVUGenerated += vu;
          if (session.created_at && new Date(session.created_at) > new Date(existing.lastUsed || 0)) {
            existing.lastUsed = session.created_at;
          }
        } else {
          skillMap.set(skill, {
            skill,
            timesUsed: 1,
            lastUsed: session.created_at,
            isActive: true,
            totalVUGenerated: vu,
          });
        }
      });

      const activations = Array.from(skillMap.values())
        .map(s => ({
          ...s,
          totalVUGenerated: Math.round(s.totalVUGenerated * 10) / 10,
          isActive: s.lastUsed 
            ? (Date.now() - new Date(s.lastUsed).getTime()) < 30 * 24 * 60 * 60 * 1000
            : false,
        }))
        .sort((a, b) => b.totalVUGenerated - a.totalVUGenerated);

      setSkills(activations);
      return activations;
    } catch (error) {
      console.error('Error fetching skill activations:', error);
      return [];
    }
  }, [user]);

  const generateMonthlySummary = useCallback(async () => {
    const restoration = await calculateValueRestoration('month');
    if (!restoration) return null;

    const now = new Date();
    const highlights: string[] = [];

    if (restoration.hoursTeaching > 0) {
      highlights.push(`Taught for ${restoration.hoursTeaching} hours`);
    }
    if (restoration.peopleHelped > 0) {
      highlights.push(`Helped ${restoration.peopleHelped} people`);
    }
    if (restoration.skillsActivated.length > 0) {
      highlights.push(`Applied ${restoration.skillsActivated.length} skills`);
    }
    if (restoration.totalVU > 10) {
      highlights.push(`Created significant value in your community`);
    }

    const summary: MonthlyValueSummary = {
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      totalVU: restoration.totalVU,
      hoursRestored: restoration.hoursTeaching + restoration.hoursLearning,
      skillsApplied: restoration.skillsActivated.length,
      connectionsFormed: restoration.peopleHelped + restoration.peopleLearnedFrom,
      highlights,
      isShareable: true,
    };

    setMonthlySummary(summary);
    return summary;
  }, [calculateValueRestoration]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        calculateValueRestoration('month'),
        fetchTimeline(),
        fetchSkillActivations(),
        generateMonthlySummary(),
      ]).finally(() => setLoading(false));
    }
  }, [user, calculateValueRestoration, fetchTimeline, fetchSkillActivations, generateMonthlySummary]);

  return {
    restoration,
    timeline,
    skills,
    monthlySummary,
    loading,
    calculateValueRestoration,
    fetchTimeline,
    fetchSkillActivations,
    generateMonthlySummary,
  };
}
