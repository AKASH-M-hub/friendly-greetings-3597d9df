import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HistoricalEntry {
  id: string;
  recommendationType: string;
  predictionMade: string | null;
  actualOutcome: string | null;
  accuracyScore: number | null;
  evaluatedAt: Date | null;
  createdAt: Date;
}

interface HistoricalStats {
  totalPredictions: number;
  evaluatedPredictions: number;
  averageAccuracy: number;
  successRate: number;
}

export function useHistoricalAccuracy() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoricalEntry[]>([]);
  const [stats, setStats] = useState<HistoricalStats>({
    totalPredictions: 0,
    evaluatedPredictions: 0,
    averageAccuracy: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('historical_accuracy')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedEntries: HistoricalEntry[] = (data || []).map(d => ({
        id: d.id,
        recommendationType: d.recommendation_type,
        predictionMade: d.prediction_made,
        actualOutcome: d.actual_outcome,
        accuracyScore: d.accuracy_score ? Number(d.accuracy_score) : null,
        evaluatedAt: d.evaluated_at ? new Date(d.evaluated_at) : null,
        createdAt: new Date(d.created_at!),
      }));

      setEntries(formattedEntries);

      // Calculate stats
      const evaluated = formattedEntries.filter(e => e.accuracyScore !== null);
      const accuracySum = evaluated.reduce((acc, e) => acc + (e.accuracyScore || 0), 0);
      const successCount = evaluated.filter(e => (e.accuracyScore || 0) >= 0.7).length;

      setStats({
        totalPredictions: formattedEntries.length,
        evaluatedPredictions: evaluated.length,
        averageAccuracy: evaluated.length > 0 ? accuracySum / evaluated.length : 0,
        successRate: evaluated.length > 0 ? successCount / evaluated.length : 0,
      });
    } catch (error) {
      console.error('Error fetching historical accuracy:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordPrediction = useCallback(async (
    recommendationType: string,
    predictionMade: string
  ) => {
    if (!user) return;

    await supabase.from('historical_accuracy').insert({
      user_id: user.id,
      recommendation_type: recommendationType,
      prediction_made: predictionMade,
    });

    fetchData();
  }, [user, fetchData]);

  const evaluatePrediction = useCallback(async (
    entryId: string,
    actualOutcome: string,
    accuracyScore: number
  ) => {
    if (!user) return;

    await supabase
      .from('historical_accuracy')
      .update({
        actual_outcome: actualOutcome,
        accuracy_score: accuracyScore,
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', user.id);

    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    entries,
    stats,
    loading,
    recordPrediction,
    evaluatePrediction,
    refetch: fetchData,
  };
}
