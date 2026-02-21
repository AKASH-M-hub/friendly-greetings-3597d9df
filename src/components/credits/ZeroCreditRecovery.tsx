import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  FileText, 
  Handshake, 
  Building2,
  Award,
  Brain,
  Target
} from 'lucide-react';
import { MCQQuiz } from '@/components/credits/MCQQuiz';
import { RECOVERY_LAYERS } from '@/types/recovery';
import { useCreditLedger } from '@/hooks/useCreditLedger';
import { useMCQQuiz } from '@/hooks/useMCQQuiz';

export function ZeroCreditRecovery() {
  const { balance } = useCreditLedger();
  const { progression, getCreditsEarnedToday } = useMCQQuiz();
  const [activeTab, setActiveTab] = useState('mcq');

  const isZeroCredit = balance.current_balance <= 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header Alert */}
      {isZeroCredit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your credit balance is zero. Use the recovery options below to earn credits and continue
              learning!
            </span>
            <Badge variant="secondary" className="ml-4">
              Balance: {balance.current_balance} credits
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance.current_balance}</div>
            <p className="text-xs text-muted-foreground mt-1">credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earned Today (MCQ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{getCreditsEarnedToday()}</div>
            <p className="text-xs text-muted-foreground mt-1">max 10 credits/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Knowledge Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{progression.length}</div>
            <p className="text-xs text-muted-foreground mt-1">topics practiced</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Recovery Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mcq" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            MCQ Quiz
          </TabsTrigger>
          <TabsTrigger value="peer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Peer Teaching
          </TabsTrigger>
          <TabsTrigger value="contribution" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contributions
          </TabsTrigger>
          <TabsTrigger value="assisted" className="flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Co-Teaching
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Support Fund
          </TabsTrigger>
        </TabsList>

        {/* MCQ Quiz Tab */}
        <TabsContent value="mcq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Answer Quiz Questions to Earn Credits
              </CardTitle>
              <CardDescription>
                Each correct answer earns you 2 credits. Maximum 5 questions per day (10 credits daily max).
              </CardDescription>
            </CardHeader>
          </Card>
          <MCQQuiz />
          
          {/* Knowledge Progression */}
          {progression.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Knowledge Progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progression.map((prog) => (
                    <div key={prog.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{prog.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {prog.questions_correct} / {prog.questions_answered} correct
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{prog.mastery_score}%</p>
                          <p className="text-xs text-muted-foreground">Mastery</p>
                        </div>
                        {prog.teaching_readiness && (
                          <Badge variant="default" className="bg-green-600">
                            <Award className="h-3 w-3 mr-1" />
                            Ready to Teach
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Layer 1: Peer Teaching */}
        <TabsContent value="peer" className="space-y-4">
          <RecoveryLayerCard
            layer="peer_teaching"
            title={RECOVERY_LAYERS.peer_teaching.title}
            description={RECOVERY_LAYERS.peer_teaching.description}
            icon={<Users className="h-6 w-6" />}
            creditsPerAction={RECOVERY_LAYERS.peer_teaching.credits_per_action}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Teach quick 5-10 minute micro-sessions to other learners on topics you've mastered.
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Duration: 5-10 minutes</li>
                <li>Credits earned: 1 credit per session</li>
                <li>Requirements: 70% mastery score on topic</li>
              </ul>
              <Button className="w-full" disabled>
                Start Peer Teaching Session
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </Button>
            </div>
          </RecoveryLayerCard>
        </TabsContent>

        {/* Layer 2: Knowledge Contribution */}
        <TabsContent value="contribution" className="space-y-4">
          <RecoveryLayerCard
            layer="micro_contribution"
            title={RECOVERY_LAYERS.micro_contribution.title}
            description={RECOVERY_LAYERS.micro_contribution.description}
            icon={<FileText className="h-6 w-6" />}
            creditsPerAction={RECOVERY_LAYERS.micro_contribution.credits_per_action}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Contribute valuable content like diagrams, notes, Q&A, or study resources for the community.
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Notes/Documents: 1-2 credits</li>
                <li>Diagrams/Visuals: 2-3 credits</li>
                <li>Q&A Solutions: 1-2 credits</li>
              </ul>
              <Button className="w-full" disabled>
                Submit Contribution
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </Button>
            </div>
          </RecoveryLayerCard>
        </TabsContent>

        {/* Layer 3: Assisted Co-Teaching */}
        <TabsContent value="assisted" className="space-y-4">
          <RecoveryLayerCard
            layer="assisted_teaching"
            title={RECOVERY_LAYERS.assisted_teaching.title}
            description={RECOVERY_LAYERS.assisted_teaching.description}
            icon={<Handshake className="h-6 w-6" />}
            creditsPerAction={RECOVERY_LAYERS.assisted_teaching.credits_per_action}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Co-teach sessions alongside experienced mentors to rebuild your teaching reputation and earn credits.
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Duration: 15-30 minutes</li>
                <li>Credits earned: 3-5 credits per session</li>
                <li>Mentor approval required</li>
              </ul>
              <Button className="w-full" disabled>
                Find Mentor Partner
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </Button>
            </div>
          </RecoveryLayerCard>
        </TabsContent>

        {/* Layer 4: Institutional Support */}
        <TabsContent value="support" className="space-y-4">
          <RecoveryLayerCard
            layer="institutional_support"
            title={RECOVERY_LAYERS.institutional_support.title}
            description={RECOVERY_LAYERS.institutional_support.description}
            icon={<Building2 className="h-6 w-6" />}
            creditsPerAction={RECOVERY_LAYERS.institutional_support.credits_per_action}
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Apply for foundation grants, scholarships, or emergency credit support for learners facing hardship.
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Emergency support: 5 credits</li>
                <li>Scholarship grants: 10-20 credits</li>
                <li>One-time educational support</li>
              </ul>
              <Button className="w-full" disabled>
                Apply for Support
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </Button>
            </div>
          </RecoveryLayerCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RecoveryLayerCardProps {
  layer: keyof typeof RECOVERY_LAYERS;
  title: string;
  description: string;
  icon: React.ReactNode;
  creditsPerAction: number;
  children: React.ReactNode;
}

function RecoveryLayerCard({ 
  title, 
  description, 
  icon, 
  creditsPerAction, 
  children 
}: RecoveryLayerCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
          <div className="flex-1">
            <CardTitle className="flex items-center justify-between">
              {title}
              <Badge variant="secondary" className="ml-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                {creditsPerAction} credits
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
