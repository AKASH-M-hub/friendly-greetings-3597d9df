// @ts-nocheck
// Verify OTP Edge Function
// Validates OTP codes and updates verification status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  type: 'email' | 'mobile' | 'institutional';
  code: string;
  userId: string;
  otp_type?: 'email' | 'mobile' | 'institutional';
  otp_code?: string;
  user_id?: string;
}

const MAX_ATTEMPTS = 5;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: VerifyOTPRequest = await req.json();
    const type = payload.type || payload.otp_type;
    const code = payload.code || payload.otp_code;
    const userId = payload.userId || payload.user_id;

    // Validate input
    if (!type || !code || !userId) {
      throw new Error('Missing required fields: type, code, userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the most recent OTP for this user and type
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('otp_type', type)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      throw new Error('No pending OTP found for verification');
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase
        .from('otp_codes')
        .update({ verified: false })
        .eq('id', otpRecord.id);

      throw new Error('OTP has expired. Please request a new code.');
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Verify OTP code
    const isValid = otpRecord.otp_code === code;

    if (!isValid) {
      // Increment attempts
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      throw new Error(
        `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Update identity verification record
    const updateField =
      type === 'email'
        ? { email_verified: true, email_verified_at: new Date().toISOString() }
        : type === 'mobile'
        ? { mobile_verified: true, mobile_verified_at: new Date().toISOString() }
        : { institutional_verified: true, institutional_verified_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('identity_verification')
      .update({ ...updateField, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update verification status:', updateError);
    }

    // Get updated verification status
    const { data: verification } = await supabase
      .from('identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate verification level
    let verificationLevel = 0;
    if (verification?.email_verified) verificationLevel++;
    if (verification?.mobile_verified) verificationLevel++;
    if (verification?.institutional_verified) verificationLevel++;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP verified successfully',
        verificationLevel,
        verification: {
          emailVerified: verification?.email_verified || false,
          mobileVerified: verification?.mobile_verified || false,
          institutionalVerified: verification?.institutional_verified || false,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
