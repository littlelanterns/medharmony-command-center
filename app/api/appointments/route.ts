import { NextRequest, NextResponse } from 'next/server';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      patientId,
      providerId,
      scheduledStart,
      scheduledEnd,
      location,
      staffAssigned,
    } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Create appointment
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        order_id: orderId,
        patient_id: patientId,
        provider_id: providerId,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        location,
        staff_assigned: staffAssigned,
        status: 'scheduled',
        confirmation_required: true,
      })
      .select()
      .single();

    if (apptError) {
      console.error('Appointment creation error:', apptError);
      throw apptError;
    }

    // Update order status to scheduled
    await supabaseAdmin
      .from('orders')
      .update({ status: 'scheduled' })
      .eq('id', orderId);

    // Award karma points for scheduling (do it manually since RPC might not exist)
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('karma_score')
      .eq('id', patientId)
      .single();

    if (profile) {
      await supabaseAdmin
        .from('patient_profiles')
        .update({ karma_score: profile.karma_score + 5 })
        .eq('id', patientId);
    }

    // Create karma history entry
    await supabaseAdmin
      .from('karma_history')
      .insert({
        patient_id: patientId,
        action_type: 'scheduled_appointment',
        points_change: 5,
        related_appointment_id: appointment.id,
        description: 'Scheduled appointment promptly',
      });

    // Create notification for provider
    if (providerId) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: providerId,
          notification_type: 'appointment_scheduled',
          title: 'Patient Scheduled Appointment',
          message: `Patient has scheduled their appointment`,
          related_appointment_id: appointment.id,
          priority: 'normal',
          is_read: false,
        });
    }

    return NextResponse.json({ appointment, success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const providerId = searchParams.get('providerId');

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('appointments').select('*, orders(*)');

    if (patientId) query = query.eq('patient_id', patientId);
    if (providerId) query = query.eq('provider_id', providerId);

    query = query.order('scheduled_start', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
