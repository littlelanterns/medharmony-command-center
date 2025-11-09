import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

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

    // 3. Calculate karma adjustment (same as cancel)
    let karmaChange = 0;
    let reason = '';

    if (hoursUntil >= 72) {
      karmaChange = 5;
      reason = 'Rescheduled with 72+ hours notice';
    } else if (hoursUntil >= 24) {
      karmaChange = 2;
      reason = 'Rescheduled with 24-72 hours notice';
    } else if (hoursUntil >= 2) {
      karmaChange = -3;
      reason = 'Late reschedule (less than 24hrs)';
    } else {
      karmaChange = -10;
      reason = 'Very late reschedule (less than 2hrs)';
    }

    // 4. Update appointment status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    // 5. Update order status back to unscheduled (stays with patient)
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
    }

    // 7. Log karma history
    const { error: historyError } = await supabaseAdmin
      .from('karma_history')
      .insert({
        patient_id: appointment.patient_id,
        action_type: 'rescheduled_appointment',
        points_change: karmaChange,
        related_appointment_id: appointmentId,
        description: reason
      });

    if (historyError) {
      console.error('Karma history error:', historyError);
    }

    // 8. DO NOT trigger marketplace matching - this is a reschedule, not a cancellation

    return NextResponse.json({
      success: true,
      karmaChange,
      reason,
      hoursNotice: Math.round(hoursUntil),
      orderId: appointment.order_id // Return order ID for redirect
    });

  } catch (error: any) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
