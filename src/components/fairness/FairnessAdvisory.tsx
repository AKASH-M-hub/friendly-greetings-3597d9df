import { motion } from 'framer-motion';
import { Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FairnessAdvisory as FairnessAdvisoryType } from '@/types/modules';

interface FairnessAdvisoryProps {
  advisory: FairnessAdvisoryType;
  className?: string;
}

export function FairnessAdvisory({ advisory, className }: FairnessAdvisoryProps) {
  const isWarning = !advisory.isBalanced || advisory.cooldownActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3",
        advisory.cooldownActive 
          ? "bg-red-500/10 border-red-500/30" 
          : isWarning 
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-green-500/10 border-green-500/30",
        className
      )}
    >
      <span className={cn(
        "mt-0.5",
        advisory.cooldownActive 
          ? "text-red-600 dark:text-red-400" 
          : isWarning 
            ? "text-amber-600 dark:text-amber-400"
            : "text-green-600 dark:text-green-400"
      )}>
        {advisory.cooldownActive ? (
          <AlertTriangle className="h-4 w-4" />
        ) : isWarning ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <Scale className="h-4 w-4" />
        )}
      </span>
      <div className="flex-1">
        <p className={cn(
          "text-sm font-medium",
          advisory.cooldownActive 
            ? "text-red-600 dark:text-red-400" 
            : isWarning 
              ? "text-amber-600 dark:text-amber-400"
              : "text-green-600 dark:text-green-400"
        )}>
          {advisory.cooldownActive ? "Cooldown Active" : isWarning ? "Imbalance Detected" : "Fair Exchange"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {advisory.message}
        </p>
        {advisory.suggestedAction && (
          <p className="text-xs font-medium text-primary mt-1">
            💡 {advisory.suggestedAction}
          </p>
        )}
      </div>
    </motion.div>
  );
}
