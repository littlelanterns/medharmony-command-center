import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;

    // Update appointment with confirmation timestamp
    const { data, error } = await supabase
      .from('appointments')
      .update({
        confirmed_at: new Date().toISOString(),
        status: 'confirmed'
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error confirming appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award karma points for confirming on time
    if (data && data.patient_id) {
      await supabase.rpc('increment_karma', {
        patient_id: data.patient_id,
        points: 2
      }).catch(async () => {
        // Fallback if RPC doesn't exist
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('karma_score')
          .eq('id', data.patient_id)
          .single();

        if (profile) {
          await supabase
            .from('patient_profiles')
            .update({ karma_score: (profile.karma_score || 0) + 2 })
            .eq('id', data.patient_id);
        }
      });

      // Create karma history entry
      await supabase.from('karma_history').insert({
        patient_id: data.patient_id,
        action_type: 'confirmed_on_time',
        points_change: 2,
        related_appointment_id: appointmentId,
        description: 'Confirmed appointment within the confirmation window'
      });
    }

    return NextResponse.json({ success: true, appointment: data });
  } catch (error: any) {
    console.error('Appointment confirmation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
