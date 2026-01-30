import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Send, 
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LearnerFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  teacherName: string;
  sessionTitle: string;
  onSubmit: (feedback: FeedbackData) => void;
}

export interface FeedbackData {
  sessionId: string;
  rating: number;
  wouldRecommend: boolean | null;
  comment: string;
  highlights: string[];
}

const feedbackHighlights = [
  'Clear explanations',
  'Patient teaching',
  'Good examples',
  'Interactive',
  'Engaging',
  'Well structured',
  'Answered questions',
  'Practical tips'
];

export function LearnerFeedbackForm({
  isOpen,
  onClose,
  sessionId,
  teacherName,
  sessionTitle,
  onSubmit
}: LearnerFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleHighlightToggle = (highlight: string) => {
    setSelectedHighlights(prev =>
      prev.includes(highlight)
        ? prev.filter(h => h !== highlight)
        : [...prev, highlight]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    
    onSubmit({
      sessionId,
      rating,
      wouldRecommend,
      comment,
      highlights: selectedHighlights
    });
    
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      // Reset form
      setRating(0);
      setWouldRecommend(null);
      setComment('');
      setSelectedHighlights([]);
      setIsSubmitted(false);
    }, 2000);
  };

  const resetAndClose = () => {
    setRating(0);
    setWouldRecommend(null);
    setComment('');
    setSelectedHighlights([]);
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Feedback Sent!
              </h3>
              <p className="text-sm text-muted-foreground">
                Thank you for helping {teacherName} improve
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle>Rate Your Session</DialogTitle>
                <DialogDescription>
                  How was "{sessionTitle}" with {teacherName}?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rating === 0 ? 'Tap to rate' : 
                     rating === 1 ? 'Poor' :
                     rating === 2 ? 'Fair' :
                     rating === 3 ? 'Good' :
                     rating === 4 ? 'Very Good' :
                     'Excellent!'}
                  </p>
                </div>

                {/* Would Recommend */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Would you recommend this teacher?
                  </label>
                  <div className="flex gap-3">
                    <Button
                      variant={wouldRecommend === true ? 'chrono' : 'outline'}
                      size="sm"
                      onClick={() => setWouldRecommend(true)}
                      className="flex-1 gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Yes
                    </Button>
                    <Button
                      variant={wouldRecommend === false ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setWouldRecommend(false)}
                      className="flex-1 gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No
                    </Button>
                  </div>
                </div>

                {/* Highlights */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    What stood out? (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {feedbackHighlights.map((highlight) => (
                      <Button
                        key={highlight}
                        variant={selectedHighlights.includes(highlight) ? 'chrono' : 'outline'}
                        size="sm"
                        onClick={() => handleHighlightToggle(highlight)}
                        className="text-xs"
                      >
                        {highlight}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Additional comments (optional)
                  </label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button
                  variant="chrono"
                  className="w-full gap-2"
                  disabled={rating === 0}
                  onClick={handleSubmit}
                >
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
