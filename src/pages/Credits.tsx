import { motion } from 'framer-motion';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Unlock
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const creditHistory = [
  { id: 1, type: 'earned', amount: 2, description: 'React Fundamentals Session', date: 'Today, 2:30 PM', duration: '1h' },
  { id: 2, type: 'spent', amount: 1, description: 'Spanish Conversation', date: 'Today, 11:00 AM', duration: '1h' },
  { id: 3, type: 'earned', amount: 3, description: 'Advanced TypeScript', date: 'Yesterday, 4:00 PM', duration: '1.5h' },
  { id: 4, type: 'spent', amount: 1, description: 'UI Design Basics', date: 'Yesterday, 10:00 AM', duration: '1h' },
  { id: 5, type: 'earned', amount: 2, description: 'JavaScript Essentials', date: '2 days ago', duration: '1h' },
];

const unlockableFeatures = [
  { id: 1, name: 'Resume Builder', cost: 15, description: 'Create a professional resume with AI assistance' },
  { id: 2, name: 'Portfolio Generator', cost: 25, description: 'Build a stunning portfolio to showcase your skills' },
  { id: 3, name: 'Certificate of Completion', cost: 10, description: 'Get verified certificates for your learning' },
];

export default function Credits() {
  const totalCredits = 24;
  const earnedThisWeek = 7;
  const spentThisWeek = 3;

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Credit Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your time-to-value conversions
          </p>
        </div>

        {/* Main Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                    <Wallet className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="font-display text-4xl font-bold text-foreground">{totalCredits}</p>
                    <p className="text-xs text-primary">Credits available</p>
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
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/20">
                    <TrendingUp className="h-7 w-7 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Earned This Week</p>
                    <p className="font-display text-4xl font-bold text-foreground">+{earnedThisWeek}</p>
                    <p className="text-xs text-green-500">From teaching</p>
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
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <TrendingDown className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spent This Week</p>
                    <p className="font-display text-4xl font-bold text-foreground">-{spentThisWeek}</p>
                    <p className="text-xs text-muted-foreground">On learning</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditHistory.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          transaction.type === 'earned' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <ArrowUpRight className="h-5 w-5" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.date} • {transaction.duration}
                          </p>
                        </div>
                      </div>
                      <div className={`font-display text-lg font-bold ${
                        transaction.type === 'earned' ? 'text-green-500' : 'text-foreground'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unlockable Features */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="h-5 w-5 text-muted-foreground" />
                  Unlock Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unlockableFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{feature.name}</h3>
                      <span className="flex items-center gap-1 font-display font-bold text-primary">
                        <Coins className="h-4 w-4" />
                        {feature.cost}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{feature.description}</p>
                    <Button 
                      variant="chrono-outline" 
                      size="sm" 
                      className="w-full"
                      disabled={totalCredits < feature.cost}
                    >
                      {totalCredits >= feature.cost ? 'Unlock Now' : 'Not Enough Credits'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* How Credits Work */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">How Credits Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Teaching</p>
                      <p className="text-muted-foreground">+2 credits/hour</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <TrendingDown className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Learning</p>
                      <p className="text-muted-foreground">-1 credit/hour</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
