import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  Users, 
  Star,
  GraduationCap,
  BookOpen,
  Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSessionData } from '@/hooks/useSessionData';
import { useAuth } from '@/contexts/AuthContext';

type SessionType = 'all' | 'teaching' | 'learning';

export default function Sessions() {
  const [filter, setFilter] = useState<SessionType>('all');
  const { sessions, stats, loading, error } = useSessionData();
  const { user } = useAuth();

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.type === filter;
  });

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Please log in to view your sessions</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-destructive mb-2">Error loading sessions</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Session History
          </h1>
          <p className="text-muted-foreground">
            Track all your teaching and learning sessions
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <GraduationCap className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.teachingSessions}</p>
                  <p className="text-xs text-muted-foreground">Teaching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.learningSessions}</p>
                  <p className="text-xs text-muted-foreground">Learning</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(['all', 'teaching', 'learning'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'chrono' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="capitalize"
            >
              {type === 'all' ? 'All Sessions' : type}
            </Button>
          ))}
        </div>

        {/* Session List */}
        {filteredSessions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        session.type === 'teaching' 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-blue-500/20 text-blue-500"
                      )}>
                        {session.type === 'teaching' ? (
                          <GraduationCap className="h-6 w-6" />
                        ) : (
                          <BookOpen className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{session.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {session.type}
                          </Badge>
                          {session.status !== 'completed' && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                session.status === 'in-progress' && "text-primary border-primary/50",
                                session.status === 'pending' && "text-yellow-500 border-yellow-500/50"
                              )}
                            >
                              {session.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{session.date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.duration}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.partnerName}
                          </span>
                        </div>
                        {session.feedback && (
                          <p className="mt-1 text-sm text-muted-foreground italic">
                            "{session.feedback}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {session.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-medium">{session.rating}</span>
                        </div>
                      )}
                      <div className={cn(
                        "font-display text-lg font-bold",
                        session.creditsChange > 0 ? "text-green-500" : "text-foreground"
                      )}>
                        {session.creditsChange > 0 ? '+' : ''}{session.creditsChange}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No sessions found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Your session history will appear here once you start teaching or learning
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
