// =====================================================
// LAYER 1: IDENTITY VERIFICATION HOOK
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  IdentityVerification,
  VerificationLevel,
  OTPType,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from '@/types/security';
import { toast } from 'sonner';

export function useIdentityVerification() {
  const { user } = useAuth();
  const db = supabase as any;
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isSecuritySchemaError = (error: any) => {
    const code = error?.code;
    const status = error?.status;
    const message = String(error?.message || '').toLowerCase();
    return (
      code === '42P01' ||
      code === '42501' ||
      code === 'PGRST200' ||
      code === 'PGRST205' ||
      status === 404 ||
      message.includes('relation') ||
      message.includes('does not exist') ||
      message.includes('schema cache')
    );
  };

  // Build a synthetic verification object from Supabase Auth data
  // Used as fallback when the security schema tables are not yet created
  const buildAuthFallback = (): IdentityVerification => {
    const emailVerified = !!user?.email_confirmed_at;
    const mobileVerified = !!user?.phone;
    let level: VerificationLevel = 'unverified';
    if (emailVerified && mobileVerified) level = 'mobile_verified';
    else if (emailVerified) level = 'email_verified';

    return {
      id: `auth-${user?.id ?? 'unknown'}`,
      user_id: user?.id ?? '',
      email_verified: emailVerified,
      email_verified_at: user?.email_confirmed_at ?? undefined,
      email_otp_attempts: 0,
      mobile_number: user?.phone ?? undefined,
      mobile_verified: mobileVerified,
      mobile_otp_attempts: 0,
      institutional_verified: false,
      device_fingerprint: [],
      account_creation_timestamp: user?.created_at ?? new Date().toISOString(),
      verification_level: level,
      created_at: user?.created_at ?? new Date().toISOString(),
      updated_at: user?.updated_at ?? new Date().toISOString(),
    };
  };

  // Fetch identity verification status
  const fetchVerification = async () => {
    if (!user) {
      setVerification(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await db
        .from('identity_verification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isSecuritySchemaError(error)) {
          setVerification(buildAuthFallback());
          return;
        }
        throw error;
      }

      if (!data) {
        // Try to create initial record; if schema missing fall back to auth data
        const { data: newVerification, error: createError } = await db
          .from('identity_verification')
          .insert({
            user_id: user.id,
            verification_level: user.email_confirmed_at ? 'email_verified' : 'unverified',
            email_verified: !!user.email_confirmed_at,
          })
          .select()
          .single();

        if (createError) {
          setVerification(buildAuthFallback());
          return;
        }
        setVerification(newVerification);
      } else {
        setVerification(data);
      }
    } catch (error) {
      console.error('Error fetching verification:', error);
      setVerification(buildAuthFallback());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, [user]);

  // Send OTP
  const sendOTP = async (type: OTPType, contact: string) => {
    if (!user) {
      toast.error('Please sign in first');
      return false;
    }

    setSendingOTP(true);
    try {
      // Call Supabase Edge Function for OTP generation
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          userId: user.id,
          type,
          contact,
        },
      });

      if (error) throw error;

      toast.success(`OTP sent to your ${type}`, {
        description: 'Please check and enter the code',
      });

      return true;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP');
      return false;
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (otpCode: string, type: OTPType): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in first');
      return false;
    }

    setVerifying(true);
    try {
      // Call Supabase Edge Function for OTP verification
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          userId: user.id,
          code: otpCode,
          type,
        } as VerifyOTPRequest,
      });

      if (error) throw error;

      const response = data as VerifyOTPResponse;

      if (response.success) {
        toast.success('Verification successful!', {
          description: response.message,
        });
        
        // Refresh verification status
        await fetchVerification();
        return true;
      } else {
        toast.error('Verification failed', {
          description: response.message,
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Failed to verify OTP');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  // Verify institutional email
  const verifyInstitutionalEmail = async (email: string) => {
    if (!user) {
      toast.error('Please sign in first');
      return false;
    }

    try {
      const { error } = await db
        .from('identity_verification')
        .update({
          institutional_email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await sendOTP('institutional', email);
      return true;
    } catch (error: any) {
      console.error('Error setting institutional email:', error);
      toast.error('Failed to set institutional email');
      return false;
    }
  };

  // Log device fingerprint
  const logDeviceFingerprint = async (fingerprint: string, ipAddress?: string) => {
    if (!user) return;

    try {
      await db.from('device_logs').insert({
        user_id: user.id,
        device_fingerprint: fingerprint,
        ip_address: ipAddress || '0.0.0.0',
        user_agent: navigator.userAgent,
        suspicious: false,
      });

      // Update last device in verification
      await db
        .from('identity_verification')
        .update({
          last_device_fingerprint: fingerprint,
          last_login_ip: ipAddress,
          last_login_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error logging device:', error);
    }
  };

  // Check verification level
  const isVerified = (minimumLevel: VerificationLevel = 'email_verified'): boolean => {
    if (!verification) return false;

    const levels: VerificationLevel[] = [
      'unverified',
      'email_verified',
      'mobile_verified',
      'institutional_verified',
      'fully_verified',
    ];

    const currentIndex = levels.indexOf(verification.verification_level);
    const requiredIndex = levels.indexOf(minimumLevel);

    return currentIndex >= requiredIndex;
  };

  // Get verification progress
  const getVerificationProgress = () => {
    if (!verification) return 0;

    let progress = 0;
    if (verification.email_verified) progress += 25;
    if (verification.mobile_verified) progress += 25;
    if (verification.institutional_verified) progress += 25;
    if (verification.device_fingerprint.length > 0) progress += 25;

    return progress;
  };

  return {
    verification,
    loading,
    sendingOTP,
    verifying,
    sendOTP,
    verifyOTP,
    verifyInstitutionalEmail,
    logDeviceFingerprint,
    isVerified,
    getVerificationProgress,
    refresh: fetchVerification,
  };
}
