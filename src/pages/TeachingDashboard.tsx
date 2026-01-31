import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Calendar, MessageSquare, Star, Lightbulb, BookOpen, Trash2, Video } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { unlockMode } = useMode();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [showExpertiseForm, setShowExpertiseForm] = useState(false);
  const [showSeminarForm, setShowSeminarForm] = useState(false);
  const [expertise, setExpertise] = useState<Expertise | null>(null);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [pendingReviewSessionId, setPendingReviewSessionId] = useState<string | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

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
      .select('id')
      .eq('teacher_id', user.id)
      .eq('status', 'completed');

    if (!sessions?.length) return;

    const { data: reviews } = await supabase
      .from('teaching_reviews')
      .select('session_id')
      .eq('teacher_id', user.id);

    const reviewedSessionIds = new Set(reviews?.map(r => r.session_id) || []);
    const pendingSession = sessions.find(s => !reviewedSessionIds.has(s.id));

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
              onClick={() => unlockMode()}
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
            onOpenChange={setShowReviewPrompt}
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
