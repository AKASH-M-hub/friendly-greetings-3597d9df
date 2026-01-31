import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkillActivation } from '@/types/chrono';

interface SkillActivationIndicatorProps {
  skills: SkillActivation[];
  loading?: boolean;
}

export function SkillActivationIndicator({ skills, loading }: SkillActivationIndicatorProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading skills...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSkills = skills.filter(s => s.isActive);
  const inactiveSkills = skills.filter(s => !s.isActive);
  const maxVU = Math.max(...skills.map(s => s.totalVUGenerated), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Skill Activation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No skills tracked yet</p>
            </div>
          ) : (
            <>
              {/* Active Skills */}
              {activeSkills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle className="h-3 w-3" />
                    Active Skills ({activeSkills.length})
                  </div>
                  {activeSkills.map((skill, index) => (
                    <motion.div
                      key={skill.skill}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground truncate flex-1">
                          {skill.skill}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>{skill.timesUsed}× used</span>
                          <span className="text-primary font-medium">{skill.totalVUGenerated} VU</span>
                        </div>
                      </div>
                      <Progress 
                        value={(skill.totalVUGenerated / maxVU) * 100} 
                        className="h-1.5" 
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Inactive Skills */}
              {inactiveSkills.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Circle className="h-3 w-3" />
                    Inactive Skills ({inactiveSkills.length})
                  </div>
                  {inactiveSkills.map((skill) => (
                    <div key={skill.skill} className="flex items-center justify-between text-sm opacity-60">
                      <span className="text-muted-foreground truncate flex-1">
                        {skill.skill}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Last used: {skill.lastUsed 
                          ? new Date(skill.lastUsed).toLocaleDateString() 
                          : 'Never'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
