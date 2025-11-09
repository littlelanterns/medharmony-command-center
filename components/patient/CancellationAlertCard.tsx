'use client';

import { useState } from 'react';

interface CancellationAlertProps {
  notification: {
    id: string;
    title: string;
    message: string;
    related_appointment_id: string;
    related_order_id: string;
    created_at: string;
  };
  patientId: string;
  onClaimed?: () => void;
}

export default function CancellationAlertCard({ notification, patientId, onClaimed }: CancellationAlertProps) {
  const [claiming, setClaiming] = useState(false);

  // Calculate time left to claim (2 hours from notification)
  const createdAt = new Date(notification.created_at);
  const expiresAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();
  const minutesLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)));

  const handleClaim = async () => {
    setClaiming(true);

    try {
      const response = await fetch('/api/cancellations/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: notification.related_appointment_id,
          orderId: notification.related_order_id,
          patientId: patientId
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Slot claimed! You earned +${result.karmaEarned} karma!`);
        if (onClaimed) onClaimed();
        window.location.reload();
      } else {
        alert(result.error || 'Failed to claim slot');
      }
    } catch (error) {
      console.error('Error claiming slot:', error);
      alert('Failed to claim slot');
    } finally {
      setClaiming(false);
    }
  };

  if (minutesLeft === 0) {
    return null; // Expired
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <h3 className="text-xl font-bold text-amber-900">{notification.title}</h3>
          </div>

          <p className="text-gray-700 mb-4">{notification.message}</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-amber-800">
                {minutesLeft} minutes left to claim
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-semibold text-amber-800">
                +5 karma if you claim
              </span>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-full hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
          >
            {claiming ? 'Claiming Slot...' : '🎯 Claim This Slot'}
          </button>

          <p className="text-xs text-amber-700 mt-2 text-center">
            You were selected because of your high karma score and availability preferences
          </p>
        </div>
      </div>
    </div>
  );
}
