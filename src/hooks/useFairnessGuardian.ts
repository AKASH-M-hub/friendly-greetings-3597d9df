import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

    try {
      const { data, error } = await supabase
        .from('fairness_tracking')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFairnessData({
          totalGivenHours: Number(data.total_given_hours),
          totalReceivedHours: Number(data.total_received_hours),
          giveReceiveRatio: Number(data.give_receive_ratio),
          fairnessScore: data.fairness_score,
          oneSidedFlags: data.one_sided_flags,
          cooldownUntil: data.cooldown_until ? new Date(data.cooldown_until) : null,
          lastNudgeAt: data.last_nudge_at ? new Date(data.last_nudge_at) : null,
        });
      } else {
        // Initialize tracking for new user
        const { data: newData } = await supabase
          .from('fairness_tracking')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (newData) {
          setFairnessData({
            totalGivenHours: 0,
            totalReceivedHours: 0,
            giveReceiveRatio: 1,
            fairnessScore: 100,
            oneSidedFlags: 0,
            cooldownUntil: null,
            lastNudgeAt: null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching fairness data:', error);
    } finally {
      setLoading(false);
    }
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
    partnerUserId?: string,
    sessionId?: string
  ) => {
    if (!user) return;

    // Record the exchange event
    await supabase.from('exchange_events').insert({
      user_id: user.id,
      event_type: eventType,
      hours,
      partner_user_id: partnerUserId || null,
      session_id: sessionId || null,
    });

    // Update fairness tracking
    const newGiven = eventType === 'give' 
      ? fairnessData.totalGivenHours + hours 
      : fairnessData.totalGivenHours;
    const newReceived = eventType === 'receive' 
      ? fairnessData.totalReceivedHours + hours 
      : fairnessData.totalReceivedHours;
    
    const newRatio = newReceived > 0 ? newGiven / newReceived : newGiven > 0 ? 2 : 1;
    
    // Calculate new fairness score
    let newScore = fairnessData.fairnessScore;
    if (eventType === 'give') {
      newScore = Math.min(100, newScore + 5);
    } else if (newRatio < 0.5) {
      newScore = Math.max(0, newScore - 10);
    } else if (newRatio < 0.8) {
      newScore = Math.max(0, newScore - 5);
    }

    // Check for one-sided dependency
    let newFlags = fairnessData.oneSidedFlags;
    let cooldownUntil = null;
    if (eventType === 'receive' && newRatio < 0.3) {
      newFlags += 1;
      if (newFlags >= 3) {
        // Apply cooldown
        cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }
    }

    await supabase
      .from('fairness_tracking')
      .update({
        total_given_hours: newGiven,
        total_received_hours: newReceived,
        give_receive_ratio: newRatio,
        fairness_score: newScore,
        one_sided_flags: newFlags,
        cooldown_until: cooldownUntil,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    fetchFairnessData();
  }, [user, fairnessData, fetchFairnessData]);

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
