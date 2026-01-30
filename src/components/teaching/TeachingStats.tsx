import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Star, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeachingStatsData {
  totalHoursTaught: number;
  activeStudents: number;
  averageRating: number;
  reviewCount: number;
  creditsEarned: number;
  weeklyHours: number;
  weeklyCredits: number;
  newStudents: number;
}

export function TeachingStats() {
  const [stats, setStats] = useState<TeachingStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get all sessions
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('actual_minutes, credits_earned, created_at, status')
        .eq('teacher_id', user.id);

      // Get all reviews
      const { data: reviews } = await supabase
        .from('teaching_reviews')
        .select('experience_rating')
        .eq('teacher_id', user.id);

      // Get unique learners (from requests)
      const { data: requests } = await supabase
        .from('session_requests')
        .select('learner_id, created_at, status')
        .eq('teacher_id', user.id);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate stats
      const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
      const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actual_minutes || 0), 0);
      const totalCredits = completedSessions.reduce((sum, s) => sum + (s.credits_earned || 0), 0);

      const weekSessions = completedSessions.filter(s => new Date(s.created_at) >= weekAgo);
      const weeklyMinutes = weekSessions.reduce((sum, s) => sum + (s.actual_minutes || 0), 0);
      const weeklyCredits = weekSessions.reduce((sum, s) => sum + (s.credits_earned || 0), 0);

      const uniqueLearners = new Set(requests?.map(r => r.learner_id) || []);
      const newLearners = new Set(
        requests?.filter(r => new Date(r.created_at) >= weekAgo).map(r => r.learner_id) || []
      );

      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.experience_rating, 0) / reviews.length 
        : 0;

      setStats({
        totalHoursTaught: Math.round(totalMinutes / 60 * 10) / 10,
        activeStudents: uniqueLearners.size,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews?.length || 0,
        creditsEarned: totalCredits,
        weeklyHours: Math.round(weeklyMinutes / 60 * 10) / 10,
        weeklyCredits: weeklyCredits,
        newStudents: newLearners.size,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { 
      label: 'Total Hours Taught', 
      value: stats.totalHoursTaught.toString(), 
      icon: Clock, 
      change: `+${stats.weeklyHours}h this week` 
    },
    { 
      label: 'Active Students', 
      value: stats.activeStudents.toString(), 
      icon: Users, 
      change: `+${stats.newStudents} new` 
    },
    { 
      label: 'Average Rating', 
      value: stats.averageRating.toFixed(1), 
      icon: Star, 
      change: `From ${stats.reviewCount} reviews` 
    },
    { 
      label: 'Credits Earned', 
      value: stats.creditsEarned.toString(), 
      icon: TrendingUp, 
      change: `+${stats.weeklyCredits} this week` 
    },
  ] : [];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 font-display text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-primary">{stat.change}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
