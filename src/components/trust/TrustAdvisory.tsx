import { motion } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrustLevel, TrustAdvisory as TrustAdvisoryType } from '@/types/modules';

interface TrustAdvisoryProps {
  advisory: TrustAdvisoryType;
  className?: string;
}

export function TrustAdvisory({ advisory, className }: TrustAdvisoryProps) {
  const levelConfig: Record<TrustLevel, { 
    icon: React.ReactNode; 
    bgColor: string;
    borderColor: string;
    textColor: string;
  }> = {
    high: {
      icon: <CheckCircle className="h-4 w-4" />,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    medium: {
      icon: <Info className="h-4 w-4" />,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    low: {
      icon: <AlertTriangle className="h-4 w-4" />,
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    uncertain: {
      icon: <AlertTriangle className="h-4 w-4" />,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-600 dark:text-red-400',
    },
  };

  const config = levelConfig[advisory.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <span className={cn("mt-0.5", config.textColor)}>
        {config.icon}
      </span>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", config.textColor)}>
          {advisory.level.charAt(0).toUpperCase() + advisory.level.slice(1)} Confidence
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {advisory.message}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>Based on {advisory.dataPoints} data points</span>
          <span>•</span>
          <span>{advisory.confidenceRange[0]}%-{advisory.confidenceRange[1]}% range</span>
        </div>
      </div>
    </motion.div>
  );
}
