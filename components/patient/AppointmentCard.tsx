'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Appointment } from '@/lib/types';

interface AppointmentCardProps {
  appointment: Appointment & {
    orders?: { title: string };
  };
  showTitle?: boolean;
  onConfirm?: () => void;
}

export default function AppointmentCard({ appointment, showTitle = true, onConfirm }: AppointmentCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/confirm`, {
        method: 'PATCH',
      });

      if (response.ok) {
        alert('Appointment confirmed successfully!');
        if (onConfirm) onConfirm();
        window.location.reload();
      } else {
        alert('Failed to confirm appointment. Please try again.');
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      alert('Error confirming appointment');
    } finally {
      setConfirming(false);
    }
  };

  // Calculate if within confirmation window (24-72 hours before appointment)
  const appointmentTime = new Date(appointment.scheduled_start);
  const now = new Date();
  const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canConfirm = hoursUntil > 0 && hoursUntil <= 72; // Can confirm up to 72 hours before
  return (
    <Card padding="md">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {showTitle && (
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {appointment.orders?.title || 'Appointment'}
            </h3>
          )}

          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">
                {new Date(appointment.scheduled_start).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{appointment.location}</span>
            </div>

            {appointment.staff_assigned && (
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{appointment.staff_assigned}</span>
              </div>
            )}
          </div>
        </div>

        <StatusBadge status={appointment.status} />
      </div>

      {appointment.confirmation_required && !appointment.confirmed_at && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-semibold mb-2">
                ⚠️ Confirmation Required
              </p>
              {canConfirm ? (
                <p className="text-xs text-yellow-700 mb-3">
                  You can confirm this appointment within 72 hours of the scheduled time.
                  {hoursUntil > 0 && (
                    <span className="block mt-1">
                      Time remaining: {Math.floor(hoursUntil)} hours
                    </span>
                  )}
                </p>
              ) : hoursUntil > 72 ? (
                <p className="text-xs text-yellow-700">
                  Confirmation window opens {Math.floor(hoursUntil - 72)} hours from now (72 hours before appointment)
                </p>
              ) : (
                <p className="text-xs text-red-700">
                  Confirmation window has closed. Please contact the office.
                </p>
              )}
            </div>
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="ml-4 px-4 py-2 bg-[#008080] text-white font-semibold rounded-lg hover:bg-[#006666] transition disabled:opacity-50"
              >
                {confirming ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            )}
          </div>
        </div>
      )}

      {appointment.confirmed_at && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-semibold">
            ✓ Confirmed on {new Date(appointment.confirmed_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </Card>
  );
}
