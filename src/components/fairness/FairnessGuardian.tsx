import { motion } from 'framer-motion';
import { Scale, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFairnessGuardian } from '@/hooks/useFairnessGuardian';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function FairnessGuardian() {
  const { fairnessData, loading, getFairnessAdvisory } = useFairnessGuardian();
  const navigate = useNavigate();
  
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

  const advisory = getFairnessAdvisory();
  const { giveReceiveRatio, fairnessScore, totalGivenHours, totalReceivedHours, cooldownUntil } = fairnessData;
  
  const isBalanced = giveReceiveRatio >= 0.8 && giveReceiveRatio <= 1.2;
  const isGiving = giveReceiveRatio > 1.2;
  const isReceiving = giveReceiveRatio < 0.8;

  return (
    <Card className={cn(
      "overflow-hidden",
      advisory.cooldownActive && "border-red-500/30",
      !advisory.isBalanced && !advisory.cooldownActive && "border-amber-500/30",
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-primary" />
          Fair Exchange Guardian
          {advisory.cooldownActive && (
            <Badge variant="destructive" className="ml-auto">Cooldown Active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fairness Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-4"
        >
          <div className={cn(
            "flex items-center justify-center rounded-full p-3",
            fairnessScore >= 80 && "bg-green-500/10",
            fairnessScore >= 50 && fairnessScore < 80 && "bg-yellow-500/10",
            fairnessScore < 50 && "bg-red-500/10"
          )}>
            {fairnessScore >= 80 ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : fairnessScore >= 50 ? (
              <Scale className="h-8 w-8 text-yellow-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{fairnessScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="text-sm text-muted-foreground">Fairness Score</p>
          </div>
        </motion.div>

        {/* Give/Receive Ratio Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              Given: {totalGivenHours.toFixed(1)}h
            </span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <ArrowDownRight className="h-4 w-4" />
              Received: {totalReceivedHours.toFixed(1)}h
            </span>
          </div>
          
          <div className="relative h-6 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, (totalGivenHours / (totalGivenHours + totalReceivedHours || 1)) * 100)}%` 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full bg-green-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, (totalReceivedHours / (totalGivenHours + totalReceivedHours || 1)) * 100)}%` 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute right-0 top-0 h-full bg-blue-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white drop-shadow-md">
                {giveReceiveRatio.toFixed(2)} ratio
              </span>
            </div>
          </div>
          
          <div className="flex justify-center">
            {isGiving && (
              <Badge variant="outline" className="text-green-600 border-green-600/30">
                <TrendingUp className="mr-1 h-3 w-3" /> Net Giver
              </Badge>
            )}
            {isReceiving && (
              <Badge variant="outline" className="text-blue-600 border-blue-600/30">
                <TrendingDown className="mr-1 h-3 w-3" /> Net Receiver
              </Badge>
            )}
            {isBalanced && (
              <Badge variant="outline" className="text-primary border-primary/30">
                <Scale className="mr-1 h-3 w-3" /> Balanced
              </Badge>
            )}
          </div>
        </div>

        {/* Cooldown Timer */}
        {advisory.cooldownActive && cooldownUntil && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
          >
            <Clock className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Cooldown Active
              </p>
              <p className="text-xs text-muted-foreground">
                Ends: {cooldownUntil.toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Advisory Message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-lg border p-3",
            advisory.isBalanced ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <p className="text-sm text-muted-foreground">{advisory.message}</p>
          {advisory.suggestedAction && (
            <p className="mt-1 text-xs font-medium text-primary">
              💡 {advisory.suggestedAction}
            </p>
          )}
        </motion.div>

        {/* Action Button */}
        {!advisory.isBalanced && (
          <Button 
            variant="chrono-outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/teaching')}
          >
            Start Teaching to Improve Balance
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
