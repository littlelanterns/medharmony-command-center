import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { orderId, patientId, nudgeType, orderTitle } = await request.json();

    if (!orderId || !patientId || !nudgeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Define nudge messages based on type
    const nudgeMessages: Record<string, { title: string; message: string; type: string }> = {
      reminder: {
        title: '🔔 Appointment Reminder',
        message: `This is a friendly reminder to schedule your ${orderTitle}. Early scheduling helps ensure you get your preferred time slot.`,
        type: 'appointment_reminder',
      },
      encouragement: {
        title: '💪 Your Health Matters',
        message: `Scheduling your ${orderTitle} is an important step in taking care of your health. We're here to support you every step of the way!`,
        type: 'health_encouragement',
      },
      karma: {
        title: '⭐ Priority Scheduling Available',
        message: `Good news! We've boosted your priority for scheduling ${orderTitle}. You now have access to preferred time slots. Schedule soon to take advantage of this opportunity!`,
        type: 'karma_boost',
      },
      help_offer: {
        title: '🤝 Need Help Scheduling?',
        message: `We noticed you haven't scheduled your ${orderTitle} yet. Would you like assistance? You can use the AI scheduler in your patient portal, or click below to request a call from our scheduling team.`,
        type: 'scheduling_help_offer',
      },
    };

    const nudge = nudgeMessages[nudgeType];
    if (!nudge) {
      return NextResponse.json(
        { error: 'Invalid nudge type' },
        { status: 400 }
      );
    }

    // Determine priority based on nudge type
    const priority = nudgeType === 'karma' ? 'high' : nudgeType === 'help_offer' ? 'normal' : 'low';

    // Create notification for patient
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: patientId,
        notification_type: nudge.type,
        title: nudge.title,
        message: nudge.message,
        priority: priority,
        is_read: false,
        related_order_id: orderId,
        action_url: `/patient/orders/${orderId}`,
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // If karma boost, actually update the patient's karma score
    if (nudgeType === 'karma') {
      const { error: karmaError } = await supabase
        .from('patient_profiles')
        .update({
          karma_score: supabase.rpc('increment_karma', { user_id: patientId, points: 5 }),
        })
        .eq('id', patientId);

      if (karmaError) {
        console.error('Error updating karma:', karmaError);
        // Don't fail the request, just log it
      }
    }

    return NextResponse.json({
      success: true,
      notification,
      message: `${nudge.title} sent successfully!`,
    });

  } catch (error: any) {
    console.error('Send nudge error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send nudge' },
      { status: 500 }
    );
  }
}
