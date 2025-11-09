import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { orderId, patientId, providerId, orderTitle, reason } = await request.json();

    if (!orderId || !patientId || !providerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get patient name
    const { data: patient } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', patientId)
      .single();

    const patientName = patient?.full_name || 'Patient';

    // Create notification for provider
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: providerId,
        notification_type: 'patient_call_request',
        title: '📞 Patient Requesting Call Back',
        message: `${patientName} is requesting a phone call to help schedule their ${orderTitle}. ${reason ? `Reason: ${reason}` : 'They need assistance with scheduling.'}`,
        priority: 'high',
        is_read: false,
        related_order_id: orderId,
        action_url: `/provider`,
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

    // Also create confirmation notification for patient
    const { error: confirmError } = await supabase
      .from('notifications')
      .insert({
        user_id: patientId,
        notification_type: 'call_request_confirmation',
        title: '✅ Call Request Received',
        message: `Your call request for ${orderTitle} has been sent to your provider. They will contact you soon to help schedule your appointment.`,
        priority: 'normal',
        is_read: false,
        related_order_id: orderId,
      });

    if (confirmError) {
      console.error('Error creating confirmation:', confirmError);
      // Don't fail the request, provider notification was successful
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Call request sent successfully!',
    });

  } catch (error: any) {
    console.error('Call request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request call' },
      { status: 500 }
    );
  }
}
