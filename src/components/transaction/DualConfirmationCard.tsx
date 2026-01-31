import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactionIntegrity } from '@/hooks/useTransactionIntegrity';
import { useAuth } from '@/contexts/AuthContext';
import type { DualConfirmationStatus, SessionTransaction } from '@/types/transaction';

interface DualConfirmationCardProps {
  transactionId: string;
  sessionTitle?: string;
  teacherName?: string;
  learnerName?: string;
  creditsAmount: number;
  onConfirmed?: () => void;
  onDisputed?: () => void;
}

export function DualConfirmationCard({
  transactionId,
  sessionTitle = 'Session',
  teacherName = 'Teacher',
  learnerName = 'Learner',
  creditsAmount,
  onConfirmed,
  onDisputed
}: DualConfirmationCardProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<DualConfirmationStatus | null>(null);
  const [transaction, setTransaction] = useState<SessionTransaction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const {
    getConfirmationStatus,
    getTransactionStatus,
    confirmTransaction,
    processTransaction,
    loading,
    error
  } = useTransactionIntegrity();

  const fetchStatus = async () => {
    const [confStatus, txStatus] = await Promise.all([
      getConfirmationStatus(transactionId),
      getTransactionStatus(transactionId)
    ]);
    setStatus(confStatus);
    setTransaction(txStatus);
  };

  useEffect(() => {
    fetchStatus();
    // Poll for updates
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [transactionId]);

  const isTeacher = user?.id === transaction?.teacher_id;
  const isLearner = user?.id === transaction?.learner_id;
  const userRole = isTeacher ? 'teacher' : isLearner ? 'learner' : null;
  const hasConfirmed = isTeacher ? status?.teacherConfirmed : status?.learnerConfirmed;

  const handleConfirm = async () => {
    if (!userRole) return;
    
    setConfirming(true);
    const success = await confirmTransaction(transactionId, userRole);
    if (success) {
      await fetchStatus();
      if (status?.bothConfirmed) {
        onConfirmed?.();
      }
    }
    setConfirming(false);
  };

  const handleProcess = async () => {
    setProcessing(true);
    const success = await processTransaction(transactionId);
    if (success) {
      await fetchStatus();
      onConfirmed?.();
    }
    setProcessing(false);
  };

  const getStepIcon = (confirmed: boolean, isWaiting: boolean) => {
    if (confirmed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isWaiting) {
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  if (loading && !status) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Dual Confirmation Required
            </div>
            <Badge variant="outline" className="font-display">
              {creditsAmount} credits
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{sessionTitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confirmation Progress */}
          <div className="flex items-center justify-between">
            {/* Teacher Step */}
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full border-2 p-3 ${
                status?.teacherConfirmed 
                  ? 'border-green-500 bg-green-500/10' 
                  : status?.waitingFor === 'teacher'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-border bg-muted/50'
              }`}>
                {getStepIcon(
                  status?.teacherConfirmed ?? false,
                  status?.waitingFor === 'teacher'
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{teacherName}</p>
                <p className="text-xs text-muted-foreground">Teacher</p>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            {/* Learner Step */}
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full border-2 p-3 ${
                status?.learnerConfirmed 
                  ? 'border-green-500 bg-green-500/10' 
                  : status?.waitingFor === 'learner'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-border bg-muted/50'
              }`}>
                {getStepIcon(
                  status?.learnerConfirmed ?? false,
                  status?.waitingFor === 'learner'
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{learnerName}</p>
                <p className="text-xs text-muted-foreground">Learner</p>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            {/* Complete Step */}
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full border-2 p-3 ${
                status?.bothConfirmed 
                  ? 'border-green-500 bg-green-500/10' 
                  : 'border-border bg-muted/50'
              }`}>
                {status?.bothConfirmed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Complete</p>
                <p className="text-xs text-muted-foreground">Process</p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status?.bothConfirmed ? 'complete' : 'pending'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg bg-muted/50 p-3 text-center"
            >
              {status?.bothConfirmed ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Both parties confirmed. Ready to process credits.
                </p>
              ) : status?.waitingFor ? (
                <p className="text-sm text-muted-foreground">
                  Waiting for <span className="font-medium text-foreground">
                    {status.waitingFor === 'teacher' ? teacherName : learnerName}
                  </span> to confirm...
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Confirmation required from both parties
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {userRole && !hasConfirmed && (
              <Button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1"
              >
                {confirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Session
                  </>
                )}
              </Button>
            )}

            {userRole && hasConfirmed && !status?.bothConfirmed && (
              <Button variant="outline" disabled className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Confirmed - Waiting for other party
              </Button>
            )}

            {status?.canProcess && isTeacher && (
              <Button
                onClick={handleProcess}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Process Credits
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Transaction is locked until both parties confirm. Credits cannot be duplicated or lost.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
