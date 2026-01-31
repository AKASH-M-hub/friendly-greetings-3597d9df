import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  Database,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTransactionIntegrity } from '@/hooks/useTransactionIntegrity';
import type { TransactionIntegrityStatus } from '@/types/transaction';

interface TransactionIntegrityDisplayProps {
  showDetailed?: boolean;
}

export function TransactionIntegrityDisplay({ showDetailed = true }: TransactionIntegrityDisplayProps) {
  const [status, setStatus] = useState<TransactionIntegrityStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { getIntegrityStatus, loading } = useTransactionIntegrity();

  const fetchStatus = async () => {
    setRefreshing(true);
    const data = await getIntegrityStatus();
    setStatus(data);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIntegrityScore = (): number => {
    if (!status) return 0;
    let score = 100;
    if (!status.isConsistent) score -= 30;
    if (status.disputedTransactions > 0) score -= status.disputedTransactions * 10;
    if (status.pendingTransactions > 5) score -= 10;
    return Math.max(0, score);
  };

  const getStatusColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 90) {
      return (
        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 gap-1">
          <CheckCircle className="h-3 w-3" />
          Healthy
        </Badge>
      );
    }
    if (score >= 70) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 gap-1">
          <AlertTriangle className="h-3 w-3" />
          Attention Needed
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/20 text-destructive gap-1">
        <AlertTriangle className="h-3 w-3" />
        Issues Detected
      </Badge>
    );
  };

  const score = getIntegrityScore();

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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Transaction Integrity
          </CardTitle>
          <div className="flex items-center gap-2">
            {status && getStatusBadge(score)}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchStatus}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Integrity Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Integrity</span>
              <span className={`font-display font-bold ${getStatusColor(score)}`}>
                {score}%
              </span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
              <div className={`rounded-full p-1.5 ${
                status?.isConsistent 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {status?.isConsistent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Consistency</p>
                <p className="text-sm font-medium">
                  {status?.isConsistent ? 'Verified' : 'Check Required'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
              <div className="rounded-full bg-primary/20 p-1.5 text-primary">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ledger</p>
                <p className="text-sm font-medium">Immutable</p>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          {showDetailed && status && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Pending Transactions</span>
                </div>
                <Badge variant="outline">{status.pendingTransactions}</Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Disputed Transactions</span>
                </div>
                <Badge 
                  variant="outline"
                  className={status.disputedTransactions > 0 ? 'border-destructive text-destructive' : ''}
                >
                  {status.disputedTransactions}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="h-4 w-4" />
                  <span>Ledger Entries</span>
                </div>
                <Badge variant="outline">{status.ledgerEntryCount}</Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>Last Verified</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {status.lastVerified 
                    ? new Date(status.lastVerified).toLocaleTimeString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          )}

          {/* ACID Compliance Banner */}
          <div className="rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">ACID-Compliant</span>
              {' '} • Atomic transactions • Immutable ledger • Dual-user verification
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
