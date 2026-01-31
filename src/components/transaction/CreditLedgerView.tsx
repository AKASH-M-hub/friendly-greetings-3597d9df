import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCcw,
  Lock,
  Clock,
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransactionIntegrity } from '@/hooks/useTransactionIntegrity';
import type { CreditLedgerEntry, LedgerEntryType } from '@/types/transaction';

interface CreditLedgerViewProps {
  limit?: number;
  showFilters?: boolean;
}

export function CreditLedgerView({ limit = 50, showFilters = true }: CreditLedgerViewProps) {
  const [entries, setEntries] = useState<CreditLedgerEntry[]>([]);
  const [filter, setFilter] = useState<LedgerEntryType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { getLedgerHistory, loading } = useTransactionIntegrity();

  const fetchEntries = async () => {
    setRefreshing(true);
    const data = await getLedgerHistory(limit);
    setEntries(data);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [limit]);

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.entry_type === filter);

  const getEntryIcon = (type: LedgerEntryType) => {
    switch (type) {
      case 'credit_earned':
        return <ArrowUpRight className="h-4 w-4 text-accent-foreground" />;
      case 'credit_spent':
        return <ArrowDownRight className="h-4 w-4 text-primary" />;
      case 'credit_adjustment':
        return <RefreshCcw className="h-4 w-4 text-secondary-foreground" />;
      case 'credit_rollback':
        return <RefreshCcw className="h-4 w-4 text-secondary-foreground" />;
      case 'credit_dispute_hold':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'credit_dispute_release':
        return <Lock className="h-4 w-4 text-accent-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEntryLabel = (type: LedgerEntryType): string => {
    switch (type) {
      case 'credit_earned': return 'Earned';
      case 'credit_spent': return 'Spent';
      case 'credit_adjustment': return 'Adjustment';
      case 'credit_rollback': return 'Rollback';
      case 'credit_dispute_hold': return 'Held';
      case 'credit_dispute_release': return 'Released';
      default: return 'Unknown';
    }
  };

  const getAmountDisplay = (entry: CreditLedgerEntry) => {
    const isPositive = entry.amount > 0;
    return (
      <span className={`font-display font-bold ${
        isPositive ? 'text-accent-foreground' : 'text-primary'
      }`}>
        {isPositive ? '+' : ''}{entry.amount}
      </span>
    );
  };

  if (loading && entries.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
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
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-primary" />
            Credit Ledger
            <Badge variant="outline" className="ml-2">
              <Lock className="mr-1 h-3 w-3" />
              Immutable
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {showFilters && (
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as LedgerEntryType | 'all')}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <Filter className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="credit_earned">Earned</SelectItem>
                  <SelectItem value="credit_spent">Spent</SelectItem>
                  <SelectItem value="credit_adjustment">Adjustments</SelectItem>
                  <SelectItem value="credit_rollback">Rollbacks</SelectItem>
                  <SelectItem value="credit_dispute_hold">Disputes</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchEntries}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No ledger entries yet</p>
              <p className="text-xs text-muted-foreground/70">
                Complete sessions to see credit history
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
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
                          <span className="text-sm font-medium">
                            {getEntryLabel(entry.entry_type)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {entry.entry_type.replace('credit_', '').replace('_', ' ')}
                          </Badge>
                        </div>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground">
                            {entry.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {getAmountDisplay(entry)}
                      <p className="text-xs text-muted-foreground">
                        Balance: {entry.balance_after}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Immutability Notice */}
          <div className="mt-4 rounded-lg bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <Lock className="inline h-3 w-3 mr-1" />
              All entries are cryptographically secured and cannot be modified or deleted
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
