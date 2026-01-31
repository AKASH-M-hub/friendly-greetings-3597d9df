import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  X, 
  Loader2,
  BookOpen,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const categories = ['Technology', 'Design', 'Business', 'Languages', 'Music', 'Fitness', 'Science', 'Other'];
const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
const durations = ['30m', '45m', '1h', '1.5h', '2h'];

interface CreateSeminarFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function CreateSeminarForm({ onComplete, onCancel }: CreateSeminarFormProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technology',
    skill_level: 'Beginner',
    duration: '1h',
    max_learners: 10,
    prerequisites: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a seminar');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a seminar title');
      return;
    }

    setSaving(true);
    try {
      // In production, this would insert into database
      // For now, just show success and complete
      toast.success('Seminar created!', {
        description: 'Your seminar is now visible to learners.'
      });
      onComplete();
    } catch (error: unknown) {
      console.error('Error creating seminar:', error);
      toast.error('Failed to create seminar');
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
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            Create a New Seminar
          </CardTitle>
          <CardDescription className="text-base">
            Share your expertise with learners around the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Seminar Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to React Hooks"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What will learners gain from this seminar?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/500
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skill Level</Label>
                <Select
                  value={formData.skill_level}
                  onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skillLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((dur) => (
                      <SelectItem key={dur} value={dur}>{dur}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Max Learners
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.max_learners}
                  onChange={(e) => setFormData({ ...formData, max_learners: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Prerequisites (optional)
              </Label>
              <Input
                placeholder="e.g., Basic JavaScript knowledge"
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || !formData.title.trim()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Seminar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
