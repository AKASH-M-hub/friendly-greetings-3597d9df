import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  creditInfo: string;
  isSelected: boolean;
  onClick: () => void;
  variant: 'teaching' | 'learning';
}

export function ModeCard({
  icon: Icon,
  title,
  description,
  features,
  creditInfo,
  isSelected,
  onClick,
  variant,
}: ModeCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border-2 p-8 text-left transition-all duration-500",
        "bg-card hover:shadow-2xl",
        isSelected
          ? "border-primary shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500",
          isSelected ? "opacity-100" : "group-hover:opacity-50",
          variant === 'teaching'
            ? "bg-gradient-to-br from-primary/10 via-transparent to-transparent"
            : "bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
          isSelected
            ? "bg-primary text-primary-foreground shadow-lg"
            : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
        )}
      >
        <Icon className="h-8 w-8" />
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="relative mb-2 font-display text-2xl font-bold text-foreground">
        {title}
      </h3>
      <p className="relative mb-6 text-muted-foreground">{description}</p>

      {/* Features */}
      <ul className="relative mb-6 space-y-3">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 text-sm text-foreground/80"
          >
            <span className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {feature}
          </motion.li>
        ))}
      </ul>

      {/* Credit Info */}
      <div
        className={cn(
          "relative mt-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
          variant === 'teaching'
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : "bg-primary/10 text-primary"
        )}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {creditInfo}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/50"
        />
      )}
    </motion.button>
  );
}
