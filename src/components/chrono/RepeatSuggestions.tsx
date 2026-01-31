import { motion } from 'framer-motion';
import { Users, Star, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RepeatSuggestion, FEEDBACK_TAG_LABELS } from '@/types/chrono';

interface RepeatSuggestionsProps {
  suggestions: RepeatSuggestion[];
  loading?: boolean;
  onSelectUser?: (userId: string) => void;
}

export function RepeatSuggestions({ suggestions, loading, onSelectUser }: RepeatSuggestionsProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Finding suggestions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Suggested Partners
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              Based on your history
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No suggestions yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Complete more sessions to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-medium">
                      {suggestion.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {suggestion.userName}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        {suggestion.matchScore}% match
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">{suggestion.skill}</span>
                      <span>•</span>
                      <span>{suggestion.previousSessions} sessions</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {suggestion.averageQuality.toFixed(1)}
                      </span>
                      {suggestion.commonTags.slice(0, 2).map(tag => (
                        <span 
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {FEEDBACK_TAG_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectUser?.(suggestion.userId)}
                  >
                    Request
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
