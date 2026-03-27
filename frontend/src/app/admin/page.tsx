'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, Library, CreditCard, DollarSign,
  TrendingUp, Activity, UserPlus, ShoppingCart
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import StatsCard from '@/components/admin/StatsCard';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { Log } from '@/types';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.revenue().then((r) => r.data),
  });

  const stats = data?.stats;
  const recentLogs: Log[] = data?.recentLogs || [];
  const subscriptionsByPlan = data?.subscriptionsByPlan || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform statistics and overview</p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="blue"
            trend={{ value: stats?.newUsersThisMonth || 0, label: 'this month', positive: true }}
          />
          <StatsCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            icon={CreditCard}
            color="green"
            trend={{ value: stats?.newSubscriptionsThisMonth || 0, label: 'this month', positive: true }}
          />
          <StatsCard
            title="Total Content"
            value={stats?.totalContent || 0}
            icon={Library}
            color="purple"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={DollarSign}
            color="yellow"
          />
          <StatsCard
            title="New Users"
            value={stats?.newUsersThisMonth || 0}
            subtitle="This month"
            icon={UserPlus}
            color="cyan"
          />
          <StatsCard
            title="New Subscriptions"
            value={stats?.newSubscriptionsThisMonth || 0}
            subtitle="This month"
            icon={ShoppingCart}
            color="green"
          />
          <StatsCard
            title="Community Posts"
            value={stats?.totalPosts || 0}
            icon={Activity}
            color="blue"
          />
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(revenueData?.monthlyRevenue?.[0]?.total || 0)}
            subtitle="This month"
            icon={TrendingUp}
            color="yellow"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscriptions by plan */}
        <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-400" />
            Subscriptions by Plan
          </h3>
          <div className="space-y-3">
            {subscriptionsByPlan.length === 0 ? (
              <p className="text-gray-600 text-sm">No data</p>
            ) : (
              subscriptionsByPlan.map((item: { _id: string; count: number; revenue: number }) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-gray-300 capitalize">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-200">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-1">subs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue by plan */}
        {revenueData?.byPlan && (
          <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              Revenue by Plan
            </h3>
            <div className="space-y-3">
              {revenueData.byPlan.map((item: { _id: string; total: number; count: number }) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">{item._id}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-yellow-400">{formatCurrency(item.total)}</span>
                    <span className="text-xs text-gray-500 ml-1">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent logs */}
        <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <p className="text-gray-600 text-sm">No recent activity</p>
            ) : (
              recentLogs.slice(0, 8).map((log) => {
                const logUser = log.user as { name?: string; email?: string } | null;
                return (
                  <div key={log._id} className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
                      {log.action === 'login' ? '🔐' : log.action === 'register' ? '✨' : log.action === 'download' ? '📥' : log.action === 'subscribe' ? '💳' : '⚡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">
                        <span className="text-gray-300 font-medium">{logUser?.name || 'Unknown'}</span>
                        {' '}{log.action}
                      </p>
                      <p className="text-xs text-gray-600">{formatRelativeDate(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
