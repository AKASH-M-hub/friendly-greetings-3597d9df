import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  SessionMemory,
  SessionOutcome,
  FeedbackTag,
  RepeatSuggestion,
  SessionDefaults,
  QualityFilter,
} from '@/types/chrono';

export function useSessionMemory() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<SessionMemory[]>([]);
  const [suggestions, setSuggestions] = useState<RepeatSuggestion[]>([]);
  const [defaults, setDefaults] = useState<SessionDefaults | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate quality score from outcome and tags
  const calculateQualityScore = (
    outcome: SessionOutcome, 
    tags: FeedbackTag[]
  ): number => {
    let score = 0;
    
    // Base score from outcome
    switch (outcome) {
      case 'solved': score = 4; break;
      case 'partial': score = 2.5; break;
      case 'not_solved': score = 1; break;
      case 'cancelled': score = 0; break;
    }
    
    // Bonus from positive tags (max +1)
    const positiveTagBonus = Math.min(tags.length * 0.25, 1);
    
    return Math.min(score + positiveTagBonus, 5);
  };

  // Fetch session memories
  const fetchMemories = useCallback(async () => {
    if (!user) return [];

    try {
      // Using 'title' column as skill identifier (based on schema)
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select(`
          id,
          teacher_id,
          learner_id,
          title,
          actual_minutes,
          status,
          created_at
        `)
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // For now, simulate session memories from real sessions
      // In production, these would come from a session_memories table
      const sessionMemories: SessionMemory[] = (sessions || []).map(session => {
        const isTeacher = session.teacher_id === user.id;
        const outcome: SessionOutcome = 'solved'; // Default for completed sessions
        const tags: FeedbackTag[] = ['clear_explanation']; // Simulated
        
        return {
          id: session.id,
          sessionId: session.id,
          teacherId: session.teacher_id,
          learnerId: session.learner_id || '',
          teacherName: isTeacher ? 'You' : 'Teacher',
          learnerName: isTeacher ? 'Learner' : 'You',
          skillUsed: session.title || 'Unknown Skill',
          durationMinutes: session.actual_minutes || 0,
          outcome,
          feedbackTags: tags,
          qualityScore: calculateQualityScore(outcome, tags),
          createdAt: session.created_at || new Date().toISOString(),
        };
      });

      setMemories(sessionMemories);
      return sessionMemories;
    } catch (error) {
      console.error('Error fetching session memories:', error);
      return [];
    }
  }, [user]);

  // Generate repeat suggestions based on quality memories
  const generateSuggestions = useCallback(async (
    skill?: string,
    filter?: QualityFilter
  ) => {
    if (!user) return [];

    const minQuality = filter?.minQualityScore ?? 3;
    const excludeOutcomes = filter?.excludeOutcomes ?? ['not_solved', 'cancelled'];

    // Filter memories by quality
    const qualityMemories = memories.filter(m => 
      m.qualityScore >= minQuality &&
      !excludeOutcomes.includes(m.outcome) &&
      (skill ? m.skillUsed.toLowerCase().includes(skill.toLowerCase()) : true)
    );

    // Group by partner (opposite role)
    const partnerMap = new Map<string, {
      userId: string;
      sessions: SessionMemory[];
      tags: FeedbackTag[];
    }>();

    qualityMemories.forEach(memory => {
      const isTeacher = memory.teacherId === user.id;
      const partnerId = isTeacher ? memory.learnerId : memory.teacherId;
      
      const existing = partnerMap.get(partnerId);
      if (existing) {
        existing.sessions.push(memory);
        memory.feedbackTags.forEach(tag => {
          if (!existing.tags.includes(tag)) existing.tags.push(tag);
        });
      } else {
        partnerMap.set(partnerId, {
          userId: partnerId,
          sessions: [memory],
          tags: [...memory.feedbackTags],
        });
      }
    });

    // Convert to suggestions
    const repeatSuggestions: RepeatSuggestion[] = Array.from(partnerMap.values())
      .map(partner => {
        const avgQuality = partner.sessions.reduce((sum, s) => sum + s.qualityScore, 0) 
          / partner.sessions.length;
        const lastSession = partner.sessions[0];
        
        // Match score based on sessions count, quality, and recency
        const sessionBonus = Math.min(partner.sessions.length * 10, 30);
        const qualityBonus = avgQuality * 10;
        const recencyDays = (Date.now() - new Date(lastSession.createdAt).getTime()) 
          / (24 * 60 * 60 * 1000);
        const recencyBonus = Math.max(20 - recencyDays, 0);
        
        return {
          userId: partner.userId,
          userName: lastSession.teacherId === user.id 
            ? lastSession.learnerName 
            : lastSession.teacherName,
          skill: lastSession.skillUsed,
          previousSessions: partner.sessions.length,
          averageQuality: Math.round(avgQuality * 10) / 10,
          lastSessionDate: lastSession.createdAt,
          commonTags: partner.tags.slice(0, 3) as FeedbackTag[],
          matchScore: Math.min(Math.round(sessionBonus + qualityBonus + recencyBonus), 100),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    setSuggestions(repeatSuggestions);
    return repeatSuggestions;
  }, [user, memories]);

  // Generate auto-filled session defaults
  const generateDefaults = useCallback(async (skill?: string) => {
    if (!user || memories.length === 0) {
      setDefaults(null);
      return null;
    }

    const relevantMemories = skill 
      ? memories.filter(m => m.skillUsed.toLowerCase().includes(skill.toLowerCase()))
      : memories;

    if (relevantMemories.length === 0) {
      setDefaults(null);
      return null;
    }

    // Calculate most common values
    const durations = relevantMemories.map(m => m.durationMinutes);
    const avgDuration = Math.round(
      durations.reduce((sum, d) => sum + d, 0) / durations.length
    );
    
    // Round to nearest 15 minutes
    const suggestedDuration = Math.round(avgDuration / 15) * 15 || 30;

    const skills = relevantMemories.map(m => m.skillUsed);
    const skillCounts = skills.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonSkill = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const sessionDefaults: SessionDefaults = {
      suggestedSkill: skill || mostCommonSkill,
      suggestedDuration,
      suggestedExchangeType: 'one-way',
      basedOnPreviousSessions: relevantMemories.length,
      confidence: relevantMemories.length >= 5 ? 'high' 
        : relevantMemories.length >= 2 ? 'medium' 
        : 'low',
    };

    setDefaults(sessionDefaults);
    return sessionDefaults;
  }, [user, memories]);

  // Record feedback for a session
  const recordFeedback = useCallback(async (
    sessionId: string,
    outcome: SessionOutcome,
    tags: FeedbackTag[]
  ) => {
    if (!user) return false;

    // In production, this would write to a session_feedback table
    // For now, we update local state
    setMemories(prev => prev.map(m => {
      if (m.sessionId === sessionId) {
        return {
          ...m,
          outcome,
          feedbackTags: tags,
          qualityScore: calculateQualityScore(outcome, tags),
        };
      }
      return m;
    }));

    return true;
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchMemories()
        .then(() => generateSuggestions())
        .then(() => generateDefaults())
        .finally(() => setLoading(false));
    }
  }, [user, fetchMemories, generateSuggestions, generateDefaults]);

  return {
    memories,
    suggestions,
    defaults,
    loading,
    fetchMemories,
    generateSuggestions,
    generateDefaults,
    recordFeedback,
    calculateQualityScore,
  };
}
