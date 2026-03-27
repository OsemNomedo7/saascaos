import { cn } from '@/lib/utils';
import type { UserLevel, SubscriptionPlan } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-800/50 text-gray-300 border-gray-700/50',
    success: 'bg-green-900/40 text-green-400 border-green-800/50',
    warning: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
    danger: 'bg-red-900/40 text-red-400 border-red-800/50',
    info: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
    ghost: 'bg-transparent text-gray-400 border-gray-700/30',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

interface LevelBadgeProps {
  level: UserLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export function LevelBadge({ level, size = 'sm', className }: LevelBadgeProps) {
  const configs: Record<UserLevel, { label: string; classes: string; dot: string }> = {
    iniciante: {
      label: 'Iniciante',
      classes: 'bg-gray-800/50 text-gray-300 border-gray-700/50',
      dot: 'bg-gray-400',
    },
    intermediario: {
      label: 'Intermediário',
      classes: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
      dot: 'bg-blue-400',
    },
    avancado: {
      label: 'Avançado',
      classes: 'bg-purple-900/40 text-purple-300 border-purple-800/50',
      dot: 'bg-purple-400',
    },
    elite: {
      label: 'Elite',
      classes: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
      dot: 'bg-yellow-400',
    },
  };

  const config = configs[level] || configs.iniciante;
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        config.classes,
        sizes[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

interface PlanBadgeProps {
  plan: SubscriptionPlan;
  size?: 'sm' | 'md';
  className?: string;
}

export function PlanBadge({ plan, size = 'sm', className }: PlanBadgeProps) {
  const configs: Record<SubscriptionPlan, { label: string; classes: string }> = {
    weekly: {
      label: 'Semanal',
      classes: 'bg-cyan-900/40 text-cyan-400 border-cyan-800/50',
    },
    monthly: {
      label: 'Mensal',
      classes: 'bg-green-900/40 text-green-400 border-green-800/50',
    },
    lifetime: {
      label: 'Vitalício',
      classes: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50',
    },
  };

  const config = configs[plan] || configs.monthly;
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium',
        config.classes,
        sizes[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const configs: Record<string, { label: string; classes: string; dot: string }> = {
    active: { label: 'Active', classes: 'bg-green-900/40 text-green-400 border-green-800/50', dot: 'bg-green-400 animate-pulse' },
    expired: { label: 'Expired', classes: 'bg-red-900/40 text-red-400 border-red-800/50', dot: 'bg-red-400' },
    cancelled: { label: 'Cancelled', classes: 'bg-gray-800/50 text-gray-400 border-gray-700/50', dot: 'bg-gray-500' },
    pending: { label: 'Pending', classes: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50', dot: 'bg-yellow-400 animate-pulse' },
    banned: { label: 'Banned', classes: 'bg-red-900/40 text-red-400 border-red-800/50', dot: 'bg-red-400' },
    online: { label: 'Online', classes: 'bg-green-900/40 text-green-400 border-green-800/50', dot: 'bg-green-400 animate-pulse' },
    offline: { label: 'Offline', classes: 'bg-gray-800/50 text-gray-500 border-gray-700/50', dot: 'bg-gray-600' },
  };

  const config = configs[status] || { label: status, classes: 'bg-gray-800/50 text-gray-400 border-gray-700/50', dot: 'bg-gray-500' };
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${config.classes} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
