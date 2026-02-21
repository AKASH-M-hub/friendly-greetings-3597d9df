// =====================================================
// LAYER 2: TEACHER SKILLS MANAGEMENT HOOK
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  TeacherSkill,
  SkillDomain,
  SubmitSkillRequest,
  ExperienceLevel,
  TeachingScope,
  VerificationStatus,
  ApprovalStatus,
} from '@/types/security';
import { toast } from 'sonner';

export function useTeacherSkills() {
  const { user } = useAuth();
  const db = supabase as any;
  const [skills, setSkills] = useState<TeacherSkill[]>([]);
  const [domains, setDomains] = useState<SkillDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isSecuritySchemaError = (error: any) => {
    const code = error?.code;
    const message = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' ||
      code === '42501' ||
      code === 'PGRST200' ||
      code === 'PGRST205' ||
      message.includes('relation') ||
      message.includes('does not exist')
    );
  };

  // Fetch skill domains
  const fetchDomains = async () => {
    try {
      const { data, error } = await db
        .from('skill_domains')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        if (isSecuritySchemaError(error)) {
          setDomains([]);
          return;
        }
        throw error;
      }
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to load skill domains');
    }
  };

  // Fetch teacher's declared skills
  const fetchTeacherSkills = async () => {
    if (!user) {
      setSkills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await db
        .from('teacher_skills')
        .select(`
          *,
          skill_domain:skill_domains(*)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (isSecuritySchemaError(error)) {
          setSkills([]);
          return;
        }
        throw error;
      }
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching teacher skills:', error);
      toast.error('Failed to load your skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchTeacherSkills();
  }, [user]);

  // Submit new skill declaration
  const submitSkill = async (skillData: SubmitSkillRequest): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in first');
      return false;
    }

    setSubmitting(true);
    try {
      // Check if skill already exists
      const existing = skills.find(s => s.skill_domain_id === skillData.skill_domain_id);
      if (existing) {
        toast.error('You already declared this skill');
        return false;
      }

      // Check if domain requires validation
      const domain = domains.find(d => d.id === skillData.skill_domain_id);
      const requiresApproval = domain?.requires_validation || false;

      // Determine initial verification status based on evidence
      let verificationStatus: VerificationStatus = 'self_declared';
      if (skillData.portfolio_url || skillData.github_url || skillData.certification_url) {
        verificationStatus = 'evidence_backed';
      }

      const { error } = await db.from('teacher_skills').insert({
        teacher_id: user.id,
        skill_domain_id: skillData.skill_domain_id,
        experience_level: skillData.experience_level,
        teaching_scope: skillData.teaching_scope,
        years_of_experience: skillData.years_of_experience,
        description: skillData.description,
        portfolio_url: skillData.portfolio_url,
        github_url: skillData.github_url,
        certification_url: skillData.certification_url,
        verification_status: verificationStatus,
        approval_status: requiresApproval ? 'pending' : 'approved',
      });

      if (error) throw error;

      toast.success('Skill declaration submitted!', {
        description: requiresApproval 
          ? 'Your skill is pending approval'
          : 'You can now create seminars for this skill',
      });

      await fetchTeacherSkills();
      return true;
    } catch (error: any) {
      console.error('Error submitting skill:', error);
      toast.error(error.message || 'Failed to submit skill');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Update skill declaration
  const updateSkill = async (
    skillId: string,
    updates: Partial<TeacherSkill>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await db
        .from('teacher_skills')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', skillId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      toast.success('Skill updated successfully');
      await fetchTeacherSkills();
      return true;
    } catch (error: any) {
      console.error('Error updating skill:', error);
      toast.error('Failed to update skill');
      return false;
    }
  };

  // Delete skill declaration
  const deleteSkill = async (skillId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await db
        .from('teacher_skills')
        .delete()
        .eq('id', skillId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      toast.success('Skill removed');
      await fetchTeacherSkills();
      return true;
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to remove skill');
      return false;
    }
  };

  // Get approved skills only
  const getApprovedSkills = () => {
    return skills.filter(s => s.approval_status === 'approved');
  };

  // Get pending skills
  const getPendingSkills = () => {
    return skills.filter(s => s.approval_status === 'pending');
  };

  // Check if can teach a domain
  const canTeach = (domainId: string): boolean => {
    return skills.some(
      s => s.skill_domain_id === domainId && s.approval_status === 'approved'
    );
  };

  // Get verification level summary
  const getVerificationSummary = () => {
    const summary = {
      self_declared: 0,
      evidence_backed: 0,
      peer_reviewed: 0,
      institution_verified: 0,
      admin_approved: 0,
    };

    skills.forEach(skill => {
      summary[skill.verification_status]++;
    });

    return summary;
  };

  // Get skill by domain
  const getSkillByDomain = (domainId: string) => {
    return skills.find(s => s.skill_domain_id === domainId);
  };

  return {
    skills,
    domains,
    loading,
    submitting,
    submitSkill,
    updateSkill,
    deleteSkill,
    getApprovedSkills,
    getPendingSkills,
    canTeach,
    getVerificationSummary,
    getSkillByDomain,
    refresh: fetchTeacherSkills,
  };
}
