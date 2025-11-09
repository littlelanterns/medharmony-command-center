import Card from '@/components/ui/Card';

interface RevenueMeterProps {
  atRiskRevenue: number;
  protectedRevenue: number;
  totalRevenue: number;
  unscheduledCount: number;
  scheduledCount: number;
  totalCount: number;
  onAtRiskClick?: () => void;
  onProtectedClick?: () => void;
}

export default function RevenueMeter({
  atRiskRevenue,
  protectedRevenue,
  totalRevenue,
  unscheduledCount,
  scheduledCount,
  totalCount,
  onAtRiskClick,
  onProtectedClick,
}: RevenueMeterProps) {
  return (
    <Card className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Revenue Protection Meter</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* At Risk - Clickable */}
        <button
          onClick={onAtRiskClick}
          className="bg-red-50 rounded-lg p-6 border-l-4 border-red-600 text-left hover:bg-red-100 transition cursor-pointer"
        >
          <div className="text-red-600 font-semibold mb-2 flex items-center justify-between">
            <span>AT RISK</span>
            {unscheduledCount > 0 && <span className="text-sm">👁️ View</span>}
          </div>
          <div className="text-4xl font-bold text-red-700">${atRiskRevenue.toLocaleString()}</div>
          <div className="text-gray-600 mt-2">
            {unscheduledCount} unscheduled {unscheduledCount === 1 ? 'order' : 'orders'}
          </div>
        </button>

        {/* Protected - Clickable */}
        <button
          onClick={onProtectedClick}
          className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600 text-left hover:bg-green-100 transition cursor-pointer"
        >
          <div className="text-green-600 font-semibold mb-2 flex items-center justify-between">
            <span>PROTECTED</span>
            {scheduledCount > 0 && <span className="text-sm">👁️ View</span>}
          </div>
          <div className="text-4xl font-bold text-green-700">${protectedRevenue.toLocaleString()}</div>
          <div className="text-gray-600 mt-2">
            {scheduledCount} scheduled {scheduledCount === 1 ? 'order' : 'orders'}
          </div>
        </button>

        {/* Total Value */}
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
          <div className="text-blue-600 font-semibold mb-2">TOTAL VALUE</div>
          <div className="text-4xl font-bold text-blue-700">${totalRevenue.toLocaleString()}</div>
          <div className="text-gray-600 mt-2">
            {totalCount} total {totalCount === 1 ? 'order' : 'orders'}
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      {atRiskRevenue > 0 && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <p className="text-yellow-800 font-semibold">
            ⚠️ {unscheduledCount} {unscheduledCount === 1 ? 'order needs' : 'orders need'} patient
            scheduling to prevent revenue leakage
          </p>
        </div>
      )}
    </Card>
  );
}
