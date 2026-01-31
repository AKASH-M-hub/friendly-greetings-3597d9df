import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ScheduledSession {
  id: string;
  seminar_id: string;
  status: string;
  scheduled_date: string | null;
  meeting_link?: string;
  seminars?: {
    title: string;
    duration: string;
    category: string;
  };
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function ScheduledClasses() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScheduledSessions();
    }
  }, [user]);

  const fetchScheduledSessions = async () => {
    if (!user) return;

    try {
      const { data: requests, error } = await supabase
        .from('session_requests')
        .select('*')
        .eq('learner_id', user.id)
        .eq('status', 'accepted')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      if (!requests || requests.length === 0) {
        setSessions([]);
        return;
      }

      // Manually fetch related data since FKs are missing
      const sessionIds = requests.map(r => r.session_id).filter(Boolean);
      const teacherIds = requests.map(r => r.teacher_id);

      const [sessionsDesc, profilesDesc, roomsDesc] = await Promise.all([
        supabase.from('teaching_sessions').select('*').in('id', sessionIds),
        supabase.from('profiles').select('id, display_name, avatar_url').in('id', teacherIds),
        supabase.from('session_rooms').select('session_id, room_code').in('session_id', sessionIds)
      ]);

      const sessionMap = new Map(sessionsDesc.data?.map(s => [s.id, s]));
      const profileMap = new Map(profilesDesc.data?.map(p => [p.id, p]));
      const roomMap = new Map(roomsDesc.data?.map(r => [r.session_id, r]));

      const mappedSessions: ScheduledSession[] = requests.map(req => {
        const sessionData = sessionMap.get(req.session_id);
        const profileData = profileMap.get(req.teacher_id);
        const roomData = roomMap.get(req.session_id);

        return {
          id: req.id,
          seminar_id: req.session_id || '', // fallback
          status: req.status,
          scheduled_date: req.scheduled_at,
          meeting_link: roomData?.room_code,
          seminars: {
            title: sessionData?.title || 'Unknown Session',
            duration: '1h', // Default
            category: 'General' // Default
          },
          profiles: {
            display_name: profileData?.display_name || 'Teacher',
            avatar_url: profileData?.avatar_url || null
          }
        };
      });

      setSessions(mappedSessions);
    } catch (error) {
      console.error('Error fetching scheduled sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'To be scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            My Scheduled Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border p-4">
                <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          My Scheduled Classes
          {sessions.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sessions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No scheduled classes yet. Request to join a seminar to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border border-border p-4 transition-colors hover:border-primary/30"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">
                      {session.seminars?.title || 'Untitled Session'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {session.seminars?.category}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Confirmed
                  </Badge>
                </div>

                <div className="mb-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(session.scheduled_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{session.seminars?.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      {session.profiles?.avatar_url ? (
                        <img
                          src={session.profiles.avatar_url}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {session.profiles?.display_name || 'Teacher'}
                    </span>
                  </div>

                  {session.meeting_link ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                      onClick={() => window.open(session.meeting_link, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join Google Meet
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic px-2">
                      Waiting for link...
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
