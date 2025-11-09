import { supabaseAdmin } from '@/lib/supabase/client';

interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  userId?: string;
}

/**
 * Send an email using SendGrid (or mock if not configured)
 *
 * To enable real emails:
 * 1. Sign up at https://sendgrid.com
 * 2. Get your API key
 * 3. Add to .env.local: SENDGRID_API_KEY=your_key_here
 * 4. npm install @sendgrid/mail
 * 5. Uncomment the real implementation below
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, htmlBody, textBody, userId } = options;

  try {
    // Check if SendGrid is configured
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;

    if (hasSendGrid) {
      // REAL IMPLEMENTATION (uncomment when ready):
      //
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      //
      // const msg = {
      //   to,
      //   from: process.env.SENDGRID_FROM_EMAIL || 'noreply@medharmony.com',
      //   subject,
      //   text: textBody || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      //   html: htmlBody,
      // };
      //
      // const response = await sgMail.send(msg);
      //
      // // Log to database
      // await supabaseAdmin.from('communication_log').insert({
      //   user_id: userId || null,
      //   communication_type: 'email',
      //   recipient: to,
      //   subject,
      //   message: htmlBody,
      //   status: 'sent',
      //   provider: 'sendgrid',
      //   provider_response: JSON.stringify(response),
      // });
      //
      // return { success: true, messageId: response[0]?.headers['x-message-id'] };

      console.log('⚠️ SendGrid API key found but real implementation is commented out');
      console.log('📧 Uncomment the code in lib/notifications/email.ts to enable real emails');
    }

    // MOCK IMPLEMENTATION (for demo/testing)
    console.log('\n' + '='.repeat(80));
    console.log('📧 MOCK EMAIL SENT (add SENDGRID_API_KEY to .env.local for real emails)');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`\nHTML Body:\n${htmlBody}`);
    if (textBody) {
      console.log(`\nText Body:\n${textBody}`);
    }
    console.log('='.repeat(80) + '\n');

    // Log mock email to database for debugging/demo
    await supabaseAdmin.from('communication_log').insert({
      user_id: userId || null,
      communication_type: 'email',
      recipient: to,
      subject,
      message: htmlBody,
      status: 'mock',
      provider: 'mock',
      provider_response: JSON.stringify({ note: 'Mock email - not actually sent' }),
    });

    return { success: true, messageId: `mock-${Date.now()}` };

  } catch (error: any) {
    console.error('❌ Email send error:', error);

    // Log error to database
    await supabaseAdmin.from('communication_log').insert({
      user_id: userId || null,
      communication_type: 'email',
      recipient: to,
      subject,
      message: htmlBody,
      status: 'failed',
      provider: process.env.SENDGRID_API_KEY ? 'sendgrid' : 'mock',
      error_message: error.message,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email template
 */
export function generateEmailTemplate(params: {
  title: string;
  preheader?: string;
  body: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  const { title, preheader, body, actionUrl, actionText } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${preheader ? `<style>
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
  </style>` : ''}
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  ${preheader ? `<span class="preheader">${preheader}</span>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #002C5F 0%, #004080 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">MedHarmony</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Healthcare Scheduling Made Simple</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">${title}</h2>
              <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${body}
              </div>

              ${actionUrl && actionText ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #008080 0%, #006666 100%); color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 16px;">${actionText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This email was sent by MedHarmony Command Center<br>
                <a href="#" style="color: #008080; text-decoration: none;">Manage Notification Preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
