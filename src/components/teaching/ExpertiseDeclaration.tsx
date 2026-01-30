import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Tag, Plus, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DomainTag = Database['public']['Enums']['domain_tag'];

const domainTags: { id: DomainTag; label: string; color: string }[] = [
  { id: 'cs', label: 'Computer Science', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'math', label: 'Mathematics', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'design', label: 'Design', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'science', label: 'Science', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'language', label: 'Language', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'music', label: 'Music', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'business', label: 'Business', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'other', label: 'Other', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];

interface ExpertiseDeclarationProps {
  onComplete: () => void;
  existingExpertise?: {
    id: string;
    expertise_text: string;
    domain_tag: DomainTag;
  } | null;
}

export function ExpertiseDeclaration({ onComplete, existingExpertise }: ExpertiseDeclarationProps) {
  const [expertiseText, setExpertiseText] = useState(existingExpertise?.expertise_text || '');
  const [selectedTag, setSelectedTag] = useState<DomainTag>(existingExpertise?.domain_tag || 'other');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!expertiseText.trim() || !user) {
      toast({
        title: 'Missing information',
        description: 'Please describe what you want to teach.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (existingExpertise) {
        const { error } = await supabase
          .from('teacher_expertise')
          .update({
            expertise_text: expertiseText.trim(),
            domain_tag: selectedTag,
          })
          .eq('id', existingExpertise.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teacher_expertise')
          .insert({
            user_id: user.id,
            expertise_text: expertiseText.trim(),
            domain_tag: selectedTag,
          });

        if (error) throw error;
      }

      toast({
        title: 'Expertise saved!',
        description: 'Your teaching expertise has been updated.',
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error saving expertise',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-fit">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            What are you confident teaching right now?
          </CardTitle>
          <CardDescription className="text-base">
            Share your expertise and start helping others learn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Textarea
              placeholder="Example: I can teach React hooks, state management with Redux, and building responsive UIs with Tailwind CSS..."
              value={expertiseText}
              onChange={(e) => setExpertiseText(e.target.value)}
              className="min-h-[150px] resize-none text-base"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {expertiseText.length}/500 characters
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Select a domain tag</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {domainTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    selectedTag === tag.id
                      ? `${tag.color} ring-2 ring-primary`
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTag(tag.id)}
                >
                  {selectedTag === tag.id && <Check className="h-3 w-3 mr-1" />}
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="chrono-outline"
              className="flex-1"
              onClick={onComplete}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="chrono"
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !expertiseText.trim()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {existingExpertise ? 'Update Expertise' : 'Save Expertise'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
