import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Calendar, MessageSquare, Star, Lightbulb, BookOpen, Trash2, Video, ShieldCheck, UserCheck, Shield, Activity, AlertTriangle, CheckCircle2, Clock, XCircle, Lock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExpertiseDeclaration } from '@/components/teaching/ExpertiseDeclaration';
import { LiveSessionTracker } from '@/components/teaching/LiveSessionTracker';
import { TeachingRequestsInbox } from '@/components/teaching/TeachingRequestsInbox';
import { TeachingStats } from '@/components/teaching/TeachingStats';
import { TeachingReviewPrompt } from '@/components/teaching/TeachingReviewPrompt';
import { CreateSeminarForm } from '@/components/teaching/CreateSeminarForm';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTeacherSkills } from '@/hooks/useTeacherSkills';
import { useTeacherPerformance } from '@/hooks/useTeacherPerformance';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useBehavioralMonitoring } from '@/hooks/useBehavioralMonitoring';

type DomainTag = 'cs' | 'math' | 'design' | 'science' | 'language' | 'music' | 'business' | 'other';

interface Expertise {
  id: string;
  expertise_text: string;
  domain_tag: DomainTag;
}

interface UpcomingSession {
  id: string;
  title: string | null;
  created_at: string;
  status: string;
}

interface RecentFeedback {
  id: string;
  experience_rating: number;
  feedback: string | null;
  created_at: string;
}

interface Seminar {
  id: string;
  title: string;
  category: string;
  skill_level: string;
  duration: string;
  is_active: boolean;
}

export default function TeachingDashboard() {
  const { setMode, lockMode } = useMode();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSwitchMode = () => {
    setMode('learning');
    lockMode();
    navigate('/learning');
  };

  const [showExpertiseForm, setShowExpertiseForm] = useState(false);
  const [showSeminarForm, setShowSeminarForm] = useState(false);
  const [expertise, setExpertise] = useState<Expertise | null>(null);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [pendingReviewSessionId, setPendingReviewSessionId] = useState<string | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const { getApprovedSkills, getPendingSkills } = useTeacherSkills();
  const { performance, getPerformanceBreakdown, meetsMinimumStandards } = useTeacherPerformance();
  const { isAdmin, getDashboardStats } = useAdminDashboard();
  const { verification, getVerificationProgress, loading: verifyLoading } = useIdentityVerification();
  const { getBehavioralHealthScore, creditsFrozen, anomalies } = useBehavioralMonitoring();

  const getDismissedReviewSessionIds = (userId: string): Set<string> => {
    const storageKey = `chrono:dismissed-review-prompts:${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  };

  const markReviewPromptDismissed = (userId: string, sessionId: string) => {
    const storageKey = `chrono:dismissed-review-prompts:${userId}`;
    const dismissed = getDismissedReviewSessionIds(userId);
    dismissed.add(sessionId);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(dismissed)));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchExpertise();
      fetchSeminars();
      fetchUpcomingSessions();
      fetchRecentFeedback();
      checkPendingReviews();
    }
  }, [user]);

  const fetchSeminars = async () => {
    if (!user) return;

    // Fetch scheduled sessions to display as "My Seminars"
    const { data } = await supabase
      .from('teaching_sessions')
      .select('id, title, status, duration, category, skill_level')
      .eq('teacher_id', user.id)
      .eq('status', 'scheduled') // Only showing scheduled/open ones
      .order('created_at', { ascending: false });

    const mapped: Seminar[] = (data || []).map((s: any) => ({
      id: s.id,
      title: s.title || 'Untitled',
      category: s.category || 'General',
      skill_level: s.skill_level || 'All Levels',
      duration: s.duration || '1h',
      is_active: true
    }));

    setSeminars(mapped);
  };

  const deleteSeminar = async (id: string) => {
    // Optimistic update
    setSeminars(prev => prev.filter(s => s.id !== id));

    try {
      const { error } = await supabase
        .from('teaching_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Seminar deleted');
    } catch (error) {
      console.error('Error deleting seminar:', error);
      toast.error('Failed to delete seminar');
      // Revert optimistic update
      fetchSeminars();
    }
  };

  const fetchExpertise = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('teacher_expertise')
      .select('id, expertise_text, domain_tag')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setExpertise(data as Expertise);
    }
  };

  const fetchUpcomingSessions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('teaching_sessions')
      .select('id, title, created_at, status')
      .eq('teacher_id', user.id)
      .in('status', ['pending', 'scheduled'])
      .order('created_at', { ascending: true })
      .limit(5);

    setUpcomingSessions(data || []);
  };

  const fetchRecentFeedback = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('teaching_reviews')
      .select('id, experience_rating, feedback, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4);

    setRecentFeedback(data || []);
  };

  const checkPendingReviews = async () => {
    if (!user) return;

    // Find completed sessions without reviews
    const { data: sessions } = await supabase
      .from('teaching_sessions')
      .select('id, created_at')
      .eq('teacher_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (!sessions?.length) return;

    const { data: reviews } = await supabase
      .from('teaching_reviews')
      .select('session_id')
      .eq('teacher_id', user.id);

    const reviewedSessionIds = new Set(reviews?.map(r => r.session_id) || []);
    const dismissedSessionIds = getDismissedReviewSessionIds(user.id);
    const pendingSession = sessions.find(
      s => !reviewedSessionIds.has(s.id) && !dismissedSessionIds.has(s.id)
    );

    if (pendingSession) {
      setPendingReviewSessionId(pendingSession.id);
      setShowReviewPrompt(true);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (showExpertiseForm) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <ExpertiseDeclaration
            existingExpertise={expertise}
            onComplete={() => {
              setShowExpertiseForm(false);
              fetchExpertise();
            }}
          />
        </div>
      </MainLayout>
    );
  }

  if (showSeminarForm) {
    return (
      <MainLayout>
        <div className="min-h-screen p-6 lg:p-8">
          <CreateSeminarForm
            onComplete={() => {
              setShowSeminarForm(false);
              fetchSeminars();
            }}
            onCancel={() => setShowSeminarForm(false)}
          />
        </div>
      </MainLayout>
    );
  }

  const approvedSkills = getApprovedSkills();
  const pendingSkills = getPendingSkills();
  const performanceBreakdown = getPerformanceBreakdown();
  const adminStats = getDashboardStats();
  const verificationProgress = getVerificationProgress();
  const behavioralHealth = getBehavioralHealthScore();

  const securityLayers = [
    {
      id: 1,
      label: 'Identity Verification',
      icon: Shield,
      status: verifyLoading ? 'loading' : verification?.email_verified ? 'active' : 'pending',
      detail: verifyLoading
        ? 'Checking…'
        : verification?.email_verified
        ? `Level: ${(verification.verification_level ?? 'email').replace(/_/g, ' ')}`
        : 'Email not verified',
      progress: verificationProgress,
    },
    {
      id: 2,
      label: 'Skill Validation',
      icon: UserCheck,
      status: approvedSkills.length > 0 ? 'active' : pendingSkills.length > 0 ? 'pending' : 'inactive',
      detail: `${approvedSkills.length} approved · ${pendingSkills.length} pending`,
      progress: approvedSkills.length > 0 ? 100 : pendingSkills.length > 0 ? 50 : 0,
    },
    {
      id: 3,
      label: 'Performance Metrics',
      icon: Star,
      status: performance ? (meetsMinimumStandards() ? 'active' : 'warning') : 'inactive',
      detail: performance
        ? `${performance.average_rating?.toFixed(1) ?? '0.0'}/5 · ${(performanceBreakdown?.completion ?? 0)}% completion`
        : 'No data yet',
      progress: performance ? Math.min(100, (performance.reliability_score ?? 0)) : 0,
    },
    {
      id: 4,
      label: 'Behavioral Monitor',
      icon: Activity,
      status: creditsFrozen ? 'error' : anomalies.filter((a: any) => a.severity === 'critical' || a.severity === 'high').length > 0 ? 'warning' : 'active',
      detail: creditsFrozen
        ? 'Credits frozen'
        : `Health: ${behavioralHealth}/100 · ${anomalies.length} flag${anomalies.length !== 1 ? 's' : ''}`,
      progress: behavioralHealth,
    },
    {
      id: 5,
      label: 'Admin Oversight',
      icon: Lock,
      status: isAdmin ? 'active' : 'inactive',
      detail: isAdmin ? `Role active · ${adminStats.pending_approvals} pending` : 'Standard account',
      progress: isAdmin ? 100 : 60,
    },
    {
      id: 6,
      label: 'Transaction Integrity',
      icon: ShieldCheck,
      status: 'active',
      detail: 'Dual-confirm guard enabled',
      progress: 100,
    },
  ];

  const statusConfig: Record<string, { color: string; bg: string; Icon: any; label: string }> = {
    active:   { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', Icon: CheckCircle2, label: 'Active' },
    pending:  { color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/30',   Icon: Clock,         label: 'Pending' },
    warning:  { color: 'text-orange-500',  bg: 'bg-orange-500/10 border-orange-500/30',  Icon: AlertTriangle,  label: 'Warning' },
    error:    { color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/30',        Icon: XCircle,        label: 'Error' },
    inactive: { color: 'text-muted-foreground', bg: 'bg-muted/30 border-border',        Icon: Clock,          label: 'Inactive' },
    loading:  { color: 'text-blue-500',    bg: 'bg-blue-500/10 border-blue-500/30',      Icon: Clock,          label: 'Loading' },
  };

  return (
    <MainLayout>
      <div className="min-h-screen p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Teaching Dashboard
            </h1>
            <p className="text-muted-foreground">
              Share your knowledge and earn credits
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="chrono-outline"
              onClick={handleSwitchMode}
            >
              Switch Mode
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowExpertiseForm(true)}
            >
              {expertise ? (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit Expertise
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  Declare Expertise
                </>
              )}
            </Button>
            <Button
              variant="chrono"
              className="gap-2"
              onClick={() => setShowSeminarForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create Seminar
            </Button>
          </div>
        </div>

        {/* ── Security Layers Overview ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Security Layers
                <Badge variant="secondary" className="ml-auto text-xs">
                  {securityLayers.filter(l => l.status === 'active').length}/{securityLayers.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {securityLayers.map((layer) => {
                  const cfg = statusConfig[layer.status];
                  const LayerIcon = layer.icon;
                  const StatusIcon = cfg.Icon;
                  return (
                    <div
                      key={layer.id}
                      className={`rounded-lg border p-4 ${cfg.bg}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LayerIcon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="text-sm font-medium text-foreground">
                            L{layer.id}: {layer.label}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{layer.detail}</p>
                      <Progress
                        value={layer.progress}
                        className="h-1"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Seminars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                My Seminars
                <Badge variant="secondary" className="ml-auto">{seminars.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seminars.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {seminars.map((seminar) => (
                    <div
                      key={seminar.id}
                      className="rounded-lg border border-border p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground line-clamp-1">{seminar.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSeminar(seminar.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">{seminar.category}</Badge>
                        <Badge variant="outline" className="text-xs">{seminar.skill_level}</Badge>
                        <Badge variant="outline" className="text-xs">{seminar.duration}</Badge>
                      </div>

                      <Button
                        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => navigate(`/meeting/${seminar.id}`)}
                      >
                        <Video className="h-4 w-4" />
                        Start Class
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No active seminars yet.</p>
                  <Button
                    variant="link"
                    onClick={() => setShowSeminarForm(true)}
                    className="mt-2 text-primary"
                  >
                    Create your first seminar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expertise Display */}
        {expertise && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Your Current Expertise</h3>
                    <p className="text-muted-foreground">{expertise.expertise_text}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {expertise.domain_tag.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trust & Skills Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trust & Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reliability Score</span>
                <span className="font-medium">{performance?.reliability_score ?? 0}/100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average Rating</span>
                <span className="font-medium">{performance?.average_rating?.toFixed(1) ?? '0.0'}/5</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{performanceBreakdown?.completion ?? 0}%</span>
              </div>
              <Badge variant={meetsMinimumStandards() ? 'default' : 'outline'}>
                {meetsMinimumStandards() ? 'Eligible for Visibility Boost' : 'Below Minimum Standards'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-4 w-4 text-primary" />
                Skill & Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approved Skills</span>
                <span className="font-medium">{approvedSkills.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Review</span>
                <span className="font-medium">{pendingSkills.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Teachers can create seminars once relevant skills are approved.
              </p>

              {isAdmin && (
                <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Admin Snapshot</p>
                  <p>Pending approvals: {adminStats.pending_approvals}</p>
                  <p>Flagged users: {adminStats.flagged_users}</p>
                  <p>Unresolved anomalies: {adminStats.unresolved_anomalies}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <TeachingStats />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Session Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LiveSessionTracker />
          </motion.div>

          {/* Teaching Requests Inbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TeachingRequestsInbox />
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {session.title || 'Teaching Session'}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {session.status}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                        <Button
                          size="sm"
                          className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => navigate(`/meeting/${session.id}`)}
                        >
                          <Video className="h-3 w-3" />
                          Start Class
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No upcoming sessions scheduled
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentFeedback.length > 0 ? (
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="rounded-lg border border-border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: feedback.experience_rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          </div>
                        </div>
                        {feedback.feedback && (
                          <p className="text-sm text-muted-foreground">"{feedback.feedback}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No feedback yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Review Prompt Dialog */}
        {pendingReviewSessionId && (
          <TeachingReviewPrompt
            sessionId={pendingReviewSessionId}
            open={showReviewPrompt}
            onOpenChange={(open) => {
              setShowReviewPrompt(open);
              if (!open && user && pendingReviewSessionId) {
                markReviewPromptDismissed(user.id, pendingReviewSessionId);
                setPendingReviewSessionId(null);
              }
            }}
            onComplete={() => {
              setShowReviewPrompt(false);
              setPendingReviewSessionId(null);
              fetchRecentFeedback();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
