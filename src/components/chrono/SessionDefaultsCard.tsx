import { motion } from 'framer-motion';
import { Settings2, Clock, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SessionDefaults } from '@/types/chrono';

interface SessionDefaultsCardProps {
  defaults: SessionDefaults | null;
  loading?: boolean;
  onApply?: (defaults: SessionDefaults) => void;
}

export function SessionDefaultsCard({ defaults, loading, onApply }: SessionDefaultsCardProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-pulse text-muted-foreground">Learning your preferences...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!defaults) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Settings2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Complete more sessions to unlock smart defaults
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidenceColors = {
    high: 'bg-green-500/20 text-green-600',
    medium: 'bg-yellow-500/20 text-yellow-600',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Quick Start
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${confidenceColors[defaults.confidence]}`}>
              {defaults.confidence} confidence
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Based on {defaults.basedOnPreviousSessions} previous sessions
          </p>

          {/* Suggested Defaults */}
          <div className="grid grid-cols-2 gap-3">
            {defaults.suggestedSkill && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <BookOpen className="h-3 w-3" />
                  Skill
                </div>
                <p className="font-medium text-foreground truncate">
                  {defaults.suggestedSkill}
                </p>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                Duration
              </div>
              <p className="font-medium text-foreground">
                {defaults.suggestedDuration} min
              </p>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={() => onApply?.(defaults)}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply Defaults
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
