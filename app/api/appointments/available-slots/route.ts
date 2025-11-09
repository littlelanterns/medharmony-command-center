import { NextRequest, NextResponse } from 'next/server';
import { generateAvailableSlots, TimePreference } from '@/lib/slot-generator';

/**
 * GET /api/appointments/available-slots
 *
 * Returns available appointment slots for a provider within a date range
 *
 * Query Parameters:
 * - providerId (required): Provider UUID
 * - startDate (optional): Start of date range (ISO string, defaults to tomorrow)
 * - endDate (optional): End of date range (ISO string, defaults to 30 days from startDate)
 * - timePreference (optional): 'morning' | 'afternoon' | 'evening' | 'all' (defaults to 'all')
 * - duration (optional): Appointment duration in minutes (defaults to 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get required parameters
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'providerId is required' },
        { status: 400 }
      );
    }

    // Get optional parameters with defaults
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const timePreference = (searchParams.get('timePreference') || 'all') as TimePreference;
    const duration = parseInt(searchParams.get('duration') || '30');

    // Parse dates or use defaults
    const startDate = startDateParam
      ? new Date(startDateParam)
      : getDefaultStartDate();

    const endDate = endDateParam
      ? new Date(endDateParam)
      : getDefaultEndDate(startDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }

    // Generate available slots
    const result = await generateAvailableSlots({
      providerId,
      startDate,
      endDate,
      appointmentDuration: duration,
      timePreference
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get default start date (tomorrow)
 */
function getDefaultStartDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Helper: Get default end date (30 days from start)
 */
function getDefaultEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}
