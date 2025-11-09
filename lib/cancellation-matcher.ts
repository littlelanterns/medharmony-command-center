import { supabaseAdmin } from './supabase/client';

interface CancelledAppointment {
  id: string;
  order_id: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  provider_id: string;
}

export async function matchCancellationWithPatients(
  appointment: CancelledAppointment
) {
  try {
    // 1. Get order details to know what type
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('order_type')
      .eq('id', appointment.order_id)
      .single();

    if (!order) {
      console.log('No order found for cancelled appointment');
      return;
    }

    console.log(`Finding matches for ${order.order_type} appointment...`);

    // 2. Find all unscheduled orders of same type
    const { data: matchingOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        patient_id,
        patient_profiles!inner(karma_score)
      `)
      .eq('order_type', order.order_type)
      .eq('status', 'unscheduled')
      .order('patient_profiles(karma_score)', { ascending: false });

    if (!matchingOrders || matchingOrders.length === 0) {
      console.log('No matching unscheduled orders found');
      return;
    }

    console.log(`Found ${matchingOrders.length} potential matches`);

    // 3. Calculate hours until appointment
    const appointmentTime = new Date(appointment.scheduled_start);
    const now = new Date();
    const hoursAvailable = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log(`Appointment is in ${hoursAvailable.toFixed(1)} hours`);

    // 4. Filter by notice requirements
    const eligiblePatients = await filterByNoticeRequirements(
      matchingOrders,
      hoursAvailable
    );

    console.log(`${eligiblePatients.length} patients meet notice requirements`);

    if (eligiblePatients.length === 0) {
      console.log('No eligible patients after filtering by notice requirements');
      return;
    }

    // 5. Take top 5 by karma
    const topMatches = eligiblePatients.slice(0, 5);

    console.log(`Notifying top ${topMatches.length} matches`);

    // 6. Create notifications for matches
    for (const match of topMatches) {
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: match.patient_id,
          notification_type: 'cancellation_alert',
          title: '🎯 Earlier Slot Available!',
          message: `An appointment slot opened up on ${new Date(appointment.scheduled_start).toLocaleDateString()} at ${new Date(appointment.scheduled_start).toLocaleTimeString()}. Claim it to move up your appointment!`,
          related_appointment_id: appointment.id,
          related_order_id: match.id,
          priority: 'high'
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        console.log(`✓ Notified patient ${match.patient_id}`);
      }
    }

    // Update cancellation alert with matched patients
    await supabaseAdmin
      .from('cancellation_alerts')
      .update({
        status: 'notified',
        notified_patient_id: topMatches[0]?.patient_id || null
      })
      .eq('cancelled_appointment_id', appointment.id);

    console.log(`✓ Matching complete - notified ${topMatches.length} patients`);

    return topMatches;

  } catch (error) {
    console.error('Error matching cancellation:', error);
    throw error;
  }
}

async function filterByNoticeRequirements(
  orders: any[],
  hoursAvailable: number
) {
  const filtered = [];

  for (const order of orders) {
    // Get patient's notice requirement
    const { data: prefs } = await supabaseAdmin
      .from('availability_preferences')
      .select('preference_data')
      .eq('patient_id', order.patient_id)
      .eq('preference_type', 'notice_requirement')
      .single();

    const minNotice = prefs?.preference_data?.hours_needed || 2; // Default 2 hours

    if (hoursAvailable >= minNotice) {
      filtered.push(order);
    } else {
      console.log(`Patient ${order.patient_id} needs ${minNotice}h notice, only ${hoursAvailable.toFixed(1)}h available`);
    }
  }

  return filtered;
}
