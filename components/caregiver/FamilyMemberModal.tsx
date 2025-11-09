'use client';

import { useState } from 'react';
import { formatDemoDate, formatDemoTime } from '@/lib/date-utils';

interface FamilyMember {
  id: string;
  full_name: string;
  email: string;
  relationship_type: string;
  patient_profile?: {
    date_of_birth: string;
    medical_conditions: string[];
    karma_score: number;
  };
}

interface Order {
  id: string;
  patient_id: string;
  provider_id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requires_confirmation?: boolean;
  prerequisites: string[];
  provider?: {
    id?: string;
    full_name: string;
    specialty: string;
  };
  created_at: string;
}

interface Appointment {
  id: string;
  order_id: string;
  patient_id: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  status: string;
  confirmation_required: boolean;
  order: {
    title: string;
  };
}

interface FamilyMemberModalProps {
  member: FamilyMember;
  orders: Order[];
  appointments: Appointment[];
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  onClose: () => void;
  onScheduleOrder: (orderId: string) => void;
  onRescheduleAppointment: (orderId: string, patientId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
  userId?: string;
}

export default function FamilyMemberModal({
  member,
  orders,
  appointments,
  colorScheme,
  onClose,
  onScheduleOrder,
  onRescheduleAppointment,
  onCancelAppointment,
  userId,
}: FamilyMemberModalProps) {
  const [requestingCall, setRequestingCall] = useState<string | null>(null);

  const handleRequestCall = async (order: Order) => {
    if (!order.provider) return;

    setRequestingCall(order.id);
    try {
      const response = await fetch('/api/patient/request-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          patientId: member.id,
          providerId: order.provider.id || order.provider_id,
          orderTitle: order.title,
          reason: 'Caregiver needs assistance understanding and scheduling this procedure',
        }),
      });

      if (response.ok) {
        alert(`Call request sent! ${order.provider.full_name}'s office will contact you soon.`);
      } else {
        alert('Failed to send call request. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting call:', error);
      alert('Error requesting call. Please try again.');
    } finally {
      setRequestingCall(null);
    }
  };
  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getUrgencyColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'standard':
      case 'routine':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const age = member.patient_profile?.date_of_birth
    ? getAge(member.patient_profile.date_of_birth)
    : null;

  // Filter orders and appointments for this specific member
  const memberOrders = orders.filter((o) => o.patient_id === member.id);
  const memberAppointments = appointments.filter((a) => a.patient_id === member.id);

  // Separate orders by status
  const pendingConfirmation = memberOrders.filter(
    (o) => o.requires_confirmation && o.status === 'unscheduled'
  );
  const unscheduledOrders = memberOrders.filter(
    (o) => o.status === 'unscheduled' && !o.requires_confirmation
  );
  const scheduledOrders = memberOrders.filter((o) => o.status === 'scheduled');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={`${colorScheme.bg} border-b-4 ${colorScheme.border} p-6 sticky top-0 z-10`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className={`text-3xl font-bold ${colorScheme.text} mb-2`}>
                {member.full_name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="capitalize font-semibold">{member.relationship_type}</span>
                {age !== null && <span>• Age {age}</span>}
                <span>
                  • Karma: <span className="font-bold">{member.patient_profile?.karma_score || 0}</span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/50"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Medical Conditions */}
          {member.patient_profile?.medical_conditions &&
            member.patient_profile.medical_conditions.length > 0 && (
              <div className="mt-4 bg-white/70 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Medical Conditions:</p>
                <div className="flex flex-wrap gap-2">
                  {member.patient_profile.medical_conditions.map((condition, i) => (
                    <span
                      key={i}
                      className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Stats Cards */}
        <div className="px-6 pt-6 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600">Karma Score</div>
              <span className="text-lg">⭐</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {member.patient_profile?.karma_score || 0}/100
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600">Needs Scheduling</div>
              <span className="text-lg">{unscheduledOrders.length > 0 ? '🔴' : '✅'}</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              {unscheduledOrders.length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600">Upcoming</div>
              <span className="text-lg">📅</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {memberAppointments.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ORDERS REQUIRING CONFIRMATION */}
          {pendingConfirmation.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-xl font-bold text-red-900">
                  ⚠️ Requires Your Confirmation ({pendingConfirmation.length})
                </h3>
              </div>

              <div className="space-y-3">
                {pendingConfirmation.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-4 border-2 border-red-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{order.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                        {order.provider && (
                          <p className="text-sm text-gray-500 mt-2">
                            👨‍⚕️ {order.provider.full_name} ({order.provider.specialty})
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>

                    {order.prerequisites && order.prerequisites.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Prerequisites:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {order.prerequisites.map((prereq, i) => (
                            <li key={i}>• {prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (confirm(`Confirm this order for ${member.full_name}?`)) {
                            onScheduleOrder(order.id);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        ✅ Confirm & Schedule
                      </button>
                      <button
                        onClick={() => handleRequestCall(order)}
                        disabled={requestingCall === order.id}
                        className={`px-4 py-2 border-2 border-[#008080] text-[#008080] rounded-lg font-semibold transition ${
                          requestingCall === order.id
                            ? 'opacity-50 cursor-wait'
                            : 'hover:bg-[#008080] hover:text-white'
                        }`}
                      >
                        {requestingCall === order.id ? '📞 Requesting...' : '📞 Request Call'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING APPOINTMENTS */}
          {memberAppointments.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#008080]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Upcoming Appointments ({memberAppointments.length})
              </h3>

              <div className="space-y-3">
                {memberAppointments.map((appt) => {
                  const appointmentDate = new Date(appt.scheduled_start);
                  return (
                    <div
                      key={appt.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">{appt.order.title}</h4>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <p>📅 {formatDemoDate(appointmentDate)}</p>
                            <p>⏰ {formatDemoTime(appointmentDate)}</p>
                            <p>📍 {appt.location}</p>
                          </div>
                        </div>
                        {appt.confirmation_required && appt.status === 'scheduled' && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                            Needs Confirmation
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => onRescheduleAppointment(appt.order_id, member.id)}
                          className="px-4 py-2 bg-[#008080] text-white rounded-lg font-semibold hover:bg-[#006666] transition text-sm"
                        >
                          🔄 Reschedule
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Cancel this appointment for ${member.full_name}?`)) {
                              onCancelAppointment(appt.id);
                            }
                          }}
                          className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition text-sm"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* UNSCHEDULED CARE PLANS */}
          {unscheduledOrders.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Needs Scheduling ({unscheduledOrders.length})
              </h3>

              <div className="space-y-3">
                {unscheduledOrders.map((order) => (
                  <div key={order.id} className="bg-white border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{order.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                        {order.provider && (
                          <p className="text-sm text-gray-500 mt-2">
                            👨‍⚕️ {order.provider.full_name} ({order.provider.specialty})
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => onScheduleOrder(order.id)}
                      className="px-4 py-2 bg-[#008080] text-white rounded-lg font-semibold hover:bg-[#006666] transition"
                    >
                      🤖 Schedule with AI
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEDULED CARE PLANS */}
          {scheduledOrders.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Active Care Plans ({scheduledOrders.length})
              </h3>

              <div className="space-y-3">
                {scheduledOrders.map((order) => (
                  <div key={order.id} className="bg-white border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{order.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                        {order.provider && (
                          <p className="text-sm text-gray-500 mt-2">
                            👨‍⚕️ {order.provider.full_name} ({order.provider.specialty})
                          </p>
                        )}
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                        ✓ SCHEDULED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {memberOrders.length === 0 && memberAppointments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No appointments or care plans for {member.full_name}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
