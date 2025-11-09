/**
 * Date formatting utilities for consistent timezone display in demos
 * All dates are displayed in Central Time (CT) for consistency
 */

const DEMO_TIMEZONE = 'America/Chicago'; // Central Time for demo

/**
 * Formats a date/timestamp to display in the demo timezone
 * Usage: formatDemoDateTime(appointment.scheduled_start)
 * Returns: "11/9/2025, 9:00 AM"
 */
export function formatDemoDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  return date.toLocaleString('en-US', {
    timeZone: DEMO_TIMEZONE,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats just the date portion
 * Usage: formatDemoDate(appointment.scheduled_start)
 * Returns: "11/9/2025"
 */
export function formatDemoDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  return date.toLocaleDateString('en-US', {
    timeZone: DEMO_TIMEZONE,
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats just the time portion
 * Usage: formatDemoTime(appointment.scheduled_start)
 * Returns: "9:00 AM"
 */
export function formatDemoTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  return date.toLocaleTimeString('en-US', {
    timeZone: DEMO_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a time range
 * Usage: formatDemoTimeRange(appointment.scheduled_start, appointment.scheduled_end)
 * Returns: "9:00 AM - 9:30 AM"
 */
export function formatDemoTimeRange(startString: string | Date, endString: string | Date): string {
  return `${formatDemoTime(startString)} - ${formatDemoTime(endString)}`;
}
