import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Using a singleton to avoid duplicate client creation
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const providerId = searchParams.get('providerId');
    const orderId = searchParams.get('orderId');

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('orders').select('*, prerequisites(*)');

    if (orderId) {
      query = query.eq('id', orderId).single();
    } else {
      if (patientId) query = query.eq('patient_id', patientId);
      if (providerId) query = query.eq('provider_id', providerId);
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      providerId,
      orderType,
      title,
      description,
      priority,
      dueWithinDays,
      estimatedRevenue,
      prerequisites,
      customNotes
    } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        patient_id: patientId,
        provider_id: providerId,
        order_type: orderType,
        title,
        description: description || customNotes,
        priority,
        due_within_days: dueWithinDays,
        status: 'unscheduled',
        estimated_revenue: estimatedRevenue,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // Create prerequisites
    if (prerequisites && prerequisites.length > 0) {
      const prereqData = prerequisites.map((p: any) => ({
        order_id: order.id,
        provider_id: providerId,
        prerequisite_type: p.type,
        description: p.description,
        is_required: p.isRequired !== false,
      }));

      const { error: prereqError } = await supabaseAdmin
        .from('prerequisites')
        .insert(prereqData);

      if (prereqError) {
        console.error('Prerequisites creation error:', prereqError);
        // Don't fail the whole request, just log the error
      }
    }

    // Create notification for patient
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: patientId,
        notification_type: 'order_received',
        title: 'New Order Received',
        message: `You have a new order: ${title}`,
        related_order_id: order.id,
        priority: priority === 'stat' ? 'urgent' : priority === 'urgent' ? 'high' : 'normal',
        is_read: false,
      });

    return NextResponse.json({ order, success: true });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
