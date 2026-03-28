'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, CreditCard, Search } from 'lucide-react';
import { adminApi, subscriptionsApi, usersApi } from '@/lib/api';
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
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const { data: userSearchData } = useQuery({
    queryKey: ['user-search-activation', userSearch],
    queryFn: () => usersApi.list({ search: userSearch, limit: 8 }).then((r) => r.data),
    enabled: userSearch.length >= 2,
  });

  const activateManual = useMutation({
    mutationFn: (data: ManualActivateForm) =>
      subscriptionsApi.activateManual({ ...data, days: data.days || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setActivateModal(false);
      setSelectedUser(null);
      setUserSearch('');
      reset();
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ManualActivateForm>({
    defaultValues: { plan: 'monthly' },
  });

  const subscriptions: Subscription[] = data?.subscriptions || [];
  const pagination = data?.pagination;
  const searchResults: User[] = userSearchData?.users || [];

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setValue('userId', user._id);
    setUserSearch('');
  };

  const handleCloseModal = () => {
    setActivateModal(false);
    setSelectedUser(null);
    setUserSearch('');
    reset();
  };

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
        onClose={handleCloseModal}
        title="Manual Subscription Activation"
        description="Activate a subscription for a user without payment"
        size="md"
      >
        <form onSubmit={handleSubmit((data) => activateManual.mutate(data))} className="space-y-4">
          {/* User search */}
          <div>
            <label className="label-text">Search User *</label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 bg-gray-800/60 border border-green-500/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-200">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setValue('userId', ''); }}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="input-field pl-9"
                  />
                </div>
                {userSearch.length >= 2 && searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {userSearch.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
            <input type="hidden" {...register('userId', { required: 'Selecione um usuário' })} />
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
            <button type="button" onClick={handleCloseModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={activateManual.isPending || !selectedUser} className="btn-primary flex items-center gap-2">
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
