'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Library, Users, Zap, TrendingUp, ArrowRight,
  Download, Eye, Clock, Star, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { contentApi, dropsApi, subscriptionsApi } from '@/lib/api';
import { LevelBadge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatRelativeDate, formatBytes, getContentTypeIcon, getCountdown } from '@/lib/utils';
import type { Content, Subscription } from '@/types';
import { useState, useEffect } from 'react';

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState(getCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (countdown.expired) {
    return <span className="text-red-400 font-mono text-xs">Expired</span>;
  }

  return (
    <span className="font-mono text-xs text-green-400">
      {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: contentData } = useQuery({
    queryKey: ['recent-content'],
    queryFn: () => contentApi.list({ limit: 6, sort: '-createdAt' }).then((r) => r.data),
  });

  const { data: dropsData } = useQuery({
    queryKey: ['active-drops'],
    queryFn: () => dropsApi.list().then((r) => r.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
  });

  const recentContent: Content[] = contentData?.contents || [];
  const activeDrops: Content[] = dropsData?.drops?.slice(0, 3) || [];
  const subscription = subData?.subscription as Subscription | null;

  const quickLinks = [
    { label: 'Browse Content', href: '/content', icon: <Library className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Community', href: '/community', icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Active Drops', href: '/drops', icon: <Zap className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Upgrade Plan', href: '/planos', icon: <Star className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Welcome back,{' '}
            <span className="text-gradient-green">{user?.name?.split(' ')[0]}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <LevelBadge level={user?.level || 'iniciante'} />
            {subscription && <PlanBadge plan={subscription.plan} />}
            {!subscription && (
              <Link href="/planos" className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                No active plan — Subscribe now
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Member since</p>
            <p className="text-sm text-gray-300">{formatRelativeDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card hover className={`p-4 border ${link.bg} flex flex-col gap-3`}>
              <div className={`w-10 h-10 rounded-lg bg-gray-900/60 flex items-center justify-center ${link.color}`}>
                {link.icon}
              </div>
              <div>
                <p className={`text-sm font-medium ${link.color}`}>{link.label}</p>
                <ArrowRight className={`w-3.5 h-3.5 mt-0.5 ${link.color} opacity-60`} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent content */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Library className="w-4 h-4 text-green-400" />
              Recent Content
            </h2>
            <Link href="/content" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentContent.length === 0 ? (
              <Card className="p-8 text-center">
                <Library className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No content available yet</p>
              </Card>
            ) : (
              recentContent.map((item) => (
                <Card key={item._id} hover className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {getContentTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {item.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> {item.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/content?id=${item._id}`}
                    className="p-2 text-gray-600 hover:text-green-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Active Drops */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Zap className="w-4 h-4 text-yellow-400" />
              Active Drops
            </h2>
            <Link href="/drops" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeDrops.length === 0 ? (
              <Card className="p-6 text-center">
                <Zap className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No active drops</p>
              </Card>
            ) : (
              activeDrops.map((drop) => (
                <Card key={drop._id} className="p-4 border border-yellow-500/10 bg-yellow-500/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{drop.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{drop.description}</p>
                    </div>
                    <span className="text-lg">{getContentTypeIcon(drop.type)}</span>
                  </div>
                  {drop.dropExpiresAt && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Expires in</span>
                      <CountdownTimer expiresAt={drop.dropExpiresAt} />
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Subscription card */}
          <Card className="mt-4 p-4 bg-gradient-to-br from-green-900/20 to-cyan-900/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-200">Your Plan</span>
            </div>
            {subscription ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Plan</span>
                  <PlanBadge plan={subscription.plan} />
                </div>
                {subscription.endDate && subscription.plan !== 'lifetime' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Expires</span>
                    <span className="text-xs text-gray-300">{formatRelativeDate(subscription.endDate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-2">No active subscription</p>
                <Link href="/planos" className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> Subscribe Now
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
