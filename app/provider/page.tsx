'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import Header from '@/components/shared/Header';
import RevenueMeter from '@/components/provider/RevenueMeter';
import OrderCard from '@/components/provider/OrderCard';
import Card from '@/components/ui/Card';

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
      <Header
        title="Provider Dashboard"
        userName={user?.name || 'Dr. Jones'}
        actionButton={{
          label: '+ Create New Order',
          href: '/provider/orders/new',
        }}
      />

      <main className="max-w-7xl mx-auto p-8">
        {/* Quick Actions */}
        <div className="mb-6 flex gap-4">
          <a
            href="/provider/availability"
            className="px-6 py-3 bg-white border-2 border-[#008080] text-[#008080] font-semibold rounded-lg hover:bg-[#008080] hover:text-white transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Manage Your Availability
          </a>
        </div>

        <RevenueMeter
          atRiskRevenue={atRiskRevenue}
          protectedRevenue={totalRevenue - atRiskRevenue}
          totalRevenue={totalRevenue}
          unscheduledCount={unscheduledOrders.length}
          scheduledCount={scheduledOrders.length}
          totalCount={orders.length}
        />

        <Card>
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
                <OrderCard key={order.id} order={order} showPatientInfo={true} />
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
