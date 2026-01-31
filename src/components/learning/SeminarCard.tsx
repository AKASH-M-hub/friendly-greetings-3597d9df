import { motion } from 'framer-motion';
import { Clock, Users, GraduationCap, Star, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Seminar {
  id: string;
  title: string;
  description: string | null;
  category: string;
  skill_level: string;
  duration: string;
  max_learners: number;
  prerequisites: string | null;
  teacher_id: string;
  teacher_name?: string;
  teacher_avatar?: string | null;
  created_at: string;
  request_count?: number;
  has_requested?: boolean;
}

interface SeminarCardProps {
  seminar: Seminar;
  onRequest: (seminarId: string) => void;
  isRequesting?: boolean;
}

export function SeminarCard({ seminar, onRequest, isRequesting }: SeminarCardProps) {
  const skillLevelColors: Record<string, string> = {
    Beginner: 'bg-green-500/10 text-green-600 dark:text-green-400',
    Intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    Advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group h-full overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
        <CardContent className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <Badge 
                variant="outline" 
                className="mb-2 text-xs"
              >
                {seminar.category}
              </Badge>
              <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">
                {seminar.title}
              </h3>
            </div>
            <Badge 
              className={cn(
                "ml-2 shrink-0 text-xs",
                skillLevelColors[seminar.skill_level] || skillLevelColors.Beginner
              )}
            >
              {seminar.skill_level}
            </Badge>
          </div>

          {/* Description */}
          {seminar.description && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
              {seminar.description}
            </p>
          )}

          {/* Teacher Info */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              {seminar.teacher_avatar ? (
                <img 
                  src={seminar.teacher_avatar} 
                  alt={seminar.teacher_name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <GraduationCap className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {seminar.teacher_name || 'Teacher'}
              </p>
              <p className="text-xs text-muted-foreground">Instructor</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{seminar.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Max {seminar.max_learners}</span>
            </div>
          </div>

          {/* Prerequisites */}
          {seminar.prerequisites && (
            <p className="mb-4 text-xs text-muted-foreground">
              <span className="font-medium">Prerequisites:</span> {seminar.prerequisites}
            </p>
          )}

          {/* Request Button */}
          <Button
            onClick={() => onRequest(seminar.id)}
            disabled={isRequesting || seminar.has_requested}
            className="w-full gap-2"
            variant={seminar.has_requested ? "outline" : "default"}
          >
            {seminar.has_requested ? (
              <>
                <Star className="h-4 w-4" />
                Request Sent
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isRequesting ? 'Sending...' : 'Request to Join'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
