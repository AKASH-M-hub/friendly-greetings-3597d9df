import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModeCard } from '@/components/mode/ModeCard';
import { ReadinessCheck } from '@/components/mode/ReadinessCheck';
import { Button } from '@/components/ui/button';
import { useMode } from '@/contexts/ModeContext';
import { Link } from 'react-router-dom';

export default function ModeSelection() {
  const navigate = useNavigate();
  const { setMode, lockMode, incrementHistory } = useMode();
  const [selectedMode, setSelectedMode] = useState<'teaching' | 'learning' | null>(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleModeSelect = (mode: 'teaching' | 'learning') => {
    setSelectedMode(mode);
    setShowReadiness(true);
    setIsReady(false);
  };

  const handleReadinessComplete = useCallback((ready: boolean) => {
    setIsReady(ready);
  }, []);

  const handleProceed = () => {
    if (selectedMode && isReady) {
      setMode(selectedMode);
      lockMode();
      incrementHistory(selectedMode);
      navigate(selectedMode === 'teaching' ? '/teaching' : '/learning');
    }
  };

  return (
    <MainLayout hideNavbar>
      <div className="noise-overlay flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-6 top-6"
        >
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Time is Value
          </div>
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground md:text-5xl">
            Choose Your Mode
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Share your skills to earn credits, or spend credits to learn something new.
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="mb-8 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ModeCard
              icon={GraduationCap}
              title="Teaching Mode"
              description="Share your expertise and earn credits while helping others grow."
              features={[
                "Create live teaching sessions",
                "Set your own schedule",
                "Build your teaching profile",
                "Receive learner feedback"
              ]}
              creditInfo="+2 credits per hour"
              isSelected={selectedMode === 'teaching'}
              onClick={() => handleModeSelect('teaching')}
              variant="teaching"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ModeCard
              icon={BookOpen}
              title="Learning Mode"
              description="Discover new skills from experts and grow your knowledge base."
              features={[
                "Browse available sessions",
                "Join live teaching sessions",
                "Track your learning progress",
                "Provide session feedback"
              ]}
              creditInfo="-1 credit per hour"
              isSelected={selectedMode === 'learning'}
              onClick={() => handleModeSelect('learning')}
              variant="learning"
            />
          </motion.div>
        </div>

        {/* Readiness Check */}
        <div className="w-full max-w-md">
          <ReadinessCheck
            isVisible={showReadiness}
            onComplete={handleReadinessComplete}
          />
        </div>

        {/* Proceed Button */}
        <AnimatePresence>
          {isReady && selectedMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <Button
                size="xl"
                variant="chrono"
                onClick={handleProceed}
                className="group gap-3"
              >
                Enter {selectedMode === 'teaching' ? 'Teaching' : 'Learning'} Mode
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          You can switch modes after completing your current session.
        </motion.p>
      </div>
    </MainLayout>
  );
}
