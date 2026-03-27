'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User, Calendar, Shield, Activity, CreditCard,
  Clock, Edit2, Save, X, Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, subscriptionsApi } from '@/lib/api';
import { LevelBadge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatRelativeDate, getInitials } from '@/lib/utils';
import type { Subscription, Log } from '@/types';
import Link from 'next/link';

interface EditForm {
  name: string;
  avatar: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    defaultValues: { name: user?.name || '', avatar: user?.avatar || '' },
  });

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
  });

  const { data: activityData } = useQuery({
    queryKey: ['user-activity', user?._id],
    queryFn: () => usersApi.getActivity(user!._id).then((r) => r.data),
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: (data: EditForm) => usersApi.update(user!._id, data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const subscription = subData?.subscription as Subscription | null;
  const history = subData?.history as Subscription[] || [];
  const logs: Log[] = activityData?.logs || [];

  const onSubmit = (data: EditForm) => {
    updateProfile.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset({ name: user?.name || '', avatar: user?.avatar || '' });
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-300 mx-auto mb-4 relative">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-900" />
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <input
                      {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                      type="text"
                      className="input-field text-center text-sm"
                      placeholder="Your name"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <input
                      {...register('avatar')}
                      type="url"
                      className="input-field text-center text-sm"
                      placeholder="Avatar URL (optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleCancelEdit} className="flex-1 btn-secondary text-sm py-1.5 flex items-center justify-center gap-1">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button type="submit" disabled={updateProfile.isPending} className="flex-1 btn-primary text-sm py-1.5 flex items-center justify-center gap-1">
                      {updateProfile.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-100">{user.name}</h2>
                    {saveSuccess && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{user.email}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Profile
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <LevelBadge level={user.level} size="md" />
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1 text-sm px-2.5 py-1 bg-red-900/30 text-red-400 border border-red-800/50 rounded-md font-medium">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="mt-5 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Joined
                  </span>
                  <span className="text-gray-300">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Last login
                  </span>
                  <span className="text-gray-300">{user.lastLogin ? formatRelativeDate(user.lastLogin) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-green-400" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <PlanBadge plan={subscription.plan} />
                          <StatusBadge status={subscription.status} />
                        </div>
                        {subscription.endDate && subscription.plan !== 'lifetime' && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Expires {formatRelativeDate(subscription.endDate)}
                          </p>
                        )}
                        {subscription.plan === 'lifetime' && (
                          <p className="text-xs text-gray-500 mt-0.5">Never expires</p>
                        )}
                      </div>
                    </div>
                    <Link href="/planos" className="text-xs text-green-400 hover:text-green-300 transition-colors">
                      Manage →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-3">No active subscription</p>
                  <Link href="/planos" className="btn-primary text-sm inline-flex items-center gap-2">
                    Subscribe Now
                  </Link>
                </div>
              )}

              {/* History */}
              {history.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">History</p>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((sub) => (
                      <div key={sub._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-800/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <PlanBadge plan={sub.plan} size="sm" />
                          <span className="text-gray-500 text-xs">{sub.gateway}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.status} size="sm" />
                          <span className="text-xs text-gray-600">{formatDate(sub.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-green-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 8).map((log) => (
                    <div key={log._id} className="flex items-center gap-3 py-2 border-b border-gray-800/30 last:border-0">
                      <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                        {log.action === 'login' ? '🔐' :
                         log.action === 'download' ? '📥' :
                         log.action === 'access' ? '👁️' :
                         log.action === 'register' ? '✨' : '⚡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 capitalize">{log.action}</p>
                        {log.resourceType && (
                          <p className="text-xs text-gray-600">{log.resourceType}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">{formatRelativeDate(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
