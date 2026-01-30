import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar,
  User,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SessionLogEntry {
  id: string;
  sessionId: string;
  role: 'teacher' | 'learner';
  partnerName: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  creditsEarned?: number;
  creditsSpent?: number;
  status: 'completed' | 'in-progress' | 'disputed' | 'pending-confirmation';
  confirmedByTeacher: boolean;
  confirmedByLearner: boolean;
}

interface DualSessionLogProps {
  sessions: SessionLogEntry[];
  currentUserId?: string;
}

export function DualSessionLog({ sessions }: DualSessionLogProps) {
  const getStatusBadge = (session: SessionLogEntry) => {
    switch (session.status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/20 text-primary animate-pulse">In Progress</Badge>;
      case 'disputed':
        return <Badge className="bg-destructive/20 text-destructive">Disputed</Badge>;
      case 'pending-confirmation':
        return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">Pending Confirmation</Badge>;
      default:
        return null;
    }
  };

  const getCreditsDisplay = (session: SessionLogEntry) => {
    if (session.status === 'disputed') {
      return (
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Credits Held</span>
        </div>
      );
    }

    if (session.role === 'teacher' && session.creditsEarned) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <ArrowUpRight className="h-4 w-4" />
          <span className="font-display font-bold">+{session.creditsEarned}</span>
        </div>
      );
    }

    if (session.role === 'learner' && session.creditsSpent) {
      return (
        <div className="flex items-center gap-1 text-primary">
          <ArrowDownRight className="h-4 w-4" />
          <span className="font-display font-bold">-{session.creditsSpent}</span>
        </div>
      );
    }

    return null;
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No sessions yet</p>
          <p className="text-sm text-muted-foreground/70">
            Your session history will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex gap-4">
                  {/* Role Icon */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    session.role === 'teacher' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {session.role === 'teacher' ? (
                      <GraduationCap className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>

                  {/* Session Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{session.topic}</p>
                      {getStatusBadge(session)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-3.5 w-3.5" />
                      <span>
                        {session.role === 'teacher' ? 'Taught' : 'Learned from'} {session.partnerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time} • {session.duration}
                      </span>
                    </div>

                    {/* Confirmation Status for pending sessions */}
                    {session.status === 'pending-confirmation' && (
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className={session.confirmedByTeacher ? 'text-green-500' : 'text-muted-foreground'}>
                          Teacher: {session.confirmedByTeacher ? '✓' : '○'}
                        </span>
                        <span className={session.confirmedByLearner ? 'text-green-500' : 'text-muted-foreground'}>
                          Learner: {session.confirmedByLearner ? '✓' : '○'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Credits */}
                <div className="text-right">
                  {getCreditsDisplay(session)}
                  <p className="text-xs text-muted-foreground mt-1">
                    Session ID: {session.sessionId.slice(0, 8)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
