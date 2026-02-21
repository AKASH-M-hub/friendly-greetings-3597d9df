import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  Shield,
  BookOpen,
  GraduationCap,
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { ThemeDropdown } from '@/components/ui/ThemeDropdown';
import { AuthProvider } from '@/contexts/AuthContext';
import { useLandingStats } from '@/hooks/useLandingStats';

const features = [
  {
    icon: Clock,
    title: 'Time as Currency',
    description: 'Your expertise is valuable. Earn credits by teaching and spend them to learn.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Connect with passionate learners and teachers from around the world.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data and sessions are protected with enterprise-grade security.',
  },
  {
    icon: Zap,
    title: 'Instant Sessions',
    description: 'Start teaching or learning in seconds with our seamless platform.',
  },
];

function LandingContent() {
  const navigate = useNavigate();
  const { stats: realData, loading } = useLandingStats();

  const stats = [
    { value: loading ? '...' : `${realData.activeUsers}+`, label: 'Active Users' },
    { value: loading ? '...' : `${realData.sessionsCompleted}+`, label: 'Sessions Completed' },
    { value: loading ? '...' : `${realData.skillsAvailable}+`, label: 'Skills Available' },
    { value: loading ? '...' : realData.averageRating, label: 'Average Rating' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AmbientBackground />

      {/* Navbar */}
      <header className="navbar-glass fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary transition-transform hover:scale-105">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Chrono
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Dropdown */}
            <ThemeDropdown />
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/mode')}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Time is Your Most Valuable Currency
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-display text-5xl font-bold leading-tight text-foreground md:text-7xl"
          >
            Trade Your{' '}
            <span className="text-gradient-primary">Knowledge</span>
            <br />
            Grow Your Skills
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Join a community where time becomes value. Teach what you know,
            learn what you love, and watch your credits grow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => navigate('/mode')}
              className="group gap-3 bg-primary px-8 py-6 text-lg text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              <GraduationCap className="h-5 w-5" />
              𝒢𝑒𝓉 𝒮𝓉𝒶𝓇𝓉𝑒𝒹
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-2 font-display text-4xl font-bold text-primary md:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground md:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Features Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Why Choose Chrono?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Our platform makes knowledge exchange seamless, secure, and rewarding.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm md:p-12"
          >
            <div className="mb-6 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            <blockquote className="mb-6 font-display text-xl text-foreground md:text-2xl">
              "Chrono transformed how I share my expertise. I've taught 50+ sessions
              and learned skills I never thought I'd master. The credit system is genius!"
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20" />
              <div className="text-left">
                <div className="font-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">UX Designer & Educator</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of learners and teachers today. Your first 5 credits are on us.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/mode')}
              className="group gap-3 bg-primary px-10 py-6 text-lg text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-display font-semibold text-foreground">Chrono</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build for Protothon @Princeton 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div >
  );
}

export default function Landing() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
