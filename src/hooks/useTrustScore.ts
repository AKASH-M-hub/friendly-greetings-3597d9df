import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TrustAdvisory, TrustLevel } from '@/types/modules';

interface TrustScoreData {
  overallConfidence: number;
  dataFreshness: number;
  dataConsistency: number;
  reliabilityIndex: number;
  uncertaintyFlagged: boolean;
  explanation: string | null;
}

export function useTrustScore() {
  const { user } = useAuth();
  const [trustData, setTrustData] = useState<TrustScoreData>({
    overallConfidence: 0,
    dataFreshness: 0,
    dataConsistency: 0,
    reliabilityIndex: 0,
    uncertaintyFlagged: false,
    explanation: null,
  });
  const [loading, setLoading] = useState(true);

  const calculateTrustLevel = useCallback((confidence: number): TrustLevel => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    if (confidence >= 40) return 'low';
    return 'uncertain';
  }, []);

  const getTrustAdvisory = useCallback((confidence: number): TrustAdvisory => {
    const level = calculateTrustLevel(confidence);
    
    const messages: Record<TrustLevel, string> = {
      high: "This recommendation is backed by strong, consistent data.",
      medium: "This recommendation has moderate confidence. Consider additional factors.",
      low: "This recommendation is based on limited data. Proceed with caution.",
      uncertain: "This recommendation is based on limited or weak data. Consider proceeding cautiously.",
    };

    return {
      level,
      message: messages[level],
      dataPoints: Math.floor(confidence / 10),
      confidenceRange: [Math.max(0, confidence - 10), Math.min(100, confidence + 10)],
    };
  }, [calculateTrustLevel]);

  const fetchTrustData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch trust scores
      const { data: trustScores } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('last_calculated', { ascending: false })
        .limit(5);

      // Fetch latest decision reliability
      const { data: reliability } = await supabase
        .from('decision_reliability')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculate aggregated trust data
      const avgConfidence = trustScores && trustScores.length > 0
        ? trustScores.reduce((acc, s) => acc + s.confidence_percentage, 0) / trustScores.length
        : 75; // Default confidence

      const avgFreshness = trustScores && trustScores.length > 0
        ? trustScores.reduce((acc, s) => acc + (100 - Math.min(s.data_freshness_days * 5, 100)), 0) / trustScores.length
        : 80;

      const avgConsistency = trustScores && trustScores.length > 0
        ? trustScores.reduce((acc, s) => acc + Number(s.data_consistency_score) * 100, 0) / trustScores.length
        : 70;

      setTrustData({
        overallConfidence: Math.round(avgConfidence),
        dataFreshness: Math.round(avgFreshness),
        dataConsistency: Math.round(avgConsistency),
        reliabilityIndex: reliability?.reliability_index || 75,
        uncertaintyFlagged: reliability?.uncertainty_flagged || false,
        explanation: reliability?.explanation || null,
      });
    } catch (error) {
      console.error('Error fetching trust data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordTrustScore = useCallback(async (
    dataSource: string,
    confidence: number,
    freshnessInDays: number = 0,
    consistency: number = 0.8
  ) => {
    if (!user) return;

    await supabase.from('trust_scores').insert({
      user_id: user.id,
      data_source: dataSource,
      confidence_percentage: confidence,
      data_freshness_days: freshnessInDays,
      data_consistency_score: consistency,
    });

    fetchTrustData();
  }, [user, fetchTrustData]);

  const recordDecision = useCallback(async (
    decisionType: string,
    reliabilityIndex: number,
    explanation: string,
    isUncertain: boolean = false
  ) => {
    if (!user) return;

    await supabase.from('decision_reliability').insert({
      user_id: user.id,
      decision_type: decisionType,
      reliability_index: reliabilityIndex,
      explanation,
      uncertainty_flagged: isUncertain,
    });

    fetchTrustData();
  }, [user, fetchTrustData]);

  useEffect(() => {
    fetchTrustData();
  }, [fetchTrustData]);

  return {
    trustData,
    loading,
    getTrustAdvisory,
    calculateTrustLevel,
    recordTrustScore,
    recordDecision,
    refetch: fetchTrustData,
  };
}
