'use client';

import { useState } from 'react';

interface BlockTimeModalProps {
  providerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BlockTimeModal({ providerId, onClose, onSuccess }: BlockTimeModalProps) {
  const [blocking, setBlocking] = useState(false);
  const [formData, setFormData] = useState({
    blockType: 'vacation',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '17:00',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlocking(true);

    try {
      const startDatetime = `${formData.startDate}T${formData.startTime}:00`;
      const endDatetime = `${formData.endDate}T${formData.endTime}:00`;

      const response = await fetch('/api/provider/block-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          startDatetime,
          endDatetime,
          blockType: formData.blockType,
          reason: formData.reason || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ ${result.message}\n\n` +
          `${result.affectedAppointments > 0
            ? `${result.affectedPatients.length} patient(s) have been notified and can reschedule their appointments.`
            : 'No appointments were affected by this time block.'
          }`
        );
        onSuccess();
        onClose();
      } else {
        alert('Error: ' + (result.error || 'Failed to block time'));
      }
    } catch (error) {
      console.error('Error blocking time:', error);
      alert('Failed to block time');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Block Time</h2>
          <p className="text-gray-600 mt-1">
            Mark yourself unavailable. Affected patients will be automatically notified.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Block Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Blocking
            </label>
            <select
              value={formData.blockType}
              onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="vacation">Vacation</option>
              <option value="sick_day">Sick Day</option>
              <option value="emergency">Emergency</option>
              <option value="conference">Conference / Training</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Optional Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Will be back on Monday, Contact Dr. Smith for urgent matters"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h4 className="font-bold text-orange-900 mb-1">Important</h4>
                <p className="text-sm text-orange-800">
                  All appointments during this time will be <strong>automatically cancelled</strong>. Affected patients will receive notifications with instructions to reschedule. They will NOT lose karma for provider-initiated cancellations.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={blocking}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={blocking}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg hover:from-red-600 hover:to-orange-600 transition disabled:opacity-50"
            >
              {blocking ? 'Blocking Time...' : 'Block Time & Notify Patients'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
