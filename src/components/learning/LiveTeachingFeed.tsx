import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Star, 
  Play, 
  Video,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalSessions: number;
}

export interface LiveSession {
  id: string;
  title: string;
  teacher: Teacher;
  category: string;
  skillArea: string;
  learners: number;
  maxLearners: number;
  duration: string;
  isLive: boolean;
  startsIn?: string;
}

interface LiveTeachingFeedProps {
  sessions: LiveSession[];
  onRequestSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export function LiveTeachingFeed({ sessions, onRequestSession, isLoading }: LiveTeachingFeedProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
        <Video className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">No live sessions available right now</p>
        <p className="text-sm text-muted-foreground/70">Check back later or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="group h-full cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
            <CardContent className="flex h-full flex-col p-5">
              {/* Status & Rating */}
              <div className="mb-3 flex items-start justify-between">
                <Badge 
                  variant="outline" 
                  className={session.isLive 
                    ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                    : "border-primary/50 bg-primary/10 text-primary"
                  }
                >
                  {session.isLive ? (
                    <>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live Now
                    </>
                  ) : (
                    `Starts in ${session.startsIn}`
                  )}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-medium">{session.teacher.rating.toFixed(1)}</span>
                </div>
              </div>
              
              {/* Session Title */}
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {session.title}
              </h3>
              
              {/* Teacher Profile */}
              <div className="mb-3 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.teacher.avatar} alt={session.teacher.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {session.teacher.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{session.teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{session.teacher.totalSessions} sessions</p>
                </div>
              </div>

              {/* Category Badge */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">{session.category}</Badge>
                <Badge variant="outline" className="text-xs">{session.skillArea}</Badge>
              </div>
              
              {/* Stats */}
              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {session.learners}/{session.maxLearners}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.duration}
                </span>
              </div>
              
              {/* Action Button */}
              <div className="mt-auto">
                <Button 
                  variant="chrono-outline" 
                  className="w-full gap-2"
                  disabled={session.learners >= session.maxLearners}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestSession(session.id);
                  }}
                >
                  <Play className="h-4 w-4" />
                  {session.learners >= session.maxLearners ? 'Session Full' : 'Request to Learn'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
