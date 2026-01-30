import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMode } from '@/contexts/ModeContext';
import { LiveTeachingFeed, LiveSession } from '@/components/learning/LiveTeachingFeed';
import { CategoryDiscovery, FilterState } from '@/components/learning/CategoryDiscovery';
import { LearningSessionTracker, LearningProgress } from '@/components/learning/LearningSessionTracker';
import { LearnerFeedbackForm, FeedbackData } from '@/components/learning/LearnerFeedbackForm';
import { toast } from 'sonner';

// Mock data - would come from database
const mockSessions: LiveSession[] = [
  {
    id: '1',
    title: 'Advanced React Patterns',
    teacher: { id: 't1', name: 'Michael Chen', rating: 4.9, totalSessions: 45 },
    category: 'Technology',
    skillArea: 'Frontend Development',
    learners: 8,
    maxLearners: 12,
    duration: '1.5h',
    isLive: true,
  },
  {
    id: '2',
    title: 'Figma for Beginners',
    teacher: { id: 't2', name: 'Sarah Williams', rating: 4.7, totalSessions: 32 },
    category: 'Design',
    skillArea: 'UI/UX',
    learners: 5,
    maxLearners: 10,
    duration: '1h',
    isLive: true,
  },
  {
    id: '3',
    title: 'Spanish Conversation',
    teacher: { id: 't3', name: 'Carlos Rivera', rating: 5.0, totalSessions: 78 },
    category: 'Languages',
    skillArea: 'Speaking',
    learners: 3,
    maxLearners: 6,
    duration: '45m',
    isLive: true,
  },
  {
    id: '4',
    title: 'Piano Basics',
    teacher: { id: 't4', name: 'Emma Thompson', rating: 4.8, totalSessions: 23 },
    category: 'Music',
    skillArea: 'Instruments',
    learners: 4,
    maxLearners: 8,
    duration: '1h',
    isLive: false,
    startsIn: '30 min',
  },
  {
    id: '5',
    title: 'JavaScript Essentials',
    teacher: { id: 't5', name: 'David Kim', rating: 4.6, totalSessions: 56 },
    category: 'Technology',
    skillArea: 'Programming',
    learners: 10,
    maxLearners: 15,
    duration: '2h',
    isLive: true,
  },
  {
    id: '6',
    title: 'Yoga for Beginners',
    teacher: { id: 't6', name: 'Maya Patel', rating: 4.9, totalSessions: 89 },
    category: 'Fitness',
    skillArea: 'Wellness',
    learners: 6,
    maxLearners: 20,
    duration: '1h',
    isLive: false,
    startsIn: '1 hour',
  },
];

const domains = ['Technology', 'Design', 'Business', 'Languages', 'Music', 'Fitness'];
const skillAreas = ['Frontend Development', 'UI/UX', 'Programming', 'Speaking', 'Instruments', 'Wellness', 'Marketing'];

const mockProgress: LearningProgress[] = [
  { skill: 'React Development', hoursSpent: 12, sessionsAttended: 8, level: 'Intermediate', lastSession: 'Yesterday' },
  { skill: 'UI Design', hoursSpent: 8, sessionsAttended: 5, level: 'Beginner', lastSession: '3 days ago' },
  { skill: 'Spanish', hoursSpent: 5, sessionsAttended: 4, level: 'Beginner', lastSession: 'Today' },
];

export default function LearningDashboard() {
  const { unlockMode } = useMode();
  const [filters, setFilters] = useState<FilterState>({
    domains: [],
    skillAreas: [],
    availability: 'all',
    searchQuery: ''
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState<{ id: string; title: string; teacher: string } | null>(null);

  // Filter sessions based on current filters
  const filteredSessions = mockSessions.filter(session => {
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        session.title.toLowerCase().includes(query) ||
        session.teacher.name.toLowerCase().includes(query) ||
        session.category.toLowerCase().includes(query) ||
        session.skillArea.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Domain filter
    if (filters.domains.length > 0 && !filters.domains.includes(session.category)) {
      return false;
    }

    // Skill area filter
    if (filters.skillAreas.length > 0 && !filters.skillAreas.includes(session.skillArea)) {
      return false;
    }

    // Availability filter
    if (filters.availability === 'live' && !session.isLive) return false;
    if (filters.availability === 'upcoming' && session.isLive) return false;

    return true;
  });

  const handleRequestSession = (sessionId: string) => {
    const session = mockSessions.find(s => s.id === sessionId);
    if (session) {
      toast.success(`Request sent to ${session.teacher.name}!`, {
        description: `You requested to join "${session.title}"`
      });
    }
  };

  const handleFeedbackSubmit = (feedback: FeedbackData) => {
    console.log('Feedback submitted:', feedback);
    toast.success('Feedback submitted!', {
      description: 'Thank you for your feedback'
    });
  };

  // Demo: show feedback for completed session
  const handleShowFeedbackDemo = () => {
    setFeedbackSession({
      id: '1',
      title: 'Advanced React Patterns',
      teacher: 'Michael Chen'
    });
    setShowFeedback(true);
  };

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Learning Dashboard
            </h1>
            <p className="text-muted-foreground">
              Discover teachers and expand your skills
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShowFeedbackDemo}>
              Demo Feedback
            </Button>
            <Button variant="chrono-outline" onClick={() => unlockMode()}>
              Switch Mode
            </Button>
          </div>
        </div>

        {/* Category Discovery Filters */}
        <div className="mb-6">
          <CategoryDiscovery
            filters={filters}
            onFilterChange={setFilters}
            domains={domains}
            skillAreas={skillAreas}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content - Live Teaching Feed */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Available Sessions
              </h2>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {mockSessions.filter(s => s.isLive).length} Live Now
              </Badge>
            </div>
            
            <LiveTeachingFeed 
              sessions={filteredSessions}
              onRequestSession={handleRequestSession}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credits Reminder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-display font-semibold text-foreground">Your Credits</span>
                  </div>
                  <p className="mb-1 font-display text-3xl font-bold text-foreground">24</p>
                  <p className="text-sm text-muted-foreground">
                    Learning costs 1 credit/hour
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Learning Progress Tracker */}
            <LearningSessionTracker
              totalHoursLearned={25}
              sessionsAttended={17}
              currentStreak={5}
              progress={mockProgress}
            />

            {/* Quick Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Join sessions early for the best experience
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Leave feedback to help teachers improve
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Earn more credits by teaching what you know
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Modal */}
        {feedbackSession && (
          <LearnerFeedbackForm
            isOpen={showFeedback}
            onClose={() => setShowFeedback(false)}
            sessionId={feedbackSession.id}
            teacherName={feedbackSession.teacher}
            sessionTitle={feedbackSession.title}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </div>
    </MainLayout>
  );
}
