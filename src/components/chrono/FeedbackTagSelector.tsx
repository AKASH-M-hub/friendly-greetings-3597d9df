import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeedbackTag, FEEDBACK_TAG_LABELS, SessionOutcome } from '@/types/chrono';

interface FeedbackTagSelectorProps {
  sessionId: string;
  onSubmit: (outcome: SessionOutcome, tags: FeedbackTag[]) => Promise<boolean>;
  maxTags?: number;
}

export function FeedbackTagSelector({ 
  sessionId, 
  onSubmit, 
  maxTags = 2 
}: FeedbackTagSelectorProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<SessionOutcome | null>(null);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const outcomes: { value: SessionOutcome; label: string; emoji: string }[] = [
    { value: 'solved', label: 'Solved', emoji: '✅' },
    { value: 'partial', label: 'Partial', emoji: '🔄' },
    { value: 'not_solved', label: 'Not Solved', emoji: '❌' },
  ];

  const allTags = Object.entries(FEEDBACK_TAG_LABELS) as [FeedbackTag, string][];

  const toggleTag = (tag: FeedbackTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else if (selectedTags.length < maxTags) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOutcome) return;
    
    setSubmitting(true);
    const success = await onSubmit(selectedOutcome, selectedTags);
    setSubmitting(false);
    
    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Check className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
            <p className="text-xs text-muted-foreground mt-1">
              This helps improve future matches
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Quick Session Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcome Selection */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Session Outcome
          </p>
          <div className="flex gap-2">
            {outcomes.map(({ value, label, emoji }) => (
              <Button
                key={value}
                variant={selectedOutcome === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOutcome(value)}
                className="flex-1"
              >
                <span className="mr-1">{emoji}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tag Selection */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Add Tags (max {maxTags})
          </p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(([tag, label]) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTag(tag)}
                disabled={!selectedTags.includes(tag) && selectedTags.length >= maxTags}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-50'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedOutcome || submitting}
          className="w-full"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  );
}
