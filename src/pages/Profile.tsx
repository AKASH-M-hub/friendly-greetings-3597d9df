import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit2, 
  Camera,
  GraduationCap,
  BookOpen,
  Star,
  Award,
  Zap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

const DEFAULT_SKILLS: Skill[] = [
  { name: 'Web Development', level: 'Expert' },
  { name: 'UI/UX Design', level: 'Advanced' },
  { name: 'React', level: 'Expert' },
  { name: 'Product Management', level: 'Intermediate' },
];

const SKILLS_METADATA_PREFIX = 'SKILLS_JSON::';

const isSkillLevel = (value: string): value is Skill['level'] => {
  return ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(value);
};

export default function Profile() {
  const { modeHistory } = useMode();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsMetadataId, setSkillsMetadataId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate about sharing knowledge and learning new skills. Experienced in web development, design, and product management.',
    joinDate: 'January 2024',
  });

  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>('Beginner');

  const achievements = [
    { icon: Star, title: 'Top Rated', description: 'Maintained 4.9+ rating' },
    { icon: Award, title: 'Power Teacher', description: '50+ teaching sessions' },
    { icon: Zap, title: 'Quick Learner', description: 'Completed 20 sessions' },
  ];

  const handleSkillChange = (index: number, updates: Partial<Skill>) => {
    setSkills((prev) =>
      prev.map((skill, i) => (i === index ? { ...skill, ...updates } : skill))
    );
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;

    setSkills((prev) => [...prev, { name: trimmed, level: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel('Beginner');
  };

  const loadSkillsFromSupabase = async () => {
    if (!user) return;

    setLoadingSkills(true);
    try {
      const { data, error } = await supabase
        .from('teacher_expertise')
        .select('id, expertise_text')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .like('expertise_text', `${SKILLS_METADATA_PREFIX}%`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSkillsMetadataId(null);
        setSkills(DEFAULT_SKILLS);
        return;
      }

      setSkillsMetadataId(data.id);

      const serialized = data.expertise_text.startsWith(SKILLS_METADATA_PREFIX)
        ? data.expertise_text.slice(SKILLS_METADATA_PREFIX.length)
        : '[]';

      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        setSkills(DEFAULT_SKILLS);
        return;
      }

      const normalized = parsed
        .map((item: any) => ({
          name: typeof item?.name === 'string' ? item.name.trim() : '',
          level: typeof item?.level === 'string' && isSkillLevel(item.level) ? item.level : 'Beginner',
        }))
        .filter((item: Skill) => item.name.length > 0);

      setSkills(normalized);
    } catch (error) {
      console.error('Failed to load skills:', error);
      toast.error('Failed to load skills');
      setSkills(DEFAULT_SKILLS);
    } finally {
      setLoadingSkills(false);
    }
  };

  const saveSkillsToSupabase = async (): Promise<boolean> => {
    if (!user) return false;

    const cleanedSkills = skills
      .map((skill) => ({ name: skill.name.trim(), level: skill.level }))
      .filter((skill) => skill.name.length > 0);

    setSavingSkills(true);
    try {
      const expertiseText = `${SKILLS_METADATA_PREFIX}${JSON.stringify(cleanedSkills)}`;
      const updatedAt = new Date().toISOString();

      if (skillsMetadataId) {
        const { error } = await supabase
          .from('teacher_expertise')
          .update({ expertise_text: expertiseText, updated_at: updatedAt })
          .eq('id', skillsMetadataId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('teacher_expertise')
          .insert({
            user_id: user.id,
            expertise_text: expertiseText,
            domain_tag: 'other',
            is_active: false,
            updated_at: updatedAt,
          })
          .select('id')
          .single();

        if (error) throw error;
        setSkillsMetadataId(data.id);
      }

      setSkills(cleanedSkills);
      toast.success('Skills updated');
      return true;
    } catch (error) {
      console.error('Failed to save skills:', error);
      toast.error('Failed to save skills');
      return false;
    } finally {
      setSavingSkills(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSkillsFromSupabase();
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="noise-overlay min-h-screen px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-foreground">
              Your Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <Card className="overflow-hidden">
                <div className="relative h-24 bg-gradient-to-r from-primary/30 to-accent/30" />
                <CardContent className="relative -mt-12 text-center">
                  <div className="relative mx-auto mb-4 h-24 w-24">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 ring-4 ring-background">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h2 className="mb-1 font-display text-xl font-bold text-foreground">
                    {profile.name}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Member since {profile.joinDate}
                  </p>

                  <div className="flex justify-center gap-6 border-t border-border pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        {modeHistory.teachingSessions}
                      </div>
                      <p className="text-xs text-muted-foreground">Teaching</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {modeHistory.learningSessions}
                      </div>
                      <p className="text-xs text-muted-foreground">Learning</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <Star className="h-4 w-4 text-primary" />
                        4.9
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.title}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <achievement.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card>
                <Tabs defaultValue="info">
                  <CardHeader className="border-b border-border pb-0">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="info">Personal Info</TabsTrigger>
                      <TabsTrigger value="skills">Skills</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <TabsContent value="info" className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        Personal Information
                      </h3>
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Full Name
                        </Label>
                        <Input 
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </Label>
                        <Input 
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Phone
                        </Label>
                        <Input 
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Location
                        </Label>
                        <Input 
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Bio</Label>
                        <Textarea 
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          disabled={!isEditing}
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        Your Skills
                      </h3>
                      <Button
                        variant={isEditingSkills ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                          if (isEditingSkills) {
                            const saved = await saveSkillsToSupabase();
                            if (saved) {
                              setIsEditingSkills(false);
                            }
                            return;
                          }

                          setIsEditingSkills(true);
                        }}
                        disabled={loadingSkills || savingSkills}
                      >
                        {savingSkills ? 'Saving...' : isEditingSkills ? 'Save Skills' : 'Edit Skills'}
                      </Button>
                    </div>

                    {loadingSkills && (
                      <p className="mb-4 text-sm text-muted-foreground">Loading saved skills...</p>
                    )}

                    {isEditingSkills && (
                      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[1fr_180px_auto]">
                        <Input
                          placeholder="New skill"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                        />
                        <Select
                          value={newSkillLevel}
                          onValueChange={(value) => setNewSkillLevel(value as Skill['level'])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={handleAddSkill} disabled={!newSkillName.trim()}>
                          Add
                        </Button>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {skills.map((skill, index) => (
                        <div 
                          key={`${skill.name}-${index}`}
                          className="rounded-lg border border-border bg-muted/30 p-4"
                        >
                          {isEditingSkills ? (
                            <div className="space-y-3">
                              <Input
                                value={skill.name}
                                onChange={(e) => handleSkillChange(index, { name: e.target.value })}
                              />
                              <div className="flex items-center gap-2">
                                <Select
                                  value={skill.level}
                                  onValueChange={(value) => handleSkillChange(index, { level: value as Skill['level'] })}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                    <SelectItem value="Expert">Expert</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" onClick={() => handleRemoveSkill(index)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{skill.name}</span>
                              <Badge variant="secondary">{skill.level}</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="p-6">
                    <h3 className="mb-6 font-display text-lg font-semibold text-foreground">
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {[
                        { action: 'Completed teaching session', subject: 'React Fundamentals', time: '2 hours ago' },
                        { action: 'Earned achievement', subject: 'Power Teacher', time: '1 day ago' },
                        { action: 'Joined learning session', subject: 'UI/UX Design Basics', time: '3 days ago' },
                      ].map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.action}</p>
                            <p className="text-sm text-muted-foreground">{item.subject}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
