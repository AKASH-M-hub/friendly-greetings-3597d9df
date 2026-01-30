import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Clock, 
  Star, 
  TrendingUp,
  PlayCircle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMode } from '@/contexts/ModeContext';

const stats = [
  { label: 'Total Hours Taught', value: '24.5', icon: Clock, change: '+2.5h this week' },
  { label: 'Active Students', value: '12', icon: Users, change: '+3 new' },
  { label: 'Average Rating', value: '4.8', icon: Star, change: 'From 18 reviews' },
  { label: 'Credits Earned', value: '49', icon: TrendingUp, change: '+6 this week' },
];

const upcomingSessions = [
  { id: 1, title: 'React Fundamentals', learners: 3, time: '2:00 PM', duration: '1h' },
  { id: 2, title: 'TypeScript Basics', learners: 5, time: '4:30 PM', duration: '1.5h' },
];

const recentFeedback = [
  { id: 1, learner: 'Alex M.', rating: 5, comment: 'Great explanation of hooks!', session: 'React Fundamentals' },
  { id: 2, learner: 'Sarah K.', rating: 5, comment: 'Very patient and thorough.', session: 'CSS Grid' },
];

export default function TeachingDashboard() {
  const { unlockMode } = useMode();
  const [isSessionActive, setIsSessionActive] = useState(false);

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Teaching Dashboard
            </h1>
            <p className="text-muted-foreground">
              Share your knowledge and earn credits
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="chrono-outline" 
              onClick={() => unlockMode()}
            >
              Switch Mode
            </Button>
            <Button variant="chrono" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
                  onClick={() => setIsSessionActive(!isSessionActive)}
                >
                  {isSessionActive ? (
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
                {isSessionActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 rounded-lg bg-green-500/10 border border-green-500/30 p-4"
                  >
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Session is live • 0:00:00</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.learners} learners • {session.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-semibold text-primary">{session.time}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No upcoming sessions scheduled
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {recentFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-foreground">{feedback.learner}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: feedback.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">"{feedback.comment}"</p>
                      <p className="text-xs text-muted-foreground">Session: {feedback.session}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
