import StatusBadge from '@/components/shared/StatusBadge';
import { Order } from '@/lib/types';

interface OrderCardProps {
  order: Order & {
    patient?: { full_name: string };
    prerequisites?: any[];
  };
  showPatientInfo?: boolean;
}

export default function OrderCard({ order, showPatientInfo = true }: OrderCardProps) {
  return (
    <div className="p-6 hover:bg-gray-50 transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">{order.title}</h3>
            <StatusBadge status={order.status} />
          </div>

          {showPatientInfo && (
            <p className="text-gray-600 mb-2">
              Patient: <span className="font-semibold">{order.patient?.full_name || 'Unknown'}</span>
            </p>
          )}

          <div className="flex gap-4 text-sm text-gray-500">
            <span>Type: {order.order_type}</span>
            <span>Priority: {order.priority}</span>
            {order.prerequisites && <span>{order.prerequisites.length} prerequisites</span>}
          </div>

          {order.status === 'unscheduled' && (
            <div className="mt-3 flex items-center text-sm text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Waiting for patient to schedule
            </div>
          )}

          {order.status === 'scheduled' && (
            <div className="mt-3 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Patient has scheduled appointment
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">${order.estimated_revenue || 200}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
