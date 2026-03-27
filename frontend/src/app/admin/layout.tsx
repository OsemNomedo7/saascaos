'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Library, CreditCard, FileText,
  Terminal, LogOut, ChevronRight, Shield, Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
  { label: 'Content', href: '/admin/content', icon: <Library className="w-4 h-4" /> },
  { label: 'Categories', href: '/admin/categories', icon: <FileText className="w-4 h-4" /> },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: <CreditCard className="w-4 h-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Admin sidebar */}
      <aside className="w-60 min-h-screen bg-gray-900/95 border-r border-red-900/20 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-red-900/20">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-red-400 font-mono block">Admin Panel</span>
              <span className="text-xs text-gray-600 font-mono">Control Center</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          <div className="space-y-0.5">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive(item.href)
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            ))}
          </div>

          {/* Back to dashboard */}
          <div className="mt-4 pt-4 border-t border-gray-800/60">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors">
              <Terminal className="w-4 h-4" />
              User Dashboard
            </Link>
          </div>
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-gray-800/40">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 bg-red-900/50 rounded-full flex items-center justify-center text-xs font-bold text-red-400">
              {getInitials(user?.name || 'A')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{user?.name}</p>
              <p className="text-xs text-red-400">Administrator</p>
            </div>
            <button onClick={logout} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 bg-gray-900/80 border-b border-gray-800/40 flex items-center px-6 gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
            <span className="text-red-400">$</span>
            <span>admin@saas-platform</span>
            <span className="text-gray-700">~</span>
            <span className="text-gray-400">{pathname}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">System online</span>
          </div>
        </div>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
