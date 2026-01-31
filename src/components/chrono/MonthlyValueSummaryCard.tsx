import { motion } from 'framer-motion';
import { FileText, Share2, Clock, Users, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthlyValueSummary } from '@/types/chrono';

interface MonthlyValueSummaryCardProps {
  summary: MonthlyValueSummary | null;
  loading?: boolean;
}

export function MonthlyValueSummaryCard({ summary, loading }: MonthlyValueSummaryCardProps) {
  if (loading || !summary) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Generating summary...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleShare = () => {
    const shareText = `📊 My ${summary.month} ${summary.year} Value Summary\n\n` +
      `✨ ${summary.totalVU} Value Units created\n` +
      `⏱️ ${summary.hoursRestored.toFixed(1)} hours restored\n` +
      `🎯 ${summary.skillsApplied} skills applied\n` +
      `🤝 ${summary.connectionsFormed} connections formed\n\n` +
      `This month, my time created real outcomes. #Chrono`;

    if (navigator.share) {
      navigator.share({
        title: 'My Chrono Value Summary',
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-card/80 to-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {summary.month} {summary.year} Summary
            </span>
            {summary.isShareable && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="text-muted-foreground hover:text-primary"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Value Display */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-display text-3xl font-bold text-primary">
                {summary.totalVU} VU
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total value created this month
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="font-display text-xl font-bold text-foreground">
                {summary.hoursRestored.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground">Hours Restored</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Lightbulb className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="font-display text-xl font-bold text-foreground">
                {summary.skillsApplied}
              </div>
              <div className="text-xs text-muted-foreground">Skills Applied</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="font-display text-xl font-bold text-foreground">
                {summary.connectionsFormed}
              </div>
              <div className="text-xs text-muted-foreground">Connections</div>
            </div>
          </div>

          {/* Highlights */}
          {summary.highlights.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Highlights
              </p>
              <ul className="space-y-1">
                {summary.highlights.map((highlight, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {highlight}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Message */}
          <div className="text-center pt-2">
            <p className="text-sm italic text-muted-foreground">
              "This month, your time created real outcomes."
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
