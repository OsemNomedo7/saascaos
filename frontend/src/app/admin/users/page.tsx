'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, UserCheck, ChevronUp, Shield } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { LevelBadge, StatusBadge, PlanBadge } from '@/components/ui/Badge';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { formatDate, formatRelativeDate, getInitials } from '@/lib/utils';
import type { User, UserLevel } from '@/types';

const LEVELS: UserLevel[] = ['iniciante', 'intermediario', 'avancado', 'elite'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [banModal, setBanModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [levelModal, setLevelModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [banReason, setBanReason] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>('iniciante');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, page }],
    queryFn: () => usersApi.list({ search: search || undefined, page, limit: 20 }).then((r) => r.data),
  });

  const banUser = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.ban(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setBanModal({ open: false, user: null });
      setBanReason('');
    },
  });

  const setLevel = useMutation({
    mutationFn: ({ id, level }: { id: string; level: string }) => usersApi.setLevel(id, level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setLevelModal({ open: false, user: null });
    },
  });

  const users: User[] = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Users Management</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email..."
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Level</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Plano</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Joined</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-5 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                          {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <LevelBadge level={user.level} />
                    </td>
                    <td className="px-4 py-3">
                      {(user as User & { subscription?: { plan: string } }).subscription
                        ? <PlanBadge plan={(user as User & { subscription: { plan: string } }).subscription.plan} />
                        : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.isBanned ? 'banned' : user.isActive ? 'active' : 'offline'} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                        <p className="text-xs text-gray-600">{user.lastLogin ? formatRelativeDate(user.lastLogin) : 'Never'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setLevelModal({ open: true, user });
                            setSelectedLevel(user.level);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title="Change level"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBanModal({ open: true, user })}
                          className={`p-1.5 rounded transition-colors ${
                            user.isBanned
                              ? 'text-gray-500 hover:text-green-400 hover:bg-green-900/20'
                              : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                          }`}
                          title={user.isBanned ? 'Unban' : 'Ban'}
                        >
                          {user.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800/40 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">
                Previous
              </button>
              <span className="text-xs text-gray-500">{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1 text-xs">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      <Modal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, user: null })}
        title={banModal.user?.isBanned ? 'Unban User' : 'Ban User'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {banModal.user?.isBanned
              ? `Unban ${banModal.user.name}?`
              : `Ban ${banModal.user?.name}?`}
          </p>
          {!banModal.user?.isBanned && (
            <div>
              <label className="label-text">Reason (optional)</label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for banning..."
                className="input-field"
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setBanModal({ open: false, user: null })} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={() => banUser.mutate({ id: banModal.user!._id, reason: banReason })}
              disabled={banUser.isPending}
              className="btn-danger text-sm flex items-center gap-2"
            >
              {banUser.isPending && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {banModal.user?.isBanned ? 'Unban' : 'Ban User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Level Modal */}
      <Modal
        isOpen={levelModal.open}
        onClose={() => setLevelModal({ open: false, user: null })}
        title="Change User Level"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Change level for {levelModal.user?.name}</p>
          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  selectedLevel === level
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setLevelModal({ open: false, user: null })} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={() => setLevel.mutate({ id: levelModal.user!._id, level: selectedLevel })}
              disabled={setLevel.isPending}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {setLevel.isPending && <div className="w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />}
              Apply
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
