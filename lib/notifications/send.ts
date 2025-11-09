import { supabaseAdmin } from '@/lib/supabase/client';
import { sendEmail, generateEmailTemplate } from './email';
import { sendSMS, formatSMSMessage } from './sms';

interface NotificationOptions {
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  // Channel overrides (if not specified, will check user preferences)
  sendInApp?: boolean;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

interface NotificationResult {
  inApp: { success: boolean; id?: string };
  email?: { success: boolean; messageId?: string; error?: string };
  sms?: { success: boolean; messageId?: string; error?: string };
}

/**
 * Unified notification sender
 * Handles in-app, email, and SMS based on user preferences
 */
export async function sendNotification(options: NotificationOptions): Promise<NotificationResult> {
  const {
    userId,
    notificationType,
    title,
    message,
    priority = 'medium',
    actionUrl,
    actionText,
  } = options;

  const result: NotificationResult = {
    inApp: { success: false },
  };

  try {
    // Get user data
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, phone_number, email_notifications_enabled, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('User not found:', userId);
      return result;
    }

    // Get notification preferences for this type
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('send_in_app, send_email, send_sms')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .single();

    // Determine which channels to use
    const shouldSendInApp = options.sendInApp ?? prefs?.send_in_app ?? true;
    const shouldSendEmail = options.sendEmail ?? (prefs?.send_email && user.email_notifications_enabled) ?? false;
    const shouldSendSMS = options.sendSMS ?? (prefs?.send_sms && user.sms_notifications_enabled) ?? false;

    // 1. Create in-app notification
    if (shouldSendInApp) {
      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          title,
          message,
          priority,
          action_url: actionUrl,
          is_read: false,
        })
        .select()
        .single();

      if (!error && notification) {
        result.inApp = { success: true, id: notification.id };
      }
    }

    // 2. Send email if enabled
    if (shouldSendEmail && user.email) {
      const htmlBody = generateEmailTemplate({
        title,
        preheader: message.substring(0, 100),
        body: message.replace(/\n/g, '<br>'),
        actionUrl,
        actionText,
      });

      const emailResult = await sendEmail({
        to: user.email,
        subject: `MedHarmony: ${title}`,
        htmlBody,
        userId,
      });

      result.email = emailResult;
    }

    // 3. Send SMS if enabled
    if (shouldSendSMS && user.phone_number) {
      const smsMessage = formatSMSMessage({
        title,
        body: message,
        actionUrl,
      });

      const smsResult = await sendSMS({
        to: user.phone_number,
        message: smsMessage,
        userId,
      });

      result.sms = smsResult;
    }

    return result;

  } catch (error) {
    console.error('Error sending notification:', error);
    return result;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  options: Omit<NotificationOptions, 'userId'>
): Promise<Record<string, NotificationResult>> {
  const results: Record<string, NotificationResult> = {};

  // Send in parallel for better performance
  await Promise.all(
    userIds.map(async (userId) => {
      results[userId] = await sendNotification({ ...options, userId });
    })
  );

  return results;
}

/**
 * Notification templates for common scenarios
 */
export const notificationTemplates = {
  cancellationAlert: (params: { appointmentTime: string; orderTitle: string; orderId: string }) => ({
    notificationType: 'cancellation_alert',
    title: 'Appointment Slot Available!',
    message: `A ${params.orderTitle} appointment just became available at ${params.appointmentTime}. You're eligible to claim it! This opportunity expires in 2 hours.`,
    priority: 'high' as const,
    actionUrl: `/patient/orders/${params.orderId}`,
    actionText: 'Claim This Slot',
  }),

  appointmentConfirmed: (params: { appointmentTime: string; location: string }) => ({
    notificationType: 'appointment_confirmed',
    title: 'Appointment Confirmed',
    message: `Your appointment on ${params.appointmentTime} at ${params.location} has been confirmed. We look forward to seeing you!`,
    priority: 'medium' as const,
  }),

  appointmentBooked: (params: { patientName: string; appointmentTime: string; orderTitle: string }) => ({
    notificationType: 'appointment_booked',
    title: 'New Appointment Booked',
    message: `${params.patientName} has booked an appointment for ${params.orderTitle} on ${params.appointmentTime}.`,
    priority: 'medium' as const,
  }),

  timeBlockNotification: (params: { providerName: string; appointmentTime: string; orderId: string }) => ({
    notificationType: 'time_block_notification',
    title: 'Appointment Needs Rescheduling',
    message: `Dr. ${params.providerName} is unavailable on ${params.appointmentTime}. Please reschedule your appointment at your earliest convenience. No karma penalty will be applied.`,
    priority: 'high' as const,
    actionUrl: `/patient/orders/${params.orderId}?autoSchedule=true`,
    actionText: 'Reschedule Now',
  }),

  orderCreated: (params: { orderTitle: string; providerName: string; orderId: string }) => ({
    notificationType: 'order_created',
    title: 'New Order Created',
    message: `Dr. ${params.providerName} has created a new order for you: ${params.orderTitle}. Please review the prerequisites and schedule your appointment.`,
    priority: 'medium' as const,
    actionUrl: `/patient/orders/${params.orderId}`,
    actionText: 'View Order',
  }),

  reminder: (params: { appointmentTime: string; location: string; prerequisites?: string[] }) => {
    const prereqText = params.prerequisites?.length
      ? `\n\nReminders:\n${params.prerequisites.map(p => `• ${p}`).join('\n')}`
      : '';

    return {
      notificationType: 'reminder',
      title: 'Upcoming Appointment Reminder',
      message: `This is a reminder of your appointment on ${params.appointmentTime} at ${params.location}.${prereqText}`,
      priority: 'medium' as const,
    };
  },
};
