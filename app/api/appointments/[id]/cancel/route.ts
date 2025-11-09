import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { matchCancellationWithPatients } from '@/lib/cancellation-matcher';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    // 1. Get appointment details
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*, patient_id, scheduled_start, order_id')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 2. Calculate hours until appointment
    const now = new Date();
    const appointmentTime = new Date(appointment.scheduled_start);
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 3. Calculate karma adjustment
    let karmaChange = 0;
    let reason = '';

    if (hoursUntil >= 72) {
      karmaChange = 5;
      reason = 'Cancelled with 72+ hours notice';
    } else if (hoursUntil >= 24) {
      karmaChange = 2;
      reason = 'Cancelled with 24-72 hours notice';
    } else if (hoursUntil >= 2) {
      karmaChange = -3;
      reason = 'Late cancellation (less than 24hrs)';
    } else {
      karmaChange = -10;
      reason = 'Very late cancellation (less than 2hrs)';
    }

    // 4. Update appointment status
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // 5. Update order status back to unscheduled
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'unscheduled' })
      .eq('id', appointment.order_id);

    if (orderError) throw orderError;

    // 6. Adjust karma
    const { error: karmaError } = await supabaseAdmin.rpc('adjust_karma', {
      p_patient_id: appointment.patient_id,
      p_points: karmaChange
    });

    if (karmaError) {
      console.error('Karma adjustment error:', karmaError);
      // Continue even if karma fails - don't block cancellation
    }

    // 7. Log karma history
    const { error: historyError } = await supabaseAdmin
      .from('karma_history')
      .insert({
        patient_id: appointment.patient_id,
        action_type: 'cancelled_appointment',
        points_change: karmaChange,
        related_appointment_id: appointmentId,
        description: reason
      });

    if (historyError) {
      console.error('Karma history error:', historyError);
      // Continue even if history fails
    }

    // 8. Create cancellation alert record
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const { error: alertError } = await supabaseAdmin
      .from('cancellation_alerts')
      .insert({
        cancelled_appointment_id: appointmentId,
        original_patient_id: appointment.patient_id,
        notified_patient_id: appointment.patient_id, // Will update with matches
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (alertError) {
      console.error('Cancellation alert error:', alertError);
      // Continue even if alert fails
    }

    // 9. Trigger matching - find patients who want this slot
    try {
      await matchCancellationWithPatients(appointment);
      console.log('✓ Cancellation matching completed');
    } catch (matchError) {
      console.error('Matching failed (non-fatal):', matchError);
      // Continue even if matching fails - cancellation still succeeded
    }

    return NextResponse.json({
      success: true,
      karmaChange,
      reason,
      hoursNotice: Math.round(hoursUntil)
    });

  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
