import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceKey);
};

interface OrderToSchedule {
  orderId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  urgency: string;
}

/**
 * Multi-patient AI Scheduling Endpoint
 * Optimizes appointment scheduling across multiple family members
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caregiverId, orders } = body as { caregiverId: string; orders: OrderToSchedule[] };

    if (!caregiverId || !orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Step 1: Get all existing appointments for all family members
    const patientIds = orders.map(o => o.patientId);
    const { data: existingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('patient_id, scheduled_start, scheduled_end')
      .in('patient_id', patientIds)
      .gte('scheduled_start', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed']);

    // Step 2: Get provider schedules for all providers
    const providerIds = [...new Set(orders.map(o => o.providerId))];
    const providerSchedules: Record<string, any[]> = {};

    for (const providerId of providerIds) {
      const { data: schedules } = await supabaseAdmin
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', providerId);

      if (schedules) {
        providerSchedules[providerId] = schedules;
      }
    }

    // Step 3: Get provider appointments to check availability
    const { data: providerAppointments } = await supabaseAdmin
      .from('appointments')
      .select('provider_id, scheduled_start, scheduled_end')
      .in('provider_id', providerIds)
      .gte('scheduled_start', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed']);

    // Step 4: Use AI to optimize scheduling
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const systemPrompt = `You are an AI scheduling assistant specializing in multi-patient healthcare scheduling.
Your goal is to schedule multiple appointments for a family while:
1. Minimizing the number of trips (prefer same-day appointments when possible)
2. Respecting urgency levels (urgent > high > standard > routine)
3. Avoiding conflicts with existing appointments
4. Finding times within provider availability
5. Considering practical constraints (school hours for children, work hours for adults)

Output your response as a JSON array of scheduling recommendations. Each recommendation should include:
- orderId: string
- recommendedDate: ISO date string
- recommendedTime: 24hr time string (e.g., "14:00")
- reasoning: brief explanation of why this time was chosen
- canBeBatchedWith: array of other orderIds that could be scheduled same day`;

    const userPrompt = `Schedule the following appointments for a family:

Orders to Schedule:
${orders.map((o, i) => `
${i + 1}. Patient: ${o.patientName} (ID: ${o.patientId})
   Order ID: ${o.orderId}
   Provider ID: ${o.providerId}
   Urgency: ${o.urgency}
`).join('\n')}

Existing Family Appointments:
${existingAppointments && existingAppointments.length > 0
  ? existingAppointments.map(a => `- ${a.scheduled_start} (Patient ${a.patient_id})`).join('\n')
  : 'None'}

Provider Schedules:
${Object.entries(providerSchedules).map(([providerId, schedules]) => `
Provider ${providerId}:
${schedules.map(s => `  ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day_of_week]}: ${s.start_time}-${s.end_time} at ${s.location}`).join('\n')}
`).join('\n')}

Provider Existing Appointments:
${providerAppointments && providerAppointments.length > 0
  ? providerAppointments.map(a => `- Provider ${a.provider_id}: ${a.scheduled_start} to ${a.scheduled_end}`).join('\n')
  : 'None'}

Today's Date: ${new Date().toISOString().split('T')[0]}

Provide scheduling recommendations that optimize for family convenience.`;

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const recommendations = JSON.parse(aiResponse);

    // Step 5: Validate recommendations and create appointments
    const createdAppointments = [];
    const errors = [];

    for (const rec of (recommendations.recommendations || recommendations)) {
      try {
        const order = orders.find(o => o.orderId === rec.orderId);
        if (!order) {
          errors.push({ orderId: rec.orderId, error: 'Order not found' });
          continue;
        }

        // Get order details
        const { data: orderData } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', rec.orderId)
          .single();

        if (!orderData) {
          errors.push({ orderId: rec.orderId, error: 'Order data not found' });
          continue;
        }

        // Parse recommended date/time
        const scheduledStart = new Date(`${rec.recommendedDate}T${rec.recommendedTime}`);
        const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000); // 1 hour default

        // Get provider schedule for this day
        const dayOfWeek = scheduledStart.getDay();
        const providerSchedule = providerSchedules[order.providerId]?.find(
          s => s.day_of_week === dayOfWeek
        );

        if (!providerSchedule) {
          errors.push({
            orderId: rec.orderId,
            error: `Provider not available on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}`,
          });
          continue;
        }

        // Create appointment
        const { data: appointment, error: apptError } = await supabaseAdmin
          .from('appointments')
          .insert({
            order_id: rec.orderId,
            patient_id: order.patientId,
            provider_id: order.providerId,
            scheduled_start: scheduledStart.toISOString(),
            scheduled_end: scheduledEnd.toISOString(),
            location: providerSchedule.location,
            staff_assigned: providerSchedule.staff_assigned,
            status: 'scheduled',
            confirmation_required: true,
          })
          .select()
          .single();

        if (apptError) {
          errors.push({ orderId: rec.orderId, error: apptError.message });
          continue;
        }

        // Update order status
        await supabaseAdmin
          .from('orders')
          .update({ status: 'scheduled' })
          .eq('id', rec.orderId);

        // Award karma for scheduling
        const { data: profile } = await supabaseAdmin
          .from('patient_profiles')
          .select('karma_score')
          .eq('id', order.patientId)
          .single();

        if (profile) {
          const newKarma = Math.max(0, Math.min(100, profile.karma_score + 5));
          await supabaseAdmin
            .from('patient_profiles')
            .update({ karma_score: newKarma })
            .eq('id', order.patientId);

          await supabaseAdmin
            .from('karma_history')
            .insert({
              patient_id: order.patientId,
              action_type: 'scheduled_appointment',
              points_change: 5,
              related_appointment_id: appointment.id,
              description: 'Scheduled via caregiver multi-patient AI',
            });
        }

        createdAppointments.push({
          ...appointment,
          recommendation: rec,
          patientName: order.patientName,
        });
      } catch (error: any) {
        errors.push({ orderId: rec.orderId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      scheduled: createdAppointments.length,
      failed: errors.length,
      appointments: createdAppointments,
      errors,
      aiRecommendations: recommendations,
    });
  } catch (error: any) {
    console.error('Multi-patient scheduling error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to preview multi-patient scheduling recommendations
 * without actually creating appointments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caregiverId = searchParams.get('caregiverId');

    if (!caregiverId) {
      return NextResponse.json(
        { error: 'Missing caregiverId' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get all family members
    const { data: relationships } = await supabaseAdmin
      .from('caregiver_relationships')
      .select('patient_id')
      .eq('caregiver_id', caregiverId);

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const patientIds = relationships.map(r => r.patient_id);

    // Get all unscheduled orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        patient:users!orders_patient_id_fkey (
          full_name
        )
      `)
      .in('patient_id', patientIds)
      .eq('status', 'unscheduled')
      .order('urgency', { ascending: false });

    const formattedOrders = (orders || []).map(o => ({
      orderId: o.id,
      patientId: o.patient_id,
      patientName: (o as any).patient.full_name,
      providerId: o.provider_id,
      urgency: o.urgency,
      title: o.title,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
