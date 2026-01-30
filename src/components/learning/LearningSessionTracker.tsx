import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  BookOpen, 
  Calendar,
  CheckCircle,
  Timer,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface LearningProgress {
  skill: string;
  hoursSpent: number;
  sessionsAttended: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lastSession?: string;
}

interface LearningSessionTrackerProps {
  totalHoursLearned: number;
  sessionsAttended: number;
  currentStreak: number;
  progress: LearningProgress[];
}

export function LearningSessionTracker({
  totalHoursLearned,
  sessionsAttended,
  currentStreak,
  progress
}: LearningSessionTrackerProps) {
  const getLevelProgress = (level: string): number => {
    switch (level) {
      case 'Beginner': return 33;
      case 'Intermediate': return 66;
      case 'Advanced': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {totalHoursLearned}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions Attended</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {sessionsAttended}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {currentStreak} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Skill Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            My Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No learning progress yet. Join a session to start tracking!
            </p>
          ) : (
            progress.map((item, index) => (
              <motion.div 
                key={item.skill} 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.skill}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {item.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    <span>{item.hoursSpent}h</span>
                    <span className="text-border">•</span>
                    <span>{item.sessionsAttended} sessions</span>
                  </div>
                </div>
                <Progress 
                  value={getLevelProgress(item.level)} 
                  className="h-2"
                />
                {item.lastSession && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last session: {item.lastSession}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
