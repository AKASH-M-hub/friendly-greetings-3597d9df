import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles,
  GraduationCap,
  Search,
  Filter
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SeminarCard, Seminar } from '@/components/learning/SeminarCard';
import { ScheduledClasses } from '@/components/learning/ScheduledClasses';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const categories = ['All', 'Technology', 'Design', 'Business', 'Languages', 'Music', 'Fitness'];

export default function LearningDashboard() {
  const { unlockMode } = useMode();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSeminars();
  }, [user]);

  const fetchSeminars = async () => {
    try {
      const { data, error } = await supabase
        .from('seminars')
        .select(`
          id,
          title,
          description,
          category,
          skill_level,
          duration,
          max_learners,
          prerequisites,
          teacher_id,
          created_at,
          profiles!seminars_teacher_id_fkey (
            display_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's requests if logged in
      let userRequests: Set<string> = new Set();
      if (user) {
        const { data: requests } = await supabase
          .from('session_requests')
          .select('seminar_id')
          .eq('learner_id', user.id);
        
        userRequests = new Set(requests?.map(r => r.seminar_id) || []);
      }

      const formattedSeminars: Seminar[] = (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        skill_level: s.skill_level,
        duration: s.duration,
        max_learners: s.max_learners,
        prerequisites: s.prerequisites,
        teacher_id: s.teacher_id,
        teacher_name: s.profiles?.display_name || 'Teacher',
        teacher_avatar: s.profiles?.avatar_url,
        created_at: s.created_at,
        has_requested: userRequests.has(s.id)
      }));

      setSeminars(formattedSeminars);
    } catch (error) {
      console.error('Error fetching seminars:', error);
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
          seminar_id: seminarId,
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
          <Button variant="chrono-outline" onClick={() => unlockMode()}>
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
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

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
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
