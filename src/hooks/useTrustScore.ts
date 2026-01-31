import { useState, useEffect, useCallback } from 'react';
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
    overallConfidence: 85,
    dataFreshness: 90,
    dataConsistency: 88,
    reliabilityIndex: 82,
    uncertaintyFlagged: false,
    explanation: 'Based on consistent session history',
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

    // Use mock data - trust_scores table not yet created
    setTrustData({
      overallConfidence: 85,
      dataFreshness: 90,
      dataConsistency: 88,
      reliabilityIndex: 82,
      uncertaintyFlagged: false,
      explanation: 'Based on consistent session history',
    });
    setLoading(false);
  }, [user]);

  const recordTrustScore = useCallback(async (
    _dataSource: string,
    confidence: number,
    _freshnessInDays: number = 0,
    _consistency: number = 0.8
  ) => {
    if (!user) return;
    setTrustData(prev => ({ ...prev, overallConfidence: confidence }));
  }, [user]);

  const recordDecision = useCallback(async (
    _decisionType: string,
    reliabilityIndex: number,
    explanation: string,
    isUncertain: boolean = false
  ) => {
    if (!user) return;
    setTrustData(prev => ({
      ...prev,
      reliabilityIndex,
      explanation,
      uncertaintyFlagged: isUncertain,
    }));
  }, [user]);

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
