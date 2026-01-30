import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Unlock,
  Coins
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditWallet, WalletStats, CreditTransaction } from '@/components/credits/CreditWallet';
import { DualSessionLog, SessionLogEntry } from '@/components/credits/DualSessionLog';

// Mock data - would come from database
const mockWalletStats: WalletStats = {
  totalBalance: 24,
  totalEarned: 45,
  totalSpent: 21,
  heldCredits: 0,
  earnedThisWeek: 7,
  spentThisWeek: 3,
};

const mockTransactions: CreditTransaction[] = [
  { 
    id: '1', 
    type: 'earned', 
    amount: 2, 
    description: 'React Fundamentals Session', 
    partnerName: 'John Smith',
    date: 'Today', 
    time: '2:30 PM',
    sessionDuration: '1h',
    status: 'completed'
  },
  { 
    id: '2', 
    type: 'spent', 
    amount: 1, 
    description: 'Spanish Conversation', 
    partnerName: 'Carlos Rivera',
    date: 'Today', 
    time: '11:00 AM',
    sessionDuration: '1h',
    status: 'completed'
  },
  { 
    id: '3', 
    type: 'earned', 
    amount: 3, 
    description: 'Advanced TypeScript', 
    partnerName: 'Sarah Lee',
    date: 'Yesterday', 
    time: '4:00 PM',
    sessionDuration: '1.5h',
    status: 'completed'
  },
  { 
    id: '4', 
    type: 'spent', 
    amount: 1, 
    description: 'UI Design Basics', 
    partnerName: 'Emma Wilson',
    date: 'Yesterday', 
    time: '10:00 AM',
    sessionDuration: '1h',
    status: 'completed'
  },
  { 
    id: '5', 
    type: 'earned', 
    amount: 2, 
    description: 'JavaScript Essentials', 
    partnerName: 'Mike Brown',
    date: '2 days ago', 
    time: '3:00 PM',
    sessionDuration: '1h',
    status: 'completed'
  },
];

const mockSessionLog: SessionLogEntry[] = [
  {
    id: '1',
    sessionId: 'sess-abc123',
    role: 'teacher',
    partnerName: 'John Smith',
    topic: 'React Fundamentals',
    date: 'Today',
    time: '2:30 PM',
    duration: '1h',
    durationMinutes: 60,
    creditsEarned: 2,
    status: 'completed',
    confirmedByTeacher: true,
    confirmedByLearner: true,
  },
  {
    id: '2',
    sessionId: 'sess-def456',
    role: 'learner',
    partnerName: 'Carlos Rivera',
    topic: 'Spanish Conversation',
    date: 'Today',
    time: '11:00 AM',
    duration: '1h',
    durationMinutes: 60,
    creditsSpent: 1,
    status: 'completed',
    confirmedByTeacher: true,
    confirmedByLearner: true,
  },
  {
    id: '3',
    sessionId: 'sess-ghi789',
    role: 'teacher',
    partnerName: 'Sarah Lee',
    topic: 'Advanced TypeScript',
    date: 'Yesterday',
    time: '4:00 PM',
    duration: '1.5h',
    durationMinutes: 90,
    creditsEarned: 3,
    status: 'completed',
    confirmedByTeacher: true,
    confirmedByLearner: true,
  },
  {
    id: '4',
    sessionId: 'sess-jkl012',
    role: 'learner',
    partnerName: 'Emma Wilson',
    topic: 'UI Design Basics',
    date: 'Yesterday',
    time: '10:00 AM',
    duration: '1h',
    durationMinutes: 60,
    creditsSpent: 1,
    status: 'pending-confirmation',
    confirmedByTeacher: true,
    confirmedByLearner: false,
  },
];

const unlockableFeatures = [
  { id: 1, name: 'Resume Builder', cost: 15, description: 'Create a professional resume with AI assistance' },
  { id: 2, name: 'Portfolio Generator', cost: 25, description: 'Build a stunning portfolio to showcase your skills' },
  { id: 3, name: 'Certificate of Completion', cost: 10, description: 'Get verified certificates for your learning' },
];

export default function Credits() {
  const [activeTab, setActiveTab] = useState('wallet');

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="wallet">Credit Wallet</TabsTrigger>
            <TabsTrigger value="sessions">Session History</TabsTrigger>
          </TabsList>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <TabsContent value="wallet" className="mt-0">
                <CreditWallet stats={mockWalletStats} transactions={mockTransactions} />
              </TabsContent>

              <TabsContent value="sessions" className="mt-0">
                <DualSessionLog sessions={mockSessionLog} />
              </TabsContent>
            </div>

            {/* Sidebar - Unlockable Features */}
            <div>
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
                        disabled={mockWalletStats.totalBalance < feature.cost}
                      >
                        {mockWalletStats.totalBalance >= feature.cost ? 'Unlock Now' : 'Not Enough Credits'}
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
