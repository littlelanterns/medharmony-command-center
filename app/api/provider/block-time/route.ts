import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { providerId, startDatetime, endDatetime, blockType, reason } = await request.json();

    if (!providerId || !startDatetime || !endDatetime || !blockType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the time block
    const { data: timeBlock, error: blockError } = await supabaseAdmin
      .from('provider_time_blocks')
      .insert({
        provider_id: providerId,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        block_type: blockType,
        reason: reason || null,
        is_active: true,
        affected_patients_notified: false
      })
      .select()
      .single();

    if (blockError) throw blockError;

    // 2. Find all appointments that conflict with this time block
    const { data: conflictingAppointments, error: apptError } = await supabaseAdmin
      .from('appointments')
      .select('*, patient_id, order_id, orders(*)')
      .eq('provider_id', providerId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_start', startDatetime)
      .lte('scheduled_start', endDatetime);

    if (apptError) {
      console.error('Error finding conflicting appointments:', apptError);
    }

    const affectedCount = conflictingAppointments?.length || 0;
    const affectedPatients: string[] = [];

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      // 3. Cancel all conflicting appointments
      for (const appointment of conflictingAppointments) {
        // Cancel appointment
        await supabaseAdmin
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', appointment.id);

        // Update order back to unscheduled
        await supabaseAdmin
          .from('orders')
          .update({ status: 'unscheduled' })
          .eq('id', appointment.order_id);

        affectedPatients.push(appointment.patient_id);

        // 4. Create notification for patient with reschedule link
        const blockTypeLabel = blockType.replace('_', ' ');
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: appointment.patient_id,
            notification_type: 'provider_unavailable',
            title: `⚠️ Appointment Cancelled - Provider ${blockTypeLabel.charAt(0).toUpperCase() + blockTypeLabel.slice(1)}`,
            message: `Your appointment on ${new Date(appointment.scheduled_start).toLocaleString()} has been cancelled due to provider ${blockTypeLabel}. ${reason ? `Reason: ${reason}. ` : ''}Please reschedule at your earliest convenience.`,
            related_appointment_id: appointment.id,
            related_order_id: appointment.order_id,
            priority: 'high',
            is_read: false
          });

        // 5. Log in karma history (no penalty for provider-initiated cancellation)
        await supabaseAdmin
          .from('karma_history')
          .insert({
            patient_id: appointment.patient_id,
            action_type: 'appointment_cancelled_by_provider',
            points_change: 0,
            related_appointment_id: appointment.id,
            description: `Appointment cancelled by provider due to ${blockTypeLabel}`
          });
      }

      // Mark time block as having notified patients
      await supabaseAdmin
        .from('provider_time_blocks')
        .update({
          affected_patients_notified: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('id', timeBlock.id);
    }

    return NextResponse.json({
      success: true,
      timeBlockId: timeBlock.id,
      affectedAppointments: affectedCount,
      affectedPatients: [...new Set(affectedPatients)], // Unique patients
      message: affectedCount > 0
        ? `Time blocked successfully. ${affectedCount} appointment(s) cancelled and patients notified.`
        : 'Time blocked successfully. No appointments were affected.'
    });

  } catch (error: any) {
    console.error('Error blocking time:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch provider's time blocks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('provider_time_blocks')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('start_datetime', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ timeBlocks: data });

  } catch (error: any) {
    console.error('Error fetching time blocks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a time block
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('provider_time_blocks')
      .update({ is_active: false })
      .eq('id', blockId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting time block:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
