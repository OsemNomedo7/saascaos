'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Library, Users, Zap,
  User, CreditCard, Terminal, LogOut, ChevronRight,
  Shield, Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { LevelBadge, PlanBadge } from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api';
import type { Subscription } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const userNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Content', href: '/content', icon: <Library className="w-4 h-4" /> },
  { label: 'Community', href: '/community', icon: <Users className="w-4 h-4" /> },
  { label: 'Chat', href: '/community/chat', icon: <Hash className="w-4 h-4" /> },
  { label: 'Drops', href: '/drops', icon: <Zap className="w-4 h-4" /> },
  { label: 'Plans', href: '/planos', icon: <CreditCard className="w-4 h-4" /> },
];

const accountNav: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: <User className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: <Shield className="w-4 h-4" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const subscription = subData?.subscription as Subscription | null;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900/95 border-r border-gray-800/60 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center group-hover:border-green-500/60 transition-colors">
            <Terminal className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-gradient-green font-mono block">SaaS Platform</span>
            <span className="text-xs text-gray-600 font-mono">v1.0.0</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* Main nav */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <div className="space-y-0.5">
            {userNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive(item.href) ? 'nav-link-active' : 'nav-link'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Account</p>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(isActive(item.href) ? 'nav-link-active' : 'nav-link')}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin */}
        {user?.role === 'admin' && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Admin</p>
            <div className="space-y-0.5">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(isActive(item.href) ? 'nav-link-active' : 'nav-link')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: user info */}
      <div className="p-3 border-t border-gray-800/60">
        {/* Subscription status */}
        {subscription && (
          <div className="mb-2 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Plan</span>
              <PlanBadge plan={subscription.plan} />
            </div>
          </div>
        )}

        {/* Socket status */}
        <div className="px-3 mb-2 flex items-center gap-2">
          <div className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600')} />
          <span className="text-xs text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user?.name || 'U')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <LevelBadge level={user?.level || 'iniciante'} size="sm" />
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
