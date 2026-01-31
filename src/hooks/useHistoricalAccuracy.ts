import { useState, useEffect, useCallback } from 'react';
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

    // Use mock data - historical_accuracy table not yet created
    // In production, this would fetch from database
    const mockEntries: HistoricalEntry[] = [
      {
        id: '1',
        recommendationType: 'session_match',
        predictionMade: 'High compatibility',
        actualOutcome: 'Successful session',
        accuracyScore: 0.92,
        evaluatedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: '2',
        recommendationType: 'skill_suggestion',
        predictionMade: 'Good fit',
        actualOutcome: 'Completed',
        accuracyScore: 0.85,
        evaluatedAt: new Date(),
        createdAt: new Date(),
      }
    ];

    setEntries(mockEntries);

    // Calculate stats
    const evaluated = mockEntries.filter(e => e.accuracyScore !== null);
    const accuracySum = evaluated.reduce((acc, e) => acc + (e.accuracyScore || 0), 0);
    const successCount = evaluated.filter(e => (e.accuracyScore || 0) >= 0.7).length;

    setStats({
      totalPredictions: mockEntries.length,
      evaluatedPredictions: evaluated.length,
      averageAccuracy: evaluated.length > 0 ? accuracySum / evaluated.length : 0,
      successRate: evaluated.length > 0 ? successCount / evaluated.length : 0,
    });
    setLoading(false);
  }, [user]);

  const recordPrediction = useCallback(async (
    recommendationType: string,
    predictionMade: string
  ) => {
    if (!user) return;

    // In production, this would insert into database
    const newEntry: HistoricalEntry = {
      id: crypto.randomUUID(),
      recommendationType,
      predictionMade,
      actualOutcome: null,
      accuracyScore: null,
      evaluatedAt: null,
      createdAt: new Date(),
    };

    setEntries(prev => [newEntry, ...prev]);
  }, [user]);

  const evaluatePrediction = useCallback(async (
    entryId: string,
    actualOutcome: string,
    accuracyScore: number
  ) => {
    if (!user) return;

    setEntries(prev => prev.map(e => 
      e.id === entryId 
        ? { ...e, actualOutcome, accuracyScore, evaluatedAt: new Date() }
        : e
    ));
  }, [user]);

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
