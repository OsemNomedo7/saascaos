import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan';
  className?: string;
}

const colorMap = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', text: 'text-green-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', text: 'text-blue-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: 'text-yellow-400', text: 'text-yellow-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', text: 'text-red-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', text: 'text-purple-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', text: 'text-cyan-400' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'green', className }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('bg-gray-900/80 border border-gray-800/60 rounded-xl p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0', colors.bg, colors.border)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-800/40">
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive !== false && trend.value > 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {trend.value > 0 ? '+' : ''}{trend.value}
          </span>
          <span className="text-xs text-gray-600 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
