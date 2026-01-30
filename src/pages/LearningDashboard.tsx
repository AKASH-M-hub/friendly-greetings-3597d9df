import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users,
  Star,
  Play,
  Sparkles
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMode } from '@/contexts/ModeContext';

const categories = [
  'All', 'Technology', 'Design', 'Business', 'Languages', 'Music', 'Fitness'
];

const liveSessions = [
  {
    id: 1,
    title: 'Advanced React Patterns',
    teacher: 'Michael Chen',
    category: 'Technology',
    learners: 8,
    maxLearners: 12,
    duration: '1.5h',
    rating: 4.9,
    isLive: true,
  },
  {
    id: 2,
    title: 'Figma for Beginners',
    teacher: 'Sarah Williams',
    category: 'Design',
    learners: 5,
    maxLearners: 10,
    duration: '1h',
    rating: 4.7,
    isLive: true,
  },
  {
    id: 3,
    title: 'Spanish Conversation',
    teacher: 'Carlos Rivera',
    category: 'Languages',
    learners: 3,
    maxLearners: 6,
    duration: '45m',
    rating: 5.0,
    isLive: true,
  },
  {
    id: 4,
    title: 'Piano Basics',
    teacher: 'Emma Thompson',
    category: 'Music',
    learners: 4,
    maxLearners: 8,
    duration: '1h',
    rating: 4.8,
    isLive: false,
    startsIn: '30 min',
  },
];

const myProgress = [
  { skill: 'React Development', hours: 12, level: 'Intermediate' },
  { skill: 'UI Design', hours: 8, level: 'Beginner' },
  { skill: 'Spanish', hours: 5, level: 'Beginner' },
];

export default function LearningDashboard() {
  const { unlockMode } = useMode();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = liveSessions.filter(session => {
    const matchesCategory = selectedCategory === 'All' || session.category === selectedCategory;
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
              Discover sessions and expand your skills
            </p>
          </div>
          <Button variant="chrono-outline" onClick={() => unlockMode()}>
            Switch Mode
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions or teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'chrono' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Available Sessions */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Available Sessions
              </h2>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {liveSessions.filter(s => s.isLive).length} Live Now
              </Badge>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <Badge 
                          variant="outline" 
                          className={session.isLive 
                            ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                            : "border-primary/50 bg-primary/10 text-primary"
                          }
                        >
                          {session.isLive ? (
                            <>
                              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Live
                            </>
                          ) : (
                            `Starts in ${session.startsIn}`
                          )}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span className="font-medium">{session.rating}</span>
                        </div>
                      </div>
                      
                      <h3 className="mb-1 font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {session.title}
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground">
                        by {session.teacher}
                      </p>
                      
                      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.learners}/{session.maxLearners}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.duration}
                        </span>
                      </div>
                      
                      <Button 
                        variant="chrono-outline" 
                        className="w-full gap-2"
                        disabled={session.learners >= session.maxLearners}
                      >
                        <Play className="h-4 w-4" />
                        {session.learners >= session.maxLearners ? 'Session Full' : 'Join Session'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No sessions found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credits Reminder */}
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

            {/* Learning Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  My Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myProgress.map((item) => (
                  <div key={item.skill} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.skill}</span>
                      <span className="text-muted-foreground">{item.hours}h</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.hours / 20) * 100, 100)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.level}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Join sessions early to get the best experience
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
      </div>
    </MainLayout>
  );
}
