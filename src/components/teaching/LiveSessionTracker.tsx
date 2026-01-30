import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, StopCircle, Clock, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LiveSessionTrackerProps {
  onSessionChange?: (isActive: boolean) => void;
}

export function LiveSessionTracker({ onSessionChange }: LiveSessionTrackerProps) {
  const [activeSession, setActiveSession] = useState<{
    id: string;
    started_at: string;
    title: string | null;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch active session on mount
  useEffect(() => {
    if (user) {
      fetchActiveSession();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (activeSession?.started_at) {
      const startTime = new Date(activeSession.started_at).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [activeSession?.started_at]);

  const fetchActiveSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('teaching_sessions')
      .select('id, started_at, title')
      .eq('teacher_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setActiveSession(data);
      onSessionChange?.(true);
    }
  };

  const startSession = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teaching_sessions')
        .insert({
          teacher_id: user.id,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id, started_at, title')
        .single();

      if (error) throw error;

      setActiveSession(data);
      setElapsedTime(0);
      onSessionChange?.(true);
      
      toast({
        title: 'Session started!',
        description: 'Your teaching session is now live.',
      });
    } catch (error: any) {
      toast({
        title: 'Error starting session',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!user || !activeSession) return;

    setLoading(true);
    try {
      const actualMinutes = Math.ceil(elapsedTime / 60);
      const creditsEarned = Math.floor(actualMinutes / 5); // 1 credit per 5 minutes

      const { error } = await supabase
        .from('teaching_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          actual_minutes: actualMinutes,
          credits_earned: creditsEarned,
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setActiveSession(null);
      setElapsedTime(0);
      onSessionChange?.(false);

      toast({
        title: 'Session ended!',
        description: `You taught for ${actualMinutes} minutes and earned ${creditsEarned} credits.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error ending session',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Quick Start Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">
          Start a live session instantly and let learners join you.
        </p>
        
        <Button
          variant="chrono"
          className="w-full gap-2"
          onClick={activeSession ? endSession : startSession}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : activeSession ? (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              End Session
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Start Live Session
            </>
          )}
        </Button>

        {activeSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Session is live</span>
                </div>
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Learners can join your session now</span>
              </div>
              <span className="text-primary font-medium">
                {Math.floor(elapsedTime / 60)} min
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
