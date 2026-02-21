// =====================================================
// LAYER 6: BEHAVIORAL ANOMALY DETECTION HOOK
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  TransactionAnomaly,
  SessionPattern,
  CreditFreezeLog,
  AnomalyType,
  AnomalySeverity,
} from '@/types/security';
import { toast } from 'sonner';

export function useBehavioralMonitoring() {
  const { user } = useAuth();
  const db = supabase as any;
  const [anomalies, setAnomalies] = useState<TransactionAnomaly[]>([]);
  const [sessionPatterns, setSessionPatterns] = useState<SessionPattern[]>([]);
  const [creditsFrozen, setCreditsFrozen] = useState(false);
  const [freezeLog, setFreezeLog] = useState<CreditFreezeLog | null>(null);
  const [loading, setLoading] = useState(true);

  const isSecuritySchemaError = (error: any) => {
    const code = error?.code;
    const status = error?.status;
    const message = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' || code === '42501' ||
      code === 'PGRST200' || code === 'PGRST205' ||
      status === 404 ||
      message.includes('relation') ||
      message.includes('does not exist') ||
      message.includes('schema cache')
    );
  };

  // Fetch user's anomalies
  const fetchAnomalies = async () => {
    if (!user) {
      setAnomalies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await db
        .from('transaction_anomalies')
        .select('*')
        .eq('user_id', user.id)
        .order('detection_timestamp', { ascending: false })
        .limit(20);

      if (error) {
        if (isSecuritySchemaError(error)) { setAnomalies([]); return; }
        throw error;
      }
      setAnomalies(data || []);
    } catch (error) {
      if (!isSecuritySchemaError(error)) console.error('Error fetching anomalies:', error);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch session patterns
  const fetchSessionPatterns = async () => {
    if (!user) {
      setSessionPatterns([]);
      return;
    }

    try {
      const { data, error } = await db
        .from('session_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('suspicious_pattern', true)
        .order('updated_at', { ascending: false });

      if (error) {
        if (isSecuritySchemaError(error)) { setSessionPatterns([]); return; }
        throw error;
      }
      setSessionPatterns(data || []);
    } catch (error) {
      if (!isSecuritySchemaError(error)) console.error('Error fetching patterns:', error);
      setSessionPatterns([]);
    }
  };

  // Check if credits are frozen
  const checkCreditFreeze = async () => {
    if (!user) {
      setCreditsFrozen(false);
      setFreezeLog(null);
      return;
    }

    try {
      const { data, error } = await db
        .from('credit_freeze_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('frozen_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isSecuritySchemaError(error)) { setCreditsFrozen(false); setFreezeLog(null); return; }
        throw error;
      }

      if (data) {
        setCreditsFrozen(true);
        setFreezeLog(data);
      } else {
        setCreditsFrozen(false);
        setFreezeLog(null);
      }
    } catch (error) {
      if (!isSecuritySchemaError(error)) console.error('Error checking credit freeze:', error);
      setCreditsFrozen(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    fetchSessionPatterns();
    checkCreditFreeze();
  }, [user]);

  // Get anomaly summary
  const getAnomalySummary = () => {
    const summary = {
      total: anomalies.length,
      by_severity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      by_type: {} as Record<AnomalyType, number>,
      unresolved: 0,
    };

    anomalies.forEach(anomaly => {
      summary.by_severity[anomaly.severity]++;
      summary.by_type[anomaly.anomaly_type] = 
        (summary.by_type[anomaly.anomaly_type] || 0) + 1;
      if (!anomaly.reviewed) summary.unresolved++;
    });

    return summary;
  };

  // Get credit freeze details
  const getFreezeDetails = () => {
    if (!freezeLog) return null;

    const now = new Date();
    const frozenAt = new Date(freezeLog.frozen_at);
    const daysFrozen = Math.floor(
      (now.getTime() - frozenAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      reason: freezeLog.freeze_reason,
      frozenAt: freezeLog.frozen_at,
      daysFrozen,
      creditsAffected: freezeLog.credits_frozen || 0,
      bySystem: freezeLog.frozen_by_system,
    };
  };

  // Check if user has high-risk patterns
  const hasHighRiskBehavior = (): boolean => {
    const critical = anomalies.filter(a => a.severity === 'critical').length;
    const high = anomalies.filter(a => a.severity === 'high').length;
    
    return critical > 0 || high >= 2;
  };

  // Get suspicious partners
  const getSuspiciousPartners = () => {
    return sessionPatterns
      .filter(p => p.suspicious_pattern)
      .map(p => ({
        partner_id: p.partner_id,
        total_sessions: p.total_sessions_together,
        pattern_type: p.pattern_type,
      }));
  };

  // Get recent anomalies (last 7 days)
  const getRecentAnomalies = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return anomalies.filter(a => {
      const detectionDate = new Date(a.detection_timestamp);
      return detectionDate >= sevenDaysAgo;
    });
  };

  // Check if user can earn credits
  const canEarnCredits = (): { allowed: boolean; reason?: string } => {
    if (creditsFrozen) {
      return {
        allowed: false,
        reason: freezeLog?.freeze_reason || 'Credits temporarily frozen',
      };
    }

    if (hasHighRiskBehavior()) {
      return {
        allowed: false,
        reason: 'High-risk behavior detected - under review',
      };
    }

    const unresolvedCritical = anomalies.filter(
      a => a.severity === 'critical' && !a.reviewed
    ).length;

    if (unresolvedCritical > 0) {
      return {
        allowed: false,
        reason: 'Critical issues pending review',
      };
    }

    return { allowed: true };
  };

  // Appeal credit freeze
  const appealFreeze = async (explanation: string): Promise<boolean> => {
    if (!user || !freezeLog) {
      toast.error('No active freeze to appeal');
      return false;
    }

    try {
      // In a real implementation, this would create an appeal ticket
      // For now, we'll just log it
      toast.info('Appeal submitted', {
        description: 'Your appeal will be reviewed by an administrator',
      });

      return true;
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      toast.error('Failed to submit appeal');
      return false;
    }
  };

  // Get behavioral health score (0-100)
  const getBehavioralHealthScore = (): number => {
    let score = 100;

    // Deduct for anomalies
    anomalies.forEach(a => {
      if (a.severity === 'critical') score -= 20;
      else if (a.severity === 'high') score -= 10;
      else if (a.severity === 'medium') score -= 5;
      else score -= 2;
    });

    // Deduct for patterns
    score -= sessionPatterns.length * 5;

    // Credit freeze penalty
    if (creditsFrozen) score -= 30;

    return Math.max(0, score);
  };

  return {
    anomalies,
    sessionPatterns,
    creditsFrozen,
    freezeLog,
    loading,
    getAnomalySummary,
    getFreezeDetails,
    hasHighRiskBehavior,
    getSuspiciousPartners,
    getRecentAnomalies,
    canEarnCredits,
    appealFreeze,
    getBehavioralHealthScore,
    refresh: () => {
      fetchAnomalies();
      fetchSessionPatterns();
      checkCreditFreeze();
    },
  };
}
