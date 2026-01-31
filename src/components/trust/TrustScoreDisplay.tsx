import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, HelpCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTrustScore } from '@/hooks/useTrustScore';
import { cn } from '@/lib/utils';

export function TrustScoreDisplay() {
  const { trustData, loading, getTrustAdvisory, calculateTrustLevel } = useTrustScore();
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-8 w-full rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const advisory = getTrustAdvisory(trustData.overallConfidence);
  const trustLevel = calculateTrustLevel(trustData.overallConfidence);

  const levelColors = {
    high: 'text-green-500',
    medium: 'text-yellow-500',
    low: 'text-orange-500',
    uncertain: 'text-red-500',
  };

  const levelBgColors = {
    high: 'bg-green-500/10',
    medium: 'bg-yellow-500/10',
    low: 'bg-orange-500/10',
    uncertain: 'bg-red-500/10',
  };

  const LevelIcon = {
    high: CheckCircle,
    medium: Info,
    low: AlertTriangle,
    uncertain: HelpCircle,
  }[trustLevel];

  return (
    <Card className={cn("overflow-hidden", levelBgColors[trustLevel])}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Trust & Reliability Score
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>This score indicates how confident we are in our recommendations based on your data history and consistency.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-4"
        >
          <div className={cn("flex items-center justify-center rounded-full p-3", levelBgColors[trustLevel])}>
            <LevelIcon className={cn("h-8 w-8", levelColors[trustLevel])} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{trustData.overallConfidence}%</span>
              <Badge variant="outline" className={levelColors[trustLevel]}>
                {trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1)} Confidence
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Decision Reliability Index</p>
          </div>
        </motion.div>

        {/* Detailed Metrics */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Freshness</span>
              <span className="font-medium">{trustData.dataFreshness}%</span>
            </div>
            <Progress value={trustData.dataFreshness} className="h-2" />
          </div>
          
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Consistency</span>
              <span className="font-medium">{trustData.dataConsistency}%</span>
            </div>
            <Progress value={trustData.dataConsistency} className="h-2" />
          </div>
          
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reliability Index</span>
              <span className="font-medium">{trustData.reliabilityIndex}%</span>
            </div>
            <Progress value={trustData.reliabilityIndex} className="h-2" />
          </div>
        </div>

        {/* Advisory Message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-lg border p-3",
            trustLevel === 'uncertain' && "border-red-500/30 bg-red-500/5",
            trustLevel === 'low' && "border-orange-500/30 bg-orange-500/5",
            trustLevel === 'medium' && "border-yellow-500/30 bg-yellow-500/5",
            trustLevel === 'high' && "border-green-500/30 bg-green-500/5"
          )}
        >
          <p className="text-sm text-muted-foreground">
            {advisory.message}
          </p>
        </motion.div>

        {/* Uncertainty Flag */}
        {trustData.uncertaintyFlagged && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Uncertainty Awareness Mode
              </p>
              <p className="text-xs text-muted-foreground">
                {trustData.explanation || "Some outputs are generated with limited data."}
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
