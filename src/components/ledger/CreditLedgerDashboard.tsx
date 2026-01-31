import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  Filter,
  BookOpen,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreditLedger, LedgerEntry, SessionTransaction } from '@/hooks/useCreditLedger';
import { cn } from '@/lib/utils';

export function CreditLedgerDashboard() {
  const {
    ledgerEntries,
    balance,
    pendingTransactions,
    loading,
    error,
    refetch,
    confirmTransaction,
    disputeTransaction,
  } = useCreditLedger();

  const [filter, setFilter] = useState<'all' | 'earned' | 'spent' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConfirm = async (txId: string, role: 'teacher' | 'learner') => {
    await confirmTransaction(txId, role);
  };

  const handleDispute = async (txId: string) => {
    await disputeTransaction(txId, 'Session dispute raised');
  };

  const filteredEntries = ledgerEntries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'earned') return entry.entry_type === 'credit_earned';
    if (filter === 'spent') return entry.entry_type === 'credit_spent';
    if (filter === 'pending') return entry.entry_type === 'credit_dispute_hold';
    return true;
  });

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'credit_earned':
        return <ArrowUpRight className="h-4 w-4 text-accent-foreground" />;
      case 'credit_spent':
        return <ArrowDownRight className="h-4 w-4 text-primary" />;
      case 'credit_adjustment':
        return <RefreshCcw className="h-4 w-4 text-muted-foreground" />;
      case 'credit_rollback':
        return <RefreshCcw className="h-4 w-4 text-secondary-foreground" />;
      case 'credit_dispute_hold':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'credit_dispute_release':
        return <CheckCircle2 className="h-4 w-4 text-accent-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-display text-2xl font-bold">{balance.current_balance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/20 p-2">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="font-display text-2xl font-bold text-accent-foreground">+{balance.total_earned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="font-display text-2xl font-bold text-primary">-{balance.total_spent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-secondary p-2">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Held Credits</p>
                  <p className="font-display text-2xl font-bold text-secondary-foreground">{balance.held_credits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ledger" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Credit Ledger
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Confirmations
            {pendingTransactions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {pendingTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Transaction History
                <Badge variant="outline" className="ml-2">
                  <Lock className="mr-1 h-3 w-3" />
                  Immutable
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <SelectTrigger className="w-[130px] h-8">
                    <Filter className="mr-2 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="earned">Earned</SelectItem>
                    <SelectItem value="spent">Spent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8"
                >
                  <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No ledger entries yet</p>
                  <p className="text-sm text-muted-foreground/70">
                    Complete sessions to see credit history
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            {getEntryIcon(entry.entry_type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">
                                {entry.entry_type.replace('credit_', '').replace('_', ' ')}
                              </span>
                              {entry.role && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {entry.role}
                                </Badge>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground">{entry.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "font-display font-bold",
                            entry.amount > 0 ? "text-accent-foreground" : "text-primary"
                          )}>
                            {entry.amount > 0 ? '+' : ''}{entry.amount}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Balance: {entry.balance_after}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Confirmations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="mb-3 h-12 w-12 text-accent-foreground/50" />
                  <p className="text-muted-foreground">No pending confirmations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransactions.map((tx) => (
                    <PendingTransactionCard
                      key={tx.id}
                      transaction={tx}
                      onConfirm={handleConfirm}
                      onDispute={handleDispute}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Credit Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Credit Flow</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Teaching earnings</span>
                      <span className="font-medium text-accent-foreground">+{balance.total_earned}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${Math.min(100, (balance.total_earned / (balance.total_earned + balance.total_spent || 1)) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Learning spending</span>
                      <span className="font-medium text-primary">-{balance.total_spent}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (balance.total_spent / (balance.total_earned + balance.total_spent || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Balance Health</h4>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="font-display text-4xl font-bold mb-2">
                      {balance.total_earned > 0
                        ? ((balance.current_balance / balance.total_earned) * 100).toFixed(0)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">of earned credits retained</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Immutability Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Lock className="inline h-4 w-4 mr-1" />
            All ledger entries are immutable and cannot be modified. Disputes create new correction entries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PendingTransactionCard({
  transaction,
  onConfirm,
  onDispute,
}: {
  transaction: SessionTransaction;
  onConfirm: (id: string, role: 'teacher' | 'learner') => Promise<void>;
  onDispute: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const handleConfirm = async (role: 'teacher' | 'learner') => {
    setConfirming(true);
    await onConfirm(transaction.id, role);
    setConfirming(false);
  };

  const handleDispute = async () => {
    setDisputing(true);
    await onDispute(transaction.id);
    setDisputing(false);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-secondary-foreground" />
            <span className="font-medium">Session Transaction</span>
            <Badge variant="outline" className="text-xs">
              {transaction.duration_minutes} min
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Credits: {transaction.credits_amount} • Created: {new Date(transaction.created_at).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className={cn(
              "flex items-center gap-1",
              transaction.teacher_confirmed ? "text-accent-foreground" : "text-muted-foreground"
            )}>
              {transaction.teacher_confirmed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              Teacher
            </span>
            <span className={cn(
              "flex items-center gap-1",
              transaction.learner_confirmed ? "text-accent-foreground" : "text-muted-foreground"
            )}>
              {transaction.learner_confirmed ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              Learner
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConfirm('teacher')}
            disabled={confirming || transaction.teacher_confirmed}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDispute}
            disabled={disputing}
            className="text-destructive hover:text-destructive"
          >
            {disputing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dispute'}
          </Button>
        </div>
      </div>
    </div>
  );
}
