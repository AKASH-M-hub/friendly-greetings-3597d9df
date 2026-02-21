# Edge Functions Deployment Guide

## Prerequisites

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Deploy Edge Functions

### 1. Deploy send-otp function

```bash
cd supabase/functions
supabase functions deploy send-otp --no-verify-jwt
```

### 2. Deploy verify-otp function

```bash
supabase functions deploy verify-otp --no-verify-jwt
```

## Configure Environment Variables

### Option A: Via Supabase Dashboard

1. Go to **Project Settings** → **Edge Functions**
2. Select the function (`send-otp` or `verify-otp`)
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Email/SMS service credentials (see `.env.example`)

### Option B: Via CLI

```bash
# Set secrets for send-otp
supabase secrets set --env-file supabase/functions/.env

# Or individual secrets
supabase secrets set SENDGRID_API_KEY=your_key
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
```

## Integrate Email/SMS Services

### SendGrid (Email)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Uncomment the SendGrid code in `send-otp/index.ts`
4. Set environment variable:
   ```bash
   supabase secrets set SENDGRID_API_KEY=your_key
   ```

### Twilio (SMS)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and phone number
3. Uncomment the Twilio code in `send-otp/index.ts`
4. Set environment variables:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_token
   supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
   ```

### AWS SES (Email Alternative)

```typescript
// In send-otp/index.ts, replace SendGrid code with:
const aws = await import('https://deno.land/x/aws_api@v0.8.1/client/mod.ts');
const ses = new aws.SES({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});

await ses.sendEmail({
  Source: 'noreply@yourdomain.com',
  Destination: { ToAddresses: [contact] },
  Message: {
    Subject: { Data: 'Your Verification Code' },
    Body: {
      Text: { Data: `Your verification code is: ${otp}. Valid for 10 minutes.` }
    }
  }
});
```

## Test Edge Functions

### Test send-otp

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "contact": "user@example.com",
    "userId": "uuid-here"
  }'
```

### Test verify-otp

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "code": "123456",
    "userId": "uuid-here"
  }'
```

## Update React Hooks

The hooks (`useIdentityVerification.ts`) already have the function calls configured:

```typescript
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: { type, contact, userId: user.id }
});
```

Make sure your Supabase client is initialized with the correct project URL.

## Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs send-otp --follow
supabase functions logs verify-otp --follow
```

### Via Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Select function
3. View **Invocations** and **Logs** tabs

## Security Checklist

- ✅ RLS policies enabled on `otp_codes` and `identity_verification` tables
- ✅ Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- ✅ CORS headers configured for your domain
- ✅ OTP expires after 10 minutes
- ✅ Maximum 5 verification attempts
- ✅ Environment variables secured via Supabase Secrets

## Troubleshooting

### "No pending OTP found"
- Check if OTP was created in `otp_codes` table
- Verify `user_id` and `otp_type` match

### "OTP has expired"
- OTPs expire after 10 minutes
- User needs to request a new OTP

### Email/SMS not sending
- Check service credentials in environment variables
- Review Edge Function logs for API errors
- Verify service account has sufficient credits/quota

### CORS errors
- Update `corsHeaders` in Edge Functions to match your domain
- For production: `'Access-Control-Allow-Origin': 'https://yourdomain.com'`

## Development Mode

For local testing without deploying:

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve send-otp --env-file supabase/functions/.env
```

Test against local endpoint: `http://localhost:54321/functions/v1/send-otp`
