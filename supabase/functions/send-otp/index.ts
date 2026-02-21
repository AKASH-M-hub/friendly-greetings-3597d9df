// @ts-nocheck
// Send OTP Edge Function
// Handles email/mobile OTP generation and delivery

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  type: 'email' | 'mobile' | 'institutional';
  contact: string;
  userId: string;
  otp_type?: 'email' | 'mobile' | 'institutional';
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: OTPRequest = await req.json();
    const type = payload.type || payload.otp_type;
    const contact = payload.contact;
    const userId = payload.userId || payload.user_id;

    // Validate input
    if (!type || !contact || !userId) {
      throw new Error('Missing required fields: type, contact, userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = otp;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabase.from('otp_codes').insert({
      user_id: userId,
      otp_type: type,
      otp_code: otp,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to store OTP: ${insertError.message}`);
    }

    // Send OTP based on type
    if (type === 'email') {
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`[MOCK] Sending email OTP to ${contact}: ${otp}`);
      
      // Example SendGrid integration:
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: contact }] }],
          from: { email: 'noreply@yourdomain.com' },
          subject: 'Your Verification Code',
          content: [{
            type: 'text/plain',
            value: `Your verification code is: ${otp}. Valid for 10 minutes.`
          }]
        })
      });
      */
    } else if (type === 'mobile') {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`[MOCK] Sending SMS OTP to ${contact}: ${otp}`);
      
      // Example Twilio integration:
      /*
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(
              `${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`
            )}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact,
            From: Deno.env.get('TWILIO_PHONE_NUMBER')!,
            Body: `Your verification code is: ${otp}. Valid for 10 minutes.`
          })
        }
      );
      */
    } else if (type === 'institutional') {
      // TODO: Integrate with institutional email system
      console.log(`[MOCK] Sending institutional email to ${contact}: ${otp}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 600, // seconds
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
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
