import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Unlock,
  Coins,
  Loader2,
  Shield,
  Scale
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditWallet } from '@/components/credits/CreditWallet';
import { DualSessionLog } from '@/components/credits/DualSessionLog';
import { TrustScoreDisplay } from '@/components/trust/TrustScoreDisplay';
import { FairnessGuardian } from '@/components/fairness/FairnessGuardian';
import { useCreditData } from '@/hooks/useSessionData';
import { useAuth } from '@/contexts/AuthContext';

const unlockableFeatures = [
  { id: 1, name: 'Resume Builder', cost: 15, description: 'Create a professional resume with AI assistance' },
  { id: 2, name: 'Portfolio Generator', cost: 25, description: 'Build a stunning portfolio to showcase your skills' },
  { id: 3, name: 'Certificate of Completion', cost: 10, description: 'Get verified certificates for your learning' },
];

export default function Credits() {
  const [activeTab, setActiveTab] = useState('wallet');
  const { walletStats, transactions, sessionLog, loading, error } = useCreditData();
  const { user } = useAuth();

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Coins className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Please log in to view your credits</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-destructive mb-2">Error loading credit data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Credit Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your time-to-value conversions with trust & fairness insights
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="wallet">Credit Wallet</TabsTrigger>
            <TabsTrigger value="sessions">Session History</TabsTrigger>
            <TabsTrigger value="insights" className="gap-1">
              <Shield className="h-3 w-3" />
              Trust & Fairness
            </TabsTrigger>
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <TabsContent value="wallet" className="mt-0">
                <CreditWallet stats={walletStats} transactions={transactions} />
              </TabsContent>

              <TabsContent value="sessions" className="mt-0">
                <DualSessionLog sessions={sessionLog} />
              </TabsContent>

              <TabsContent value="insights" className="mt-0 space-y-6">
                {/* Trust Score Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TrustScoreDisplay />
                </motion.div>

                {/* Fairness Guardian Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <FairnessGuardian />
                </motion.div>

                {/* Insights Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <Scale className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            How Trust & Fairness Work
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Your <strong>Trust Score</strong> indicates how confident our system is in recommendations based on your activity history. 
                            The <strong>Fairness Guardian</strong> ensures balanced exchanges by tracking your give/receive ratio.
                            A healthy balance means you're contributing to and benefiting from the community fairly.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </div>

            {/* Sidebar - Unlockable Features */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-muted-foreground" />
                    Unlock Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {unlockableFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
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
                        disabled={walletStats.totalBalance < feature.cost}
                      >
                        {walletStats.totalBalance >= feature.cost ? 'Unlock Now' : 'Not Enough Credits'}
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              {activeTab !== 'insights' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Quick Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm"
                        onClick={() => setActiveTab('insights')}
                      >
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        View Trust & Fairness
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
