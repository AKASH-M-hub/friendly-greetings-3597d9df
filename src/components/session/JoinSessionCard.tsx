import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AvailableSession {
  id: string;
  session_id: string;
  room_code: string;
  teacher_id: string;
  teacher_name: string;
  status: string;
  created_at: string;
}

interface JoinSessionCardProps {
  onJoinSession: (roomCode: string) => void;
}

export function JoinSessionCard({ onJoinSession }: JoinSessionCardProps) {
  const { user } = useAuth();
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchAvailableSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('available_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_rooms',
        },
        () => {
          fetchAvailableSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAvailableSessions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: rooms, error } = await supabase
        .from('session_rooms')
        .select(`
          id,
          session_id,
          room_code,
          teacher_id,
          status,
          created_at
        `)
        .eq('status', 'waiting')
        .is('learner_id', null)
        .neq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch teacher profiles
      const teacherIds = rooms?.map(r => r.teacher_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', teacherIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      const sessionsWithTeachers = (rooms || []).map(room => ({
        ...room,
        teacher_name: profileMap.get(room.teacher_id) || 'Teacher',
      }));

      setAvailableSessions(sessionsWithTeachers);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = () => {
    if (roomCode.trim()) {
      setJoining(true);
      onJoinSession(roomCode.trim());
    }
  };

  const handleJoinSession = (code: string) => {
    setJoining(true);
    onJoinSession(code);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Join a Live Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Join by code */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Have a room code? Enter it below to join:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="font-mono text-lg tracking-widest"
            />
            <Button
              onClick={handleJoinByCode}
              disabled={joining || !roomCode.trim()}
              className="gap-2"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Available sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Available Sessions</p>
            <Badge variant="outline">{availableSessions.length} live</Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : availableSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No live sessions available</p>
              <p className="text-sm text-muted-foreground/70">
                Check back later or enter a room code
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">{session.teacher_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Started {new Date(session.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="chrono"
                    onClick={() => handleJoinSession(session.room_code)}
                    disabled={joining}
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Join
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
