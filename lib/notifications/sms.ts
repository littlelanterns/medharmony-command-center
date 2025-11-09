import { supabaseAdmin } from '@/lib/supabase/client';

interface SMSOptions {
  to: string;
  message: string;
  userId?: string;
}

/**
 * Send an SMS using Twilio (or mock if not configured)
 *
 * To enable real SMS:
 * 1. Sign up at https://twilio.com
 * 2. Get your Account SID, Auth Token, and Phone Number
 * 3. Add to .env.local:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=your_twilio_number
 * 4. npm install twilio
 * 5. Uncomment the real implementation below
 */
export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, message, userId } = options;

  try {
    // Check if Twilio is configured
    const hasTwilio = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );

    if (hasTwilio) {
      // REAL IMPLEMENTATION (uncomment when ready):
      //
      // const twilio = require('twilio');
      // const client = twilio(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // );
      //
      // const response = await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: to,
      // });
      //
      // // Log to database
      // await supabaseAdmin.from('communication_log').insert({
      //   user_id: userId || null,
      //   communication_type: 'sms',
      //   recipient: to,
      //   message,
      //   status: 'sent',
      //   provider: 'twilio',
      //   provider_response: JSON.stringify(response),
      // });
      //
      // return { success: true, messageId: response.sid };

      console.log('⚠️ Twilio credentials found but real implementation is commented out');
      console.log('📱 Uncomment the code in lib/notifications/sms.ts to enable real SMS');
    }

    // MOCK IMPLEMENTATION (for demo/testing)
    console.log('\n' + '='.repeat(80));
    console.log('📱 MOCK SMS SENT (add Twilio credentials to .env.local for real SMS)');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Message:\n${message}`);
    console.log('='.repeat(80) + '\n');

    // Log mock SMS to database for debugging/demo
    await supabaseAdmin.from('communication_log').insert({
      user_id: userId || null,
      communication_type: 'sms',
      recipient: to,
      message,
      status: 'mock',
      provider: 'mock',
      provider_response: JSON.stringify({ note: 'Mock SMS - not actually sent' }),
    });

    return { success: true, messageId: `mock-sms-${Date.now()}` };

  } catch (error: any) {
    console.error('❌ SMS send error:', error);

    // Log error to database
    await supabaseAdmin.from('communication_log').insert({
      user_id: userId || null,
      communication_type: 'sms',
      recipient: to,
      message,
      status: 'failed',
      provider: process.env.TWILIO_ACCOUNT_SID ? 'twilio' : 'mock',
      error_message: error.message,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Format SMS message with character limit awareness
 * SMS messages should be concise (160 chars for single segment)
 */
export function formatSMSMessage(params: {
  title: string;
  body: string;
  actionUrl?: string;
}): string {
  const { title, body, actionUrl } = params;

  let message = `MedHarmony: ${title}\n\n${body}`;

  if (actionUrl) {
    message += `\n\n${actionUrl}`;
  }

  // If message is too long, truncate body
  if (message.length > 320) {
    const maxBodyLength = 320 - title.length - (actionUrl ? actionUrl.length : 0) - 20;
    const truncatedBody = body.substring(0, maxBodyLength) + '...';
    message = `MedHarmony: ${title}\n\n${truncatedBody}`;
    if (actionUrl) {
      message += `\n\n${actionUrl}`;
    }
  }

  return message;
}

/**
 * Validate phone number format (basic validation)
 * For production, use libphonenumber-js for proper validation
 */
export function validatePhoneNumber(phone: string): { valid: boolean; formatted?: string; error?: string } {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if it's a valid length (10-15 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      valid: false,
      error: 'Phone number must be 10-15 digits',
    };
  }

  // Format as E.164 (international format)
  let formatted = '+' + digitsOnly;

  // If starts with 1 and is 11 digits, it's likely US/Canada
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    formatted = '+' + digitsOnly;
  }
  // If 10 digits, assume US/Canada and add +1
  else if (digitsOnly.length === 10) {
    formatted = '+1' + digitsOnly;
  }

  return {
    valid: true,
    formatted,
  };
}
