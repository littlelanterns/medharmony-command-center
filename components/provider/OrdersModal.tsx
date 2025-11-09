'use client';

import { useState } from 'react';

interface Order {
  id: string;
  patient_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimated_revenue: number;
  created_at: string;
  patient: {
    full_name: string;
  };
}

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  title: string;
  subtitle: string;
  type: 'at-risk' | 'protected';
}

type NudgeType = 'reminder' | 'encouragement' | 'karma' | 'help_offer';

export default function OrdersModal({
  isOpen,
  onClose,
  orders,
  title,
  subtitle,
  type,
}: OrdersModalProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [nudgeType, setNudgeType] = useState<NudgeType | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [awardingKarma, setAwardingKarma] = useState<string | null>(null);
  const [showKarmaModal, setShowKarmaModal] = useState(false);
  const [karmaAmount, setKarmaAmount] = useState(50);
  const [karmaReason, setKarmaReason] = useState('');
  const [selectedOrderForKarma, setSelectedOrderForKarma] = useState<Order | null>(null);

  const handleAwardKarma = async () => {
    if (!selectedOrderForKarma) return;

    setAwardingKarma(selectedOrderForKarma.id);
    try {
      // Get provider ID from localStorage (assuming provider is logged in)
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

      const response = await fetch('/api/provider/award-karma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedOrderForKarma.patient_id,
          providerId: user.id,
          points: karmaAmount,
          reason: karmaReason || `Thank you for your cooperation with ${selectedOrderForKarma.title}`,
          orderId: selectedOrderForKarma.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Awarded ${karmaAmount} karma points to ${selectedOrderForKarma.patient.full_name}!`);
        setTimeout(() => setMessage(''), 3000);
        setShowKarmaModal(false);
        setKarmaReason('');
        setKarmaAmount(50);
      } else {
        setMessage('Failed to award karma points. Please try again.');
      }
    } catch (error) {
      console.error('Error awarding karma:', error);
      setMessage('Error awarding karma points');
    } finally {
      setAwardingKarma(null);
    }
  };

  if (!isOpen) return null;

  const handleSendNudge = async (orderId: string, type: NudgeType) => {
    setSending(true);
    setSelectedOrder(orderId);
    setNudgeType(type);

    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const response = await fetch('/api/provider/send-nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          patientId: order.patient_id,
          nudgeType: type,
          orderTitle: order.title,
        }),
      });

      if (response.ok) {
        setMessage('Nudge sent successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to send nudge. Please try again.');
      }
    } catch (error) {
      console.error('Error sending nudge:', error);
      setMessage('Error sending nudge');
    } finally {
      setSending(false);
      setSelectedOrder(null);
      setNudgeType(null);
    }
  };

  const getNudgeButton = (order: Order, type: NudgeType, label: string, icon: string, description: string) => {
    const isLoading = sending && selectedOrder === order.id && nudgeType === type;

    return (
      <button
        onClick={() => handleSendNudge(order.id, type)}
        disabled={sending}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition text-xs ${
          isLoading
            ? 'bg-blue-100 border-blue-300 text-blue-700'
            : 'border-gray-200 hover:border-[#008080] hover:bg-[#008080]/5'
        }`}
        title={description}
      >
        <span className="text-xl">{isLoading ? '⏳' : icon}</span>
        <span className="font-medium">{isLoading ? 'Sending...' : label}</span>
      </button>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'stat':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'routine':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`p-6 ${type === 'at-risk' ? 'bg-red-50 border-b-4 border-red-500' : 'bg-green-50 border-b-4 border-green-500'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-3xl font-bold ${type === 'at-risk' ? 'text-red-900' : 'text-green-900'} mb-1`}>
                {title}
              </h2>
              <p className="text-gray-600">{subtitle}</p>
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
        </div>

        {/* Success Message */}
        {message && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-blue-800 text-center font-medium">{message}</p>
          </div>
        )}

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No orders in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{order.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>👤 {order.patient.full_name}</span>
                        <span>💰 ${order.estimated_revenue?.toLocaleString() || 200}</span>
                        <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(order.priority)}`}>
                      {order.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Patient Engagement Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-3 font-semibold">
                      {type === 'at-risk' ? '📢 Patient Engagement Tools' : '🎁 Patient Recognition'}
                    </p>

                    {type === 'at-risk' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        {getNudgeButton(
                          order,
                          'reminder',
                          'Reminder',
                          '🔔',
                          'Send a gentle reminder to schedule'
                        )}
                        {getNudgeButton(
                          order,
                          'encouragement',
                          'Encourage',
                          '💪',
                          'Send encouraging message about health benefits'
                        )}
                        {getNudgeButton(
                          order,
                          'karma',
                          'Karma Boost',
                          '⭐',
                          'Spend karma points to prioritize their scheduling'
                        )}
                        {getNudgeButton(
                          order,
                          'help_offer',
                          'Offer Help',
                          '🤝',
                          'Offer scheduling assistance (patient can request call back)'
                        )}
                      </div>
                    )}

                    {/* Karma Award Button - For all orders */}
                    <button
                      onClick={() => {
                        setSelectedOrderForKarma(order);
                        setShowKarmaModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition shadow-md"
                    >
                      <span className="text-lg">🎁</span>
                      <span>Award Karma Points</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Total: {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Karma Award Modal */}
      {showKarmaModal && selectedOrderForKarma && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-400">
              <h3 className="text-2xl font-bold text-white">🎁 Award Karma Points</h3>
              <p className="text-white/90 mt-1">Reward {selectedOrderForKarma.patient.full_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How many karma points?
                </label>
                <div className="flex gap-2 mb-3">
                  {[25, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setKarmaAmount(amount)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        karmaAmount === amount
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={karmaAmount}
                  onChange={(e) => setKarmaAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Custom amount"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={karmaReason}
                  onChange={(e) => setKarmaReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Why are you awarding karma points?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAwardKarma}
                  disabled={awardingKarma !== null || karmaAmount <= 0}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-bold transition ${
                    awardingKarma !== null || karmaAmount <= 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-yellow-500 hover:to-orange-500'
                  }`}
                >
                  {awardingKarma ? '⏳ Awarding...' : `🎁 Award ${karmaAmount} Points`}
                </button>
                <button
                  onClick={() => {
                    setShowKarmaModal(false);
                    setKarmaReason('');
                    setKarmaAmount(50);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
