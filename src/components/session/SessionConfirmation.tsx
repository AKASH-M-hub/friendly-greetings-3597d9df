import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Timer,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface SessionConfirmationProps {
  isOpen: boolean;
  sessionId: string;
  partnerName: string;
  topic: string;
  duration: number; // in minutes
  role: 'teacher' | 'learner';
  creditsToTransfer: number;
  onConfirm: () => void;
  onDispute: () => void;
  autoConfirmSeconds?: number; // default 300 (5 minutes)
}

export function SessionConfirmation({
  isOpen,
  sessionId,
  partnerName,
  topic,
  duration,
  role,
  creditsToTransfer,
  onConfirm,
  onDispute,
  autoConfirmSeconds = 300
}: SessionConfirmationProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(autoConfirmSeconds);
  const [isAutoConfirmed, setIsAutoConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(autoConfirmSeconds);
      setIsAutoConfirmed(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAutoConfirmed(true);
          setTimeout(onConfirm, 1500); // Auto-confirm after showing message
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoConfirmSeconds, onConfirm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((autoConfirmSeconds - secondsRemaining) / autoConfirmSeconds) * 100;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <AnimatePresence mode="wait">
          {isAutoConfirmed ? (
            <motion.div
              key="auto-confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Session Auto-Confirmed
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Credits have been transferred automatically
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DialogHeader>
                <DialogTitle>Confirm Session Completion</DialogTitle>
                <DialogDescription>
                  Please confirm that the session was completed successfully
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Session Details */}
                <Card className="border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Topic:</span>
                      <span className="font-medium text-foreground">{topic}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {role === 'teacher' ? 'Student:' : 'Teacher:'}
                      </span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {partnerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {duration} minutes
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-border pt-3 mt-3">
                      <span className="text-muted-foreground">
                        Credits to {role === 'teacher' ? 'earn' : 'spend'}:
                      </span>
                      <span className={`font-display font-bold ${
                        role === 'teacher' ? 'text-green-500' : 'text-primary'
                      }`}>
                        {role === 'teacher' ? '+' : '-'}{creditsToTransfer}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-confirm Timer */}
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Auto-confirm in:</span>
                    </div>
                    <span className="font-mono font-bold text-primary">
                      {formatTime(secondsRemaining)}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    If no action is taken, the session will be automatically confirmed
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onDispute}
                    className="gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Report Issue
                  </Button>
                  <Button
                    variant="chrono"
                    onClick={onConfirm}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirm
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Session ID: {sessionId}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
