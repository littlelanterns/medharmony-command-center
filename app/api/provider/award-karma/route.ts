import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { patientId, providerId, points, reason, orderId } = await request.json();

    if (!patientId || !providerId || !points || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (points <= 0) {
      return NextResponse.json(
        { error: 'Points must be positive' },
        { status: 400 }
      );
    }

    // Get patient and provider names
    const { data: patient } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', patientId)
      .single();

    const { data: provider } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', providerId)
      .single();

    const patientName = patient?.full_name || 'Patient';
    const providerName = provider?.full_name || 'Provider';

    // Update patient's karma points
    const { data: currentProfile } = await supabase
      .from('patient_profiles')
      .select('karma_points')
      .eq('id', patientId)
      .single();

    const currentPoints = currentProfile?.karma_points || 0;
    const newPoints = currentPoints + points;

    const { error: updateError } = await supabase
      .from('patient_profiles')
      .update({ karma_points: newPoints })
      .eq('id', patientId);

    if (updateError) {
      console.error('Error updating karma points:', updateError);
      return NextResponse.json(
        { error: 'Failed to update karma points' },
        { status: 500 }
      );
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('karma_transactions')
      .insert({
        patient_id: patientId,
        provider_id: providerId,
        transaction_type: 'award',
        points: points,
        reason: reason,
        related_order_id: orderId || null,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't fail the request, points were already updated
    }

    // Create notification for patient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: patientId,
        notification_type: 'karma_award',
        title: `🎁 You Earned ${points} Karma Points!`,
        message: `${providerName} has awarded you ${points} karma points! ${reason}. You now have ${newPoints} karma points to spend on priority scheduling and other benefits.`,
        priority: 'normal',
        is_read: false,
        related_order_id: orderId || null,
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: `Awarded ${points} karma points to ${patientName}`,
      newTotal: newPoints,
    });

  } catch (error: any) {
    console.error('Award karma error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award karma points' },
      { status: 500 }
    );
  }
}
