'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import Link from 'next/link';

export default function ProviderDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadOrders(userData.id);
      subscribeToOrders(userData.id);
    }
  }, []);

  const loadOrders = async (providerId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        patient:users!orders_patient_id_fkey(full_name),
        prerequisites(*)
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  const subscribeToOrders = (providerId: string) => {
    const channel = supabase
      .channel('provider-orders')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `provider_id=eq.${providerId}`
        },
        (payload) => {
          console.log('Order changed:', payload);
          loadOrders(providerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const unscheduledOrders = orders.filter(o => o.status === 'unscheduled');
  const scheduledOrders = orders.filter(o => o.status === 'scheduled');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.estimated_revenue || 200), 0);
  const atRiskRevenue = unscheduledOrders.reduce((sum, o) => sum + (o.estimated_revenue || 200), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Provider Dashboard</h1>
            <p className="text-white/80 mt-1">Welcome, {user?.name || 'Dr. Jones'}</p>
          </div>
          <Link
            href="/provider/orders/new"
            className="btn-primary"
          >
            + Create New Order
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {/* Revenue Protection Meter */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Revenue Protection Meter</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-600">
              <div className="text-red-600 font-semibold mb-2">AT RISK</div>
              <div className="text-4xl font-bold text-red-700">${atRiskRevenue.toLocaleString()}</div>
              <div className="text-gray-600 mt-2">{unscheduledOrders.length} unscheduled orders</div>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
              <div className="text-green-600 font-semibold mb-2">PROTECTED</div>
              <div className="text-4xl font-bold text-green-700">
                ${(totalRevenue - atRiskRevenue).toLocaleString()}
              </div>
              <div className="text-gray-600 mt-2">{scheduledOrders.length} scheduled orders</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <div className="text-blue-600 font-semibold mb-2">TOTAL VALUE</div>
              <div className="text-4xl font-bold text-blue-700">${totalRevenue.toLocaleString()}</div>
              <div className="text-gray-600 mt-2">{orders.length} total orders</div>
            </div>
          </div>

          {atRiskRevenue > 0 && (
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-yellow-800 font-semibold">
                ⚠️ {unscheduledOrders.length} {unscheduledOrders.length === 1 ? 'order needs' : 'orders need'} patient scheduling to prevent revenue leakage
              </p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {unscheduledOrders.length} Unscheduled
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                {scheduledOrders.length} Scheduled
              </span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No orders yet.</p>
              <p className="mt-2">Create your first order to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order: any) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{order.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'unscheduled'
                            ? 'bg-red-100 text-red-700'
                            : order.status === 'scheduled'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status === 'unscheduled' ? '🔴 UNSCHEDULED' : '✅ SCHEDULED'}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-2">
                        Patient: <span className="font-semibold">{order.patient?.full_name || 'Unknown'}</span>
                      </p>

                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Type: {order.order_type}</span>
                        <span>Priority: {order.priority}</span>
                        <span>{order.prerequisites?.length || 0} prerequisites</span>
                      </div>

                      {order.status === 'unscheduled' && (
                        <div className="mt-3 flex items-center text-sm text-orange-600">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Waiting for patient to schedule
                        </div>
                      )}

                      {order.status === 'scheduled' && (
                        <div className="mt-3 flex items-center text-sm text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Patient has scheduled appointment
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        ${order.estimated_revenue || 200}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
