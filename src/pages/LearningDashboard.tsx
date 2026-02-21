import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  GraduationCap,
  Search,
  ShieldCheck,
  AlertTriangle,

} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SeminarCard, Seminar } from '@/components/learning/SeminarCard';
import { ScheduledClasses } from '@/components/learning/ScheduledClasses';
import { MCQQuiz } from '@/components/credits/MCQQuiz';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useBehavioralMonitoring } from '@/hooks/useBehavioralMonitoring';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';


const domainTagToCategory: Record<string, string> = {
  cs: 'Technology',
  math: 'Science',
  design: 'Design',
  science: 'Science',
  language: 'Languages',
  music: 'Music',
  business: 'Business',
  other: 'Other',
};

const categories = ['All', 'Technology', 'Design', 'Business', 'Languages', 'Music', 'Science', 'Other'];

export default function LearningDashboard() {
  const { setMode, lockMode } = useMode();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSwitchMode = () => {
    setMode('teaching');
    lockMode();
    navigate('/teaching');
  };


  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [emailOtpCode, setEmailOtpCode] = useState('');

  const {
    verification,
    sendingOTP,
    verifying,
    sendOTP,
    verifyOTP,
    getVerificationProgress,
  } = useIdentityVerification();

  const {
    creditsFrozen,
    getBehavioralHealthScore,
    canEarnCredits,
  } = useBehavioralMonitoring();


  useEffect(() => {
    fetchSeminars();
  }, [user]);

  const fetchSeminars = async () => {
    try {
      // 1. Fetch available teaching sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('status', 'scheduled')
        .is('learner_id', null)
        .order('created_at', { ascending: false });

      if (sessionError) throw sessionError;

      if (!sessions || sessions.length === 0) {
        setSeminars([]);
        setLoading(false);
        return;
      }

      // 2. Fetch teacher profiles
      const teacherIds = Array.from(new Set(sessions.map((s: any) => s.teacher_id)));

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', teacherIds);

      if (profileError) throw profileError;

      const profileMap = new Map();
      profiles?.forEach((p: any) => profileMap.set(p.id, p));

      // 3. Fetch teacher expertise to get domain_tag (category)
      const { data: expertiseData } = await supabase
        .from('teacher_expertise')
        .select('user_id, domain_tag')
        .in('user_id', teacherIds)
        .eq('is_active', true);

      const expertiseMap = new Map<string, string>();
      expertiseData?.forEach((e: any) => {
        if (!expertiseMap.has(e.user_id)) {
          expertiseMap.set(e.user_id, domainTagToCategory[e.domain_tag] || 'Other');
        }
      });

      // 4. Map to Seminar type with real category
      const mappedSeminars: Seminar[] = sessions.map((session: any) => {
        const teacher = profileMap.get(session.teacher_id);
        return {
          id: session.id,
          title: session.title || 'Untitled Seminar',
          description: 'Join this session to learn live!',
          teacher_id: session.teacher_id,
          teacher_name: teacher?.display_name || 'Unknown Teacher',
          teacher_avatar: teacher?.avatar_url,
          category: expertiseMap.get(session.teacher_id) || 'Other',
          skill_level: 'All Levels',
          duration: '1h',
          max_learners: 1,
          current_learners: 0,
          start_time: new Date(session.created_at).toLocaleDateString(),
          is_active: true,
          has_requested: false,
          prerequisites: null,
          created_at: session.created_at
        };
      });

      // 4. Check requests
      if (user && mappedSeminars.length > 0) {
        const { data: requests } = await supabase
          .from('session_requests')
          .select('session_id')
          .eq('learner_id', user.id)
          .in('session_id', mappedSeminars.map(s => s.id));

        const requestedSet = new Set(requests?.map(r => r.session_id));

        setSeminars(mappedSeminars.map(s => ({
          ...s,
          has_requested: requestedSet.has(s.id)
        })));
      } else {
        setSeminars(mappedSeminars);
      }

    } catch (error) {
      console.error('Error fetching seminars:', error);
      toast.error('Failed to load seminars');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSession = async (seminarId: string) => {
    if (!user) {
      toast.error('Please sign in to request a session');
      navigate('/auth');
      return;
    }

    setRequestingId(seminarId);
    try {
      const seminar = seminars.find(s => s.id === seminarId);
      if (!seminar) return;

      const { error } = await supabase
        .from('session_requests')
        .insert({
          // We use session_id to link to the teaching_session
          session_id: seminarId,
          learner_id: user.id,
          teacher_id: seminar.teacher_id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already requested this session');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Request sent!', {
        description: `Your request to join "${seminar.title}" has been sent to the teacher.`
      });

      // Update local state
      setSeminars(prev => prev.map(s =>
        s.id === seminarId ? { ...s, has_requested: true } : s
      ));
    } catch (error: unknown) {
      console.error('Error requesting session:', error);
      toast.error('Failed to send request');
    } finally {
      setRequestingId(null);
    }
  };

  // Filter seminars
  const filteredSeminars = seminars.filter(seminar => {
    const matchesSearch = searchQuery === '' ||
      seminar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seminar.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seminar.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' ||
      seminar.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const verificationProgress = getVerificationProgress();
  const behavioralHealthScore = getBehavioralHealthScore();
  const creditEligibility = canEarnCredits();

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
              Discover seminars from teachers and request to join
            </p>
          </div>
          <Button variant="chrono-outline" onClick={handleSwitchMode}>
            Switch Mode
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search seminars, topics, or teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border'
                    }
                  `}
                >
                  {category}
                  {isActive && category !== 'All' && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                      {seminars.filter(s => s.category === category).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MCQ Quiz Section - Always Available */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Earn Credits Through Learning
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Test your knowledge and earn 2 credits for each correct answer
              </p>
            </CardHeader>
            <CardContent>
              <MCQQuiz />
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content - Seminars */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Available Seminars
              </h2>
              <Badge variant="outline">
                {filteredSeminars.length} seminars
              </Badge>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-border p-5">
                    <div className="mb-3 h-4 w-20 rounded bg-muted" />
                    <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
                    <div className="mb-4 h-16 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : filteredSeminars.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {seminars.length === 0
                      ? "No seminars available yet. Check back later!"
                      : "No seminars match your search. Try different filters."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSeminars.map((seminar) => (
                  <SeminarCard
                    key={seminar.id}
                    seminar={seminar}
                    onRequest={handleRequestSession}
                    isRequesting={requestingId === seminar.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verification</span>
                    <span className="font-medium">{verificationProgress}%</span>
                  </div>
                  <Progress value={verificationProgress} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={verification?.email_verified ? 'default' : 'outline'}>
                    Email
                  </Badge>
                  <Badge variant={verification?.mobile_verified ? 'default' : 'outline'}>
                    Mobile
                  </Badge>
                  <Badge variant={verification?.institutional_verified ? 'default' : 'outline'}>
                    Institutional
                  </Badge>
                </div>

                {!verification?.email_verified && user?.email && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email OTP"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value)}
                        maxLength={6}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendOTP('email', user.email || '')}
                        disabled={sendingOTP}
                      >
                        Send
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => verifyOTP(emailOtpCode, 'email')}
                      disabled={verifying || emailOtpCode.length < 6}
                    >
                      Verify Email OTP
                    </Button>
                  </div>
                )}

                <div className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Behavioral Health</span>
                    <span className="font-medium">{behavioralHealthScore}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {creditEligibility.allowed
                      ? 'Credits are active and earning is allowed.'
                      : creditEligibility.reason}
                  </p>
                  {creditsFrozen && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Credits currently frozen
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Session Memory Section */}


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

            {/* Scheduled Classes */}
            <ScheduledClasses />

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
                    Request to join seminars that interest you
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Teachers will accept or schedule your session
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Earn more credits by teaching what you know
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    The app remembers your best matches
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
