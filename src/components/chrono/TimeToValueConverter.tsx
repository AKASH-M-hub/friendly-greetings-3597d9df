import { motion } from 'framer-motion';
import { ArrowRight, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VALUE_UNIT_RATES, ValueRestoration } from '@/types/chrono';

interface TimeToValueConverterProps {
  restoration: ValueRestoration | null;
  loading?: boolean;
}

export function TimeToValueConverter({ restoration, loading }: TimeToValueConverterProps) {
  if (loading || !restoration) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalHours = restoration.hoursTeaching + restoration.hoursLearning;
  const conversionRate = totalHours > 0 ? restoration.totalVU / totalHours : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Time → Value Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Conversion Display */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="h-3.5 w-3.5" />
                Hours Invested
              </div>
              <div className="font-display text-4xl font-bold text-foreground mt-1">
                {totalHours.toFixed(1)}h
              </div>
            </div>
            
            <ArrowRight className="h-8 w-8 text-primary" />
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Value Created</div>
              <div className="font-display text-4xl font-bold text-primary mt-1">
                {restoration.totalVU.toFixed(1)} VU
              </div>
            </div>
          </div>

          {/* Conversion Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Teaching ({restoration.hoursTeaching}h × {VALUE_UNIT_RATES.TEACHING_HOUR} VU)
              </span>
              <span className="font-medium text-foreground">{restoration.teachingVU} VU</span>
            </div>
            <Progress value={(restoration.teachingVU / (restoration.totalVU || 1)) * 100} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Learning ({restoration.hoursLearning}h × {VALUE_UNIT_RATES.LEARNING_HOUR} VU)
              </span>
              <span className="font-medium text-foreground">{restoration.learningVU} VU</span>
            </div>
            <Progress value={(restoration.learningVU / (restoration.totalVU || 1)) * 100} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Sessions ({restoration.sessionsCompleted} × {VALUE_UNIT_RATES.COMPLETED_SESSION} VU)
              </span>
              <span className="font-medium text-foreground">{restoration.sessionVU} VU</span>
            </div>
            <Progress value={(restoration.sessionVU / (restoration.totalVU || 1)) * 100} className="h-2" />
          </div>

          {/* Efficiency Indicator */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Value per Hour</span>
              <span className="font-medium text-primary">
                {conversionRate.toFixed(2)} VU/hour
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
