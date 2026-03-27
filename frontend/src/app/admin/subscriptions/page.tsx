'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, CreditCard, Search } from 'lucide-react';
import { adminApi, subscriptionsApi } from '@/lib/api';
import { PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatRelativeDate, formatCurrency } from '@/lib/utils';
import type { Subscription, User } from '@/types';

interface ManualActivateForm {
  userId: string;
  plan: 'weekly' | 'monthly' | 'lifetime';
  days?: number;
}

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [activateModal, setActivateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', { page, statusFilter, planFilter }],
    queryFn: () =>
      adminApi.subscriptions({
        page,
        limit: 20,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
      }).then((r) => r.data),
  });

  const activateManual = useMutation({
    mutationFn: (data: ManualActivateForm) =>
      subscriptionsApi.activateManual({ ...data, days: data.days || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setActivateModal(false);
      reset();
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManualActivateForm>({
    defaultValues: { plan: 'monthly' },
  });

  const subscriptions: Subscription[] = data?.subscriptions || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Subscriptions Management</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} subscriptions</p>
        </div>
        <button onClick={() => setActivateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Manual Activation
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          <option value="">All Plans</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Gateway</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Start</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500 text-sm">No subscriptions found</td></tr>
              ) : (
                subscriptions.map((sub) => {
                  const user = sub.user as User;
                  return (
                    <tr key={sub._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={sub.plan} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 capitalize">{sub.gateway}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-300">
                          {formatCurrency(sub.amount, sub.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{sub.startDate ? formatDate(sub.startDate) : '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {sub.plan === 'lifetime' ? (
                          <span className="text-xs text-yellow-400 font-mono">∞ Lifetime</span>
                        ) : sub.endDate ? (
                          <div>
                            <p className="text-xs text-gray-400">{formatDate(sub.endDate)}</p>
                            <p className="text-xs text-gray-600">{formatRelativeDate(sub.endDate)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800/40 flex items-center justify-between">
            <p className="text-xs text-gray-500">{(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Previous</button>
              <span className="text-xs text-gray-500">{page}/{pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Activation Modal */}
      <Modal
        isOpen={activateModal}
        onClose={() => { setActivateModal(false); reset(); }}
        title="Manual Subscription Activation"
        description="Activate a subscription for a user without payment"
        size="md"
      >
        <form onSubmit={handleSubmit((data) => activateManual.mutate(data))} className="space-y-4">
          <div>
            <label className="label-text">User ID *</label>
            <input
              {...register('userId', { required: 'Required' })}
              type="text"
              placeholder="MongoDB ObjectId"
              className="input-field font-mono text-sm"
            />
            {errors.userId && <p className="text-red-400 text-xs mt-1">{errors.userId.message}</p>}
          </div>

          <div>
            <label className="label-text">Plan *</label>
            <select {...register('plan')} className="input-field">
              <option value="weekly">Weekly (7 days)</option>
              <option value="monthly">Monthly (30 days)</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>

          <div>
            <label className="label-text">Custom Duration (days) — optional</label>
            <input
              {...register('days', { valueAsNumber: true, min: { value: 1, message: 'Min 1 day' } })}
              type="number"
              placeholder="Override default duration"
              className="input-field"
            />
          </div>

          {activateManual.isError && (
            <p className="text-red-400 text-sm">
              {(activateManual.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error activating subscription'}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setActivateModal(false); reset(); }} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={activateManual.isPending} className="btn-primary flex items-center gap-2">
              {activateManual.isPending && (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              )}
              <CreditCard className="w-4 h-4" />
              Activate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
