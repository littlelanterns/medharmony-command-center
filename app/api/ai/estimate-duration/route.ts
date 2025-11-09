import { NextRequest, NextResponse } from 'next/server';
import { estimateProcedure } from '@/lib/medical-pricing-data';

/**
 * POST /api/ai/estimate-duration
 *
 * AI-powered duration and pricing estimation using real hospital data
 * Data Source: Freeman Health System standard charges (2025-05-01)
 */
export async function POST(request: NextRequest) {
  try {
    const { orderType, title, description } = await request.json();

    // Use real hospital pricing data to estimate duration and cost
    const estimate = estimateProcedure(orderType || '', title || '', description || '');

    // Generate pricing range string
    const priceRange = estimate.minPrice === estimate.maxPrice
      ? `$${estimate.typicalPrice.toLocaleString()}`
      : `$${estimate.minPrice.toLocaleString()} - $${estimate.maxPrice.toLocaleString()}`;

    // Generate human-readable reasoning
    const reasoning = getDurationReasoning(
      orderType || '',
      title || '',
      estimate.durationMinutes,
      estimate.typicalPrice,
      priceRange
    );

    return NextResponse.json({
      duration_minutes: estimate.durationMinutes,
      estimated_revenue: estimate.typicalPrice,
      min_price: estimate.minPrice,
      max_price: estimate.maxPrice,
      reasoning,
      confidence: 'high',
      data_source: 'Freeman Health System (Joplin, MO)'
    });
  } catch (error: any) {
    console.error('Error estimating duration:', error);
    return NextResponse.json(
      { error: 'Failed to estimate duration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable reasoning for the duration and pricing estimate
 */
function getDurationReasoning(
  orderType: string,
  title: string,
  duration: number,
  typicalPrice: number,
  priceRange: string
): string {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const timeStr = hours > 0
    ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min` : ''}`
    : `${minutes} minutes`;

  const titleLower = title.toLowerCase();
  const combined = `${titleLower} ${orderType.toLowerCase()}`;

  // Cardiac/Heart procedures
  if (combined.includes('cardiac') || combined.includes('heart')) {
    if (combined.includes('surgery')) {
      return `${timeStr} appointment. ${priceRange} - Cardiac surgery requires extensive time for pre-op preparation, surgical procedure, and initial recovery monitoring. This is a major procedure with specialized team requirements.`;
    }
    if (combined.includes('catheter')) {
      return `${timeStr} appointment. ${priceRange} - Cardiac catheterization includes patient prep, the procedure itself, and post-procedure monitoring for complications.`;
    }
    return `${timeStr} appointment. ${priceRange} - Cardiac procedures require careful preparation and monitoring.`;
  }

  // Major surgery
  if (combined.includes('surgery')) {
    if (combined.includes('major') || combined.includes('extensive') || duration >= 180) {
      return `${timeStr} appointment. ${priceRange} - Major surgical procedures require extended time for anesthesia, surgery, and recovery room monitoring. Includes pre-op preparation and post-op care.`;
    }
    if (combined.includes('minor')) {
      return `${timeStr} appointment. ${priceRange} - Minor surgical procedure with local anesthesia or light sedation. Includes prep time and post-procedure observation.`;
    }
    return `${timeStr} appointment. ${priceRange} - Surgical procedure requiring anesthesia, sterile environment, and recovery time.`;
  }

  // Imaging
  if (combined.includes('mri')) {
    return `${timeStr} appointment. ${priceRange} - MRI requires patient positioning, safety screening, multiple imaging sequences, and time for patient comfort during the scan.`;
  }
  if (combined.includes('ct') || combined.includes('cat scan')) {
    return `${timeStr} appointment. ${priceRange} - CT scan includes patient preparation, contrast administration if needed, imaging sequences, and safety protocols.`;
  }
  if (combined.includes('x-ray') || combined.includes('xray')) {
    return `${timeStr} appointment. ${priceRange} - X-ray is a quick procedure but includes patient positioning and multiple views as needed.`;
  }
  if (combined.includes('ultrasound')) {
    return `${timeStr} appointment. ${priceRange} - Ultrasound requires gel application, multiple viewing angles, and time to capture clear images.`;
  }

  // Lab work
  if (orderType === 'lab' || combined.includes('blood') || combined.includes('lab')) {
    if (duration > 60) {
      return `${timeStr} appointment. ${priceRange} - Extended lab work requiring fasting, multiple blood draws over time, or complex testing procedures.`;
    }
    return `${timeStr} appointment. ${priceRange} - Standard time for check-in, blood draw, labeling samples, and patient checkout.`;
  }

  // Therapy
  if (combined.includes('therapy')) {
    if (combined.includes('physical') || combined.includes('occupational')) {
      return `${timeStr} appointment. ${priceRange} - Therapy sessions include assessment, exercises, manual therapy, and patient education for effective rehabilitation.`;
    }
    if (combined.includes('speech')) {
      return `${timeStr} appointment. ${priceRange} - Speech therapy includes evaluation, therapeutic exercises, and caregiver training.`;
    }
    return `${timeStr} appointment. ${priceRange} - Therapeutic session with evaluation and treatment.`;
  }

  // Consultations
  if (orderType === 'consultation' || combined.includes('consultation') || combined.includes('visit')) {
    if (duration >= 60) {
      return `${timeStr} appointment. ${priceRange} - Comprehensive consultation includes detailed history, physical examination, discussion of treatment options, and care planning.`;
    }
    return `${timeStr} appointment. ${priceRange} - Standard consultation time for examination, assessment, and treatment discussion.`;
  }

  // Default
  return `${timeStr} appointment. ${priceRange} - Estimated based on real hospital data from Freeman Health System. Duration and pricing reflect typical requirements for this type of procedure.`;
}
