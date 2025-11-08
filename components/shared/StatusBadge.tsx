interface StatusBadgeProps {
  status: 'unscheduled' | 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'no-show';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'unscheduled':
        return {
          className: 'bg-red-100 text-red-700',
          label: 'UNSCHEDULED',
          icon: '🔴',
        };
      case 'scheduled':
        return {
          className: 'bg-green-100 text-green-700',
          label: 'SCHEDULED',
          icon: '✅',
        };
      case 'completed':
        return {
          className: 'bg-blue-100 text-blue-700',
          label: 'COMPLETED',
          icon: '✓',
        };
      case 'cancelled':
        return {
          className: 'bg-gray-100 text-gray-700',
          label: 'CANCELLED',
          icon: '✕',
        };
      case 'confirmed':
        return {
          className: 'bg-green-100 text-green-700',
          label: 'CONFIRMED',
          icon: '✓',
        };
      case 'no-show':
        return {
          className: 'bg-orange-100 text-orange-700',
          label: 'NO-SHOW',
          icon: '⚠',
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span className={`${config.className} ${sizeClasses[size]} rounded-full font-bold inline-flex items-center gap-1`}>
      {showIcon && config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
