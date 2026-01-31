import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export interface CreditTransaction {
  id: string;
  type: 'earned' | 'spent' | 'held' | 'released';
  amount: number;
  description: string;
  partnerName: string;
  date: string;
  time: string;
  sessionDuration: string;
  status: 'completed' | 'pending' | 'disputed';
}

export interface WalletStats {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  heldCredits: number;
  earnedThisWeek: number;
  spentThisWeek: number;
}

interface CreditWalletProps {
  stats: WalletStats;
  transactions: CreditTransaction[];
}

export function CreditWallet({ stats, transactions }: CreditWalletProps) {
  const getTransactionIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'earned':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'spent':
        return <ArrowDownRight className="h-5 w-5 text-primary" />;
      case 'held':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'released':
        return <Coins className="h-5 w-5 text-green-500" />;
    }
  };

  const getTransactionColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'earned':
      case 'released':
        return 'text-green-500';
      case 'spent':
        return 'text-foreground';
      case 'held':
        return 'text-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Balance</span>
                </div>
                <p className="font-display text-5xl font-bold text-foreground mb-1">
                  {stats.totalBalance}
                </p>
                <p className="text-sm text-primary">Credits available</p>
              </div>
              {stats.heldCredits > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.heldCredits} held
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="font-display text-xl font-bold text-foreground">+{stats.totalEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-display text-xl font-bold text-foreground">-{stats.totalSpent}</p>
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
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week (Earned)</p>
                  <p className="font-display text-xl font-bold text-green-500">+{stats.earnedThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <ArrowDownRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week (Spent)</p>
                  <p className="font-display text-xl font-bold text-foreground">-{stats.spentThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Coins className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        transaction.type === 'earned' || transaction.type === 'released'
                          ? 'bg-green-500/20'
                          : transaction.type === 'held'
                          ? 'bg-yellow-500/20'
                          : 'bg-primary/20'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{transaction.partnerName}</span>
                          <span className="text-border">•</span>
                          <span>{transaction.sessionDuration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{transaction.date}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{transaction.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'earned' || transaction.type === 'released' ? '+' : 
                         transaction.type === 'spent' ? '-' : '⏸'}
                        {transaction.amount}
                      </p>
                      {transaction.status === 'disputed' && (
                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                          Disputed
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Credit Rules Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Credits Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Teaching</p>
                <p className="text-sm text-muted-foreground">+2 credits per minute</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Learning</p>
                <p className="text-sm text-muted-foreground">-1 credit per minute</p>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 mb-3">
            <Coins className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">New User Bonus</p>
              <p className="text-sm text-muted-foreground">
                Every new user starts with 10 free credits!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Dispute Protection</p>
              <p className="text-sm text-muted-foreground">
                Credits are held if there's a feedback conflict. Resolution within 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
