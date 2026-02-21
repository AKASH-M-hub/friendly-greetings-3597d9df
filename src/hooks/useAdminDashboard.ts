// =====================================================
// LAYER 5: ADMIN DASHBOARD & INSTITUTIONAL OVERSIGHT HOOK
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Module-level cache: skip queries once tables are known missing this session
const _schemaUnavailable = new Set<string>();
import { useAuth } from '@/contexts/AuthContext';
import {
  InstitutionAdmin,
  TeacherApproval,
  AdminActivityLog,
  TeacherApprovalStatus,
  AdminApprovalRequest,
  TeacherPerformance,
  TransactionAnomaly,
} from '@/types/security';
import { toast } from 'sonner';

export function useAdminDashboard() {
  const { user } = useAuth();
  const db = supabase as any;
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<AdminActivityLog[]>([]);
  const [anomalies, setAnomalies] = useState<TransactionAnomaly[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const isSecuritySchemaError = (error: any) => {
    const code = error?.code;
    const status = error?.status;
    const message = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' || code === '42501' ||
      code === 'PGRST200' || code === 'PGRST205' ||
      status === 404 ||
      message.includes('relation') || message.includes('does not exist') ||
      message.includes('schema cache')
    );
  };

  // Check if user is admin
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      if (_schemaUnavailable.has('institution_admins')) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await db
        .from('institution_admins')
        .select('*, institution:institutions(*)')
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isSecuritySchemaError(error)) {
          _schemaUnavailable.add('institution_admins');
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        setIsAdmin(true);
        setAdminRole(data.role);
        setInstitutionId(data.institution_id);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending teacher approvals
  const fetchPendingApprovals = async () => {
    if (!institutionId) return;

    try {
      const { data, error } = await db
        .from('teacher_approvals')
        .select(`
          *,
          teacher:auth.users!teacher_id(
            id,
            email
          ),
          teacher_skills(
            *,
            skill_domain:skill_domains(*)
          ),
          teacher_performance(*)
        `)
        .eq('institution_id', institutionId)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    }
  };

  // Fetch flagged users
  const fetchFlaggedUsers = async () => {
    if (!institutionId) return;

    try {
      const { data, error } = await db
        .from('teacher_approvals')
        .select(`
          *,
          teacher:auth.users!teacher_id(
            id,
            email
          )
        `)
        .eq('institution_id', institutionId)
        .eq('flagged_for_review', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setFlaggedUsers(data || []);
    } catch (error) {
      console.error('Error fetching flagged users:', error);
    }
  };

  // Fetch recent admin activity
  const fetchRecentActivity = async () => {
    if (!institutionId) return;

    try {
      const { data, error } = await db
        .from('admin_activity_log')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  // Fetch anomalies
  const fetchAnomalies = async () => {
    try {
      const { data, error } = await db
        .from('transaction_anomalies')
        .select('*, user:auth.users!user_id(email)')
        .eq('reviewed', false)
        .order('severity', { ascending: false })
        .order('detection_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAnomalies(data || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin && institutionId) {
      fetchPendingApprovals();
      fetchFlaggedUsers();
      fetchRecentActivity();
      fetchAnomalies();
    }
  }, [isAdmin, institutionId]);

  // Approve or reject teacher
  const processApproval = async (
    teacherId: string,
    status: TeacherApprovalStatus,
    reason?: string
  ): Promise<boolean> => {
    if (!user || !isAdmin || !institutionId) {
      toast.error('Unauthorized action');
      return false;
    }

    setProcessing(true);
    try {
      // Update approval status
      const { error } = await db
        .from('teacher_approvals')
        .update({
          approval_status: status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: status === 'rejected' ? reason : null,
          updated_at: new Date().toISOString(),
        })
        .eq('teacher_id', teacherId)
        .eq('institution_id', institutionId);

      if (error) throw error;

      // Log activity
      await logAdminActivity({
        action_type: `teacher_${status}`,
        target_user_id: teacherId,
        action_details: { reason },
      });

      toast.success(`Teacher ${status}`, {
        description: status === 'approved' 
          ? 'Teacher can now create seminars'
          : 'Teacher has been notified',
      });

      await fetchPendingApprovals();
      return true;
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error(error.message || 'Failed to process approval');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Suspend teacher
  const suspendTeacher = async (
    teacherId: string,
    reason: string,
      days: number
  ): Promise<boolean> => {
    if (!user || !isAdmin || !institutionId) {
      toast.error('Unauthorized action');
      return false;
    }

    setProcessing(true);
    try {
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + days);

      const { error } = await db
        .from('teacher_approvals')
        .update({
          approval_status: 'suspended',
          suspension_reason: reason,
          suspended_until: suspendedUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('teacher_id', teacherId)
        .eq('institution_id', institutionId);

      if (error) throw error;

      await logAdminActivity({
        action_type: 'teacher_suspended',
        target_user_id: teacherId,
        action_details: { reason, days },
      });

      toast.success(`Teacher suspended for ${days} days`);
      await fetchFlaggedUsers();
      return true;
    } catch (error: any) {
      console.error('Error suspending teacher:', error);
      toast.error('Failed to suspend teacher');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Flag user for review
  const flagForReview = async (teacherId: string, reason: string): Promise<boolean> => {
    if (!user || !isAdmin || !institutionId) {
      toast.error('Unauthorized action');
      return false;
    }

    try {
      const { error } = await db
        .from('teacher_approvals')
        .update({
          flagged_for_review: true,
          flag_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('teacher_id', teacherId)
        .eq('institution_id', institutionId);

      if (error) throw error;

      await logAdminActivity({
        action_type: 'user_flagged',
        target_user_id: teacherId,
        action_details: { reason },
      });

      toast.success('User flagged for review');
      return true;
    } catch (error: any) {
      console.error('Error flagging user:', error);
      toast.error('Failed to flag user');
      return false;
    }
  };

  // Resolve anomaly
  const resolveAnomaly = async (
    anomalyId: string,
    resolution: string
  ): Promise<boolean> => {
    if (!user || !isAdmin) {
      toast.error('Unauthorized action');
      return false;
    }

    try {
      const { error } = await db
        .from('transaction_anomalies')
        .update({
          reviewed: true,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: resolution,
          action_taken: 'resolved',
        })
        .eq('id', anomalyId);

      if (error) throw error;

      toast.success('Anomaly resolved');
      await fetchAnomalies();
      return true;
    } catch (error: any) {
      console.error('Error resolving anomaly:', error);
      toast.error('Failed to resolve anomaly');
      return false;
    }
  };

  // Log admin activity
  const logAdminActivity = async (activity: {
    action_type: string;
    target_user_id?: string;
    action_details?: any;
  }) => {
    if (!user || !institutionId) return;

    try {
      await db.from('admin_activity_log').insert({
        admin_id: user.id,
        institution_id: institutionId,
        ...activity,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Get dashboard stats
  const getDashboardStats = () => {
    return {
      pending_approvals: pendingApprovals.length,
      flagged_users: flaggedUsers.length,
      unresolved_anomalies: anomalies.filter(a => !a.reviewed).length,
      recent_actions: recentActivity.length,
    };
  };

  return {
    isAdmin,
    adminRole,
    institutionId,
    loading,
    processing,
    pendingApprovals,
    flaggedUsers,
    recentActivity,
    anomalies,
    processApproval,
    suspendTeacher,
    flagForReview,
    resolveAnomaly,
    getDashboardStats,
    refresh: () => {
      fetchPendingApprovals();
      fetchFlaggedUsers();
      fetchRecentActivity();
      fetchAnomalies();
    },
  };
}
