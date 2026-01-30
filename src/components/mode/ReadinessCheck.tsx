import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadinessCheckProps {
  onComplete: (ready: boolean) => void;
  isVisible: boolean;
}

interface CheckItem {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'checking' | 'passed' | 'failed';
}

export function ReadinessCheck({ onComplete, isVisible }: ReadinessCheckProps) {
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: 'internet', label: 'Internet Connection', icon: Wifi, status: 'pending' },
    { id: 'time', label: 'Time Availability', icon: Clock, status: 'pending' },
  ]);

  useEffect(() => {
    if (!isVisible) return;

    const runChecks = async () => {
      // Check internet
      setChecks(prev => prev.map(c => 
        c.id === 'internet' ? { ...c, status: 'checking' } : c
      ));
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isOnline = navigator.onLine;
      setChecks(prev => prev.map(c => 
        c.id === 'internet' ? { ...c, status: isOnline ? 'passed' : 'failed' } : c
      ));

      // Check time (simulated - always pass for now)
      setChecks(prev => prev.map(c => 
        c.id === 'time' ? { ...c, status: 'checking' } : c
      ));
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setChecks(prev => prev.map(c => 
        c.id === 'time' ? { ...c, status: 'passed' } : c
      ));

      // Complete
      await new Promise(resolve => setTimeout(resolve, 400));
      onComplete(isOnline);
    };

    runChecks();
  }, [isVisible, onComplete]);

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            Session Readiness Check
          </h3>
          <div className="space-y-3">
            {checks.map((check, index) => {
              const Icon = check.icon;
              return (
                <motion.div
                  key={check.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-4 transition-colors duration-300",
                    check.status === 'passed' && "border-green-500/30 bg-green-500/5",
                    check.status === 'failed' && "border-red-500/30 bg-red-500/5",
                    check.status === 'checking' && "border-primary/30 bg-primary/5",
                    check.status === 'pending' && "border-border"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    check.status === 'passed' && "bg-green-500/20 text-green-500",
                    check.status === 'failed' && "bg-red-500/20 text-red-500",
                    check.status === 'checking' && "bg-primary/20 text-primary",
                    check.status === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {check.label}
                  </span>
                  {getStatusIcon(check.status)}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
