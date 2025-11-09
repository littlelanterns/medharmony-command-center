import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, orderId, patientId } = await request.json();

    if (!appointmentId || !orderId || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Get cancelled appointment details
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify appointment is cancelled
    if (appointment.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is not available' },
        { status: 400 }
      );
    }

    // 2. Update appointment with new patient
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({
        patient_id: patientId,
        order_id: orderId,
        status: 'scheduled'
      })
      .eq('id', appointmentId);

    if (updateError) {
      throw updateError;
    }

    // 3. Update order status
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'scheduled' })
      .eq('id', orderId);

    if (orderError) {
      throw orderError;
    }

    // 4. Award karma (+5 for claiming)
    const { error: karmaError } = await supabaseAdmin.rpc('adjust_karma', {
      p_patient_id: patientId,
      p_points: 5
    });

    if (karmaError) {
      console.error('Karma adjustment error:', karmaError);
      // Continue even if karma fails
    }

    // 5. Log karma
    const { error: historyError } = await supabaseAdmin
      .from('karma_history')
      .insert({
        patient_id: patientId,
        action_type: 'claimed_cancellation',
        points_change: 5,
        related_appointment_id: appointmentId,
        description: 'Claimed cancelled slot'
      });

    if (historyError) {
      console.error('Karma history error:', historyError);
    }

    // 6. Mark cancellation alert as claimed
    const { error: alertError } = await supabaseAdmin
      .from('cancellation_alerts')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('cancelled_appointment_id', appointmentId);

    if (alertError) {
      console.error('Alert update error:', alertError);
    }

    // 7. Mark notification as read
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('related_appointment_id', appointmentId)
      .eq('user_id', patientId);

    if (notifError) {
      console.error('Notification update error:', notifError);
    }

    return NextResponse.json({
      success: true,
      karmaEarned: 5
    });

  } catch (error: any) {
    console.error('Error claiming slot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
