import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, notificationTemplates } from '@/lib/notifications/send';

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

    // Check if there's an existing appointment for this order (reschedule scenario)
    const { data: existingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['scheduled', 'confirmed']);

    let rescheduleKarma = 0;
    let rescheduleReason = '';

    if (existingAppointments && existingAppointments.length > 0) {
      // This is a reschedule! Cancel the old appointment first
      const oldAppointment = existingAppointments[0];

      // Calculate karma for rescheduling
      const now = new Date();
      const oldAppointmentTime = new Date(oldAppointment.scheduled_start);
      const hoursUntil = (oldAppointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil >= 72) {
        rescheduleKarma = 5;
        rescheduleReason = 'Rescheduled with 72+ hours notice';
      } else if (hoursUntil >= 24) {
        rescheduleKarma = 2;
        rescheduleReason = 'Rescheduled with 24-72 hours notice';
      } else if (hoursUntil >= 2) {
        rescheduleKarma = -3;
        rescheduleReason = 'Late reschedule (less than 24hrs)';
      } else {
        rescheduleKarma = -10;
        rescheduleReason = 'Very late reschedule (less than 2hrs)';
      }

      // Cancel old appointment
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', oldAppointment.id);

      // Log reschedule karma
      await supabaseAdmin
        .from('karma_history')
        .insert({
          patient_id: patientId,
          action_type: 'rescheduled_appointment',
          points_change: rescheduleKarma,
          related_appointment_id: oldAppointment.id,
          description: rescheduleReason
        });
    }

    // Create new appointment
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

    // Award karma points for scheduling
    const bookingKarma = 5;
    const totalKarma = rescheduleKarma + bookingKarma;

    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('karma_score')
      .eq('id', patientId)
      .single();

    if (profile) {
      const newKarma = Math.max(0, Math.min(100, profile.karma_score + totalKarma));
      await supabaseAdmin
        .from('patient_profiles')
        .update({ karma_score: newKarma })
        .eq('id', patientId);
    }

    // Create karma history entry for new booking
    await supabaseAdmin
      .from('karma_history')
      .insert({
        patient_id: patientId,
        action_type: 'scheduled_appointment',
        points_change: bookingKarma,
        related_appointment_id: appointment.id,
        description: existingAppointments && existingAppointments.length > 0
          ? `Rescheduled successfully (${rescheduleReason})`
          : 'Scheduled appointment promptly',
      });

    // Send notification to provider (in-app + email/SMS based on preferences)
    if (providerId) {
      const { data: patientData } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', patientId)
        .single();

      const { data: orderData } = await supabaseAdmin
        .from('orders')
        .select('title')
        .eq('id', orderId)
        .single();

      const appointmentDate = new Date(scheduledStart).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      await sendNotification({
        userId: providerId,
        ...notificationTemplates.appointmentBooked({
          patientName: patientData?.full_name || 'Patient',
          appointmentTime: appointmentDate,
          orderTitle: orderData?.title || 'appointment',
        }),
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
