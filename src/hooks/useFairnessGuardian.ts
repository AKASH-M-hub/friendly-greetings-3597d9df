import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { FairnessAdvisory } from '@/types/modules';

interface FairnessData {
  totalGivenHours: number;
  totalReceivedHours: number;
  giveReceiveRatio: number;
  fairnessScore: number;
  oneSidedFlags: number;
  cooldownUntil: Date | null;
  lastNudgeAt: Date | null;
}

export function useFairnessGuardian() {
  const { user } = useAuth();
  const [fairnessData, setFairnessData] = useState<FairnessData>({
    totalGivenHours: 0,
    totalReceivedHours: 0,
    giveReceiveRatio: 1,
    fairnessScore: 100,
    oneSidedFlags: 0,
    cooldownUntil: null,
    lastNudgeAt: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchFairnessData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use mock data - fairness_tracking table not yet created
    // In production, this would fetch from database
    setFairnessData({
      totalGivenHours: 12,
      totalReceivedHours: 8,
      giveReceiveRatio: 1.5,
      fairnessScore: 85,
      oneSidedFlags: 0,
      cooldownUntil: null,
      lastNudgeAt: null,
    });
    setLoading(false);
  }, [user]);

  const getFairnessAdvisory = useCallback((): FairnessAdvisory => {
    const { giveReceiveRatio, cooldownUntil, fairnessScore } = fairnessData;
    const isCooldownActive = cooldownUntil && new Date() < cooldownUntil;

    if (isCooldownActive) {
      return {
        isBalanced: false,
        message: "You're in a cooldown period due to excessive receiving. Please wait before requesting more sessions.",
        suggestedAction: "Consider teaching a session to lift the cooldown faster.",
        cooldownActive: true,
      };
    }

    if (giveReceiveRatio < 0.5) {
      return {
        isBalanced: false,
        message: "Your balance is leaning heavily toward receiving. Consider contributing a skill.",
        suggestedAction: "Try teaching something you're good at to balance your exchange.",
        cooldownActive: false,
      };
    }

    if (giveReceiveRatio < 0.8) {
      return {
        isBalanced: false,
        message: "Your exchange balance could use some giving back.",
        suggestedAction: "Share your knowledge to maintain a healthy exchange ratio.",
        cooldownActive: false,
      };
    }

    if (fairnessScore >= 80) {
      return {
        isBalanced: true,
        message: "Great balance! You're contributing fairly to the community.",
        suggestedAction: null,
        cooldownActive: false,
      };
    }

    return {
      isBalanced: true,
      message: "Your exchange balance is healthy.",
      suggestedAction: null,
      cooldownActive: false,
    };
  }, [fairnessData]);

  const recordExchange = useCallback(async (
    eventType: 'give' | 'receive',
    hours: number,
    _partnerUserId?: string,
    _sessionId?: string
  ) => {
    if (!user) return;

    // Update local state - in production this would update database
    const newGiven = eventType === 'give' 
      ? fairnessData.totalGivenHours + hours 
      : fairnessData.totalGivenHours;
    const newReceived = eventType === 'receive' 
      ? fairnessData.totalReceivedHours + hours 
      : fairnessData.totalReceivedHours;
    
    const newRatio = newReceived > 0 ? newGiven / newReceived : newGiven > 0 ? 2 : 1;
    
    let newScore = fairnessData.fairnessScore;
    if (eventType === 'give') {
      newScore = Math.min(100, newScore + 5);
    } else if (newRatio < 0.5) {
      newScore = Math.max(0, newScore - 10);
    } else if (newRatio < 0.8) {
      newScore = Math.max(0, newScore - 5);
    }

    setFairnessData({
      ...fairnessData,
      totalGivenHours: newGiven,
      totalReceivedHours: newReceived,
      giveReceiveRatio: newRatio,
      fairnessScore: newScore,
    });
  }, [user, fairnessData]);

  const canReceive = useCallback((): boolean => {
    const { cooldownUntil } = fairnessData;
    if (cooldownUntil && new Date() < cooldownUntil) {
      return false;
    }
    return true;
  }, [fairnessData]);

  useEffect(() => {
    fetchFairnessData();
  }, [fetchFairnessData]);

  return {
    fairnessData,
    loading,
    getFairnessAdvisory,
    recordExchange,
    canReceive,
    refetch: fetchFairnessData,
  };
}
