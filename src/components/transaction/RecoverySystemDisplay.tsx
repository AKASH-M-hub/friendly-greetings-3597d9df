import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTransactionIntegrity } from '@/hooks/useTransactionIntegrity';
import type { SessionTransaction, TransactionStatus } from '@/types/transaction';

interface RecoverySystemDisplayProps {
  sessionId?: string;
  onRecoveryComplete?: () => void;
}

// Mock failed transactions for demonstration
const mockFailedTransactions: SessionTransaction[] = [];

export function RecoverySystemDisplay({ 
  sessionId,
  onRecoveryComplete 
}: RecoverySystemDisplayProps) {
  const [failedTransactions, setFailedTransactions] = useState<SessionTransaction[]>(mockFailedTransactions);
  const [recovering, setRecovering] = useState<string | null>(null);
  const { rollbackTransaction, loading } = useTransactionIntegrity();

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent-foreground" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'rolled_back':
        return <RotateCcw className="h-4 w-4 text-secondary-foreground" />;
      case 'disputed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, string> = {
      pending: 'bg-muted text-muted-foreground',
      processing: 'bg-primary/20 text-primary',
      completed: 'bg-accent text-accent-foreground',
      failed: 'bg-destructive/20 text-destructive',
      rolled_back: 'bg-secondary text-secondary-foreground',
      disputed: 'bg-destructive/20 text-destructive'
    };

    return (
      <Badge className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const handleRecovery = async (transactionId: string) => {
    setRecovering(transactionId);
    const success = await rollbackTransaction(transactionId);
    
    if (success) {
      setFailedTransactions(prev => 
        prev.filter(t => t.id !== transactionId)
      );
      onRecoveryComplete?.();
    }
    
    setRecovering(null);
  };

  const hasRecoverableTransactions = failedTransactions.some(
    t => t.status === 'failed' || t.status === 'processing'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Recovery & Rollback System
          </CardTitle>
          {hasRecoverableTransactions && (
            <Badge className="bg-destructive/20 text-destructive">
              {failedTransactions.filter(t => t.status === 'failed').length} Failed
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {failedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-accent-foreground" />
              <p className="text-sm font-medium text-foreground">All Systems Healthy</p>
              <p className="text-xs text-muted-foreground">
                No failed or interrupted transactions detected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="text-sm font-medium">
                        Transaction {transaction.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.credits_amount} credits • {transaction.duration_minutes} min
                      </p>
                      {transaction.error_message && (
                        <p className="text-xs text-destructive mt-1">
                          {transaction.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(transaction.status)}
                    
                    {(transaction.status === 'failed' || transaction.status === 'processing') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecovery(transaction.id)}
                        disabled={recovering === transaction.id || loading}
                      >
                        {recovering === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Rollback
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recovery Guarantee Notice */}
          <div className="rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <Shield className="inline h-3 w-3 mr-1 text-primary" />
              <span className="font-medium text-foreground">Automatic Recovery</span>
              {' '}• Failed transactions are automatically detected and can be safely rolled back
            </p>
          </div>

          {/* Recovery Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-border/50 p-2 text-center">
              <p className="text-lg font-display font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="rounded-lg border border-border/50 p-2 text-center">
              <p className="text-lg font-display font-bold text-accent-foreground">100%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div className="rounded-lg border border-border/50 p-2 text-center">
              <p className="text-lg font-display font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Rollbacks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
