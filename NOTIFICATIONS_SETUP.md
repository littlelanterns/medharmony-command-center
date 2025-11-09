# Email & SMS Notifications Setup Guide

This guide explains how to enable **real** email and SMS notifications in MedHarmony Command Center.

## Current Status: Mock Mode

By default, the application runs in **mock mode** for email/SMS:
- ✅ In-app notifications work immediately
- 📧 Email notifications are logged to console (not sent)
- 📱 SMS notifications are logged to console (not sent)
- 📊 All mock communications are logged to `communication_log` table

This lets you develop and demo the full notification system without needing external API keys.

---

## Enable Real Email Notifications

### Option 1: SendGrid (Recommended)

SendGrid is a reliable email service with a generous free tier (100 emails/day).

#### Step 1: Sign Up
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Create a free account
3. Verify your email address

#### Step 2: Get API Key
1. In SendGrid dashboard, go to **Settings → API Keys**
2. Click **Create API Key**
3. Name it "MedHarmony Production"
4. Select **Full Access** (or at minimum: Mail Send access)
5. Click **Create & View**
6. **Copy the API key immediately** (it won't be shown again)

#### Step 3: Verify Sender Email
1. Go to **Settings → Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details (use your real email)
4. Verify the email SendGrid sends you

#### Step 4: Configure Application
Add to `.env.local`:
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com  # Use the email you verified
```

#### Step 5: Install Package
```bash
npm install @sendgrid/mail
```

#### Step 6: Enable Real Implementation
1. Open `lib/notifications/email.ts`
2. Find the comment `// REAL IMPLEMENTATION (uncomment when ready):`
3. Uncomment lines 16-34 (the real SendGrid code)
4. Comment out or remove the mock implementation (lines 41-58)

#### Step 7: Restart Server
```bash
# Kill the current dev server (Ctrl+C)
npm run dev
```

**That's it!** Emails will now be sent for real via SendGrid.

---

### Option 2: Other Email Services

You can also use:
- **AWS SES** - Very cheap for high volume
- **Mailgun** - Good developer experience
- **Postmark** - Focused on transactional emails

Just modify `lib/notifications/email.ts` to use their respective Node.js SDKs.

---

## Enable Real SMS Notifications

### Twilio Setup

Twilio provides SMS capabilities with a free trial ($15.50 credit).

#### Step 1: Sign Up
1. Go to [https://twilio.com](https://twilio.com)
2. Sign up for a free account
3. Verify your phone number

#### Step 2: Get a Phone Number
1. In Twilio Console, click **Get a Trial Number**
2. Accept the number or choose a different one
3. Note down the phone number (format: +1234567890)

#### Step 3: Get Credentials
1. In Twilio Console dashboard, find:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
2. Copy both values

#### Step 4: Configure Application
Add to `.env.local`:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your Twilio number
```

#### Step 5: Install Package
```bash
npm install twilio
```

#### Step 6: Enable Real Implementation
1. Open `lib/notifications/sms.ts`
2. Find the comment `// REAL IMPLEMENTATION (uncomment when ready):`
3. Uncomment lines 25-47 (the real Twilio code)
4. Comment out or remove the mock implementation (lines 54-71)

#### Step 7: Restart Server
```bash
# Kill the current dev server (Ctrl+C)
npm run dev
```

**SMS notifications are now live!**

---

## Testing Notifications

### 1. Enable Notifications for Your User

1. Go to **Patient Dashboard → Notification Settings**
2. Toggle on **Email Notifications** and/or **SMS Notifications**
3. If SMS enabled, enter your phone number
4. Save settings

### 2. Trigger a Test Notification

#### Option A: Book an Appointment
1. As a patient, go to an unscheduled order
2. Click "Let AI Schedule This"
3. Book one of the suggested times
4. **Result:** Provider receives notification

#### Option B: Cancel an Appointment (for marketplace)
1. As a patient, go to a scheduled appointment
2. Click "Cancel Appointment"
3. **Result:** High-karma patients receive alerts

#### Option C: Provider Blocks Time
1. As a provider, go to **Availability Management**
2. Click **Block Time**
3. Select a date range that affects existing appointments
4. **Result:** Affected patients receive notifications

### 3. Check Console Logs

With mock mode, you'll see:
```
================================================================================
📧 MOCK EMAIL SENT (add SENDGRID_API_KEY to .env.local for real emails)
================================================================================
To: patient@example.com
Subject: MedHarmony: New Appointment Booked
...
```

With real mode, you'll see:
```
✅ Email sent successfully via SendGrid
✅ SMS sent successfully via Twilio
```

---

## Database Migration

The notification system requires migration `008_notification_preferences.sql`:

```sql
-- Run in Supabase SQL Editor
-- This adds phone number and notification preference fields
```

To apply:
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/migrations/008_notification_preferences.sql`
3. Click **Run**

This creates:
- ✅ `phone_number`, `email_notifications_enabled`, `sms_notifications_enabled` columns on `users`
- ✅ `notification_preferences` table for granular control
- ✅ `communication_log` table for tracking sent messages

---

## Troubleshooting

### Emails Not Sending

**Check these:**
1. ✅ `SENDGRID_API_KEY` is in `.env.local` and starts with `SG.`
2. ✅ Sender email is verified in SendGrid
3. ✅ You uncommented the real implementation code
4. ✅ You installed `@sendgrid/mail` package
5. ✅ You restarted the dev server after changes
6. ✅ Check console for error messages

**Common Issues:**
- **"Unauthorized"**: Wrong API key or it expired
- **"Sender not verified"**: Verify your sender email in SendGrid
- **"Daily limit exceeded"**: Free tier is 100/day, wait 24hrs or upgrade

### SMS Not Sending

**Check these:**
1. ✅ All three Twilio variables are in `.env.local`
2. ✅ Phone number format is E.164 (+1234567890)
3. ✅ You uncommented the real implementation code
4. ✅ You installed `twilio` package
5. ✅ You restarted the dev server
6. ✅ For trial accounts, recipient must be verified in Twilio

**Common Issues:**
- **"Not a valid phone number"**: Use E.164 format (+country code + number)
- **"Unverified number"**: For trial accounts, verify recipient in Twilio Console
- **"Insufficient balance"**: Add credits to your Twilio account

### No Notifications at All

1. Check user preferences in database:
   ```sql
   SELECT * FROM users WHERE id = 'your-user-id';
   SELECT * FROM notification_preferences WHERE user_id = 'your-user-id';
   ```
2. Check if in-app notifications appear in bell icon
3. Check `communication_log` table for sent messages:
   ```sql
   SELECT * FROM communication_log ORDER BY created_at DESC LIMIT 10;
   ```

---

## Production Checklist

Before going live:

### Email
- [ ] SendGrid account verified and in good standing
- [ ] Sender domain authenticated (SPF, DKIM, DMARC)
- [ ] Real implementation code uncommented
- [ ] Email templates reviewed and branded
- [ ] Unsubscribe links added (required by law)
- [ ] Test sending to various email providers (Gmail, Outlook, etc.)

### SMS
- [ ] Twilio account upgraded from trial
- [ ] SMS compliance verified (A2P 10DLC for US)
- [ ] Phone number verified and approved
- [ ] Message templates approved by Twilio (if required)
- [ ] Opt-out mechanism implemented (STOP keyword)
- [ ] Test sending to various carriers

### Legal
- [ ] Privacy policy updated to mention email/SMS
- [ ] Terms of service include notification policies
- [ ] Users can opt-out of all non-essential notifications
- [ ] CAN-SPAM compliance (for emails)
- [ ] TCPA compliance (for SMS, especially in US)

---

## Cost Estimates

### SendGrid Pricing
- **Free Tier**: 100 emails/day forever
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

### Twilio Pricing
- **Free Trial**: $15.50 credit
- **SMS**: ~$0.0075 per message (US)
- **Monthly**: No minimum, pay-as-you-go
- Estimate: 1,000 SMS = ~$7.50

### Recommended Starting Point
- Use free tiers for development/testing
- Monitor usage in first month
- Upgrade when needed (usually around 100 users)

---

## Alternative: Mock Mode for Demo

If you want to demo the notification system without API keys:

1. Keep mock mode enabled (default)
2. Show the console logs during demo
3. Show the `communication_log` table in Supabase
4. Explain: "In production, this would send real emails/SMS"

The mock implementation is production-quality code—it just logs instead of sending. Switching to real is literally 3 lines of code to uncomment.

---

## Support

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Twilio Docs**: https://www.twilio.com/docs
- **Code Location**:
  - Email: `lib/notifications/email.ts`
  - SMS: `lib/notifications/sms.ts`
  - Unified Sender: `lib/notifications/send.ts`

For issues specific to MedHarmony, check the communication logs:
```sql
SELECT * FROM communication_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```
