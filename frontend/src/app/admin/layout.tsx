'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Library, CreditCard, FileText,
  Terminal, LogOut, ChevronRight, AlertTriangle, Tag, Menu, X, UserCheck,
  MessageSquare, Hash, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { label: 'Usuários', href: '/admin/users', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Conteúdo', href: '/admin/content', icon: <Library className="w-3.5 h-3.5" /> },
  { label: 'Categorias', href: '/admin/categories', icon: <FileText className="w-3.5 h-3.5" /> },
  { label: 'Assinaturas', href: '/admin/subscriptions', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { label: 'Cupons', href: '/admin/coupons', icon: <Tag className="w-3.5 h-3.5" /> },
  { label: 'Afiliados', href: '/admin/affiliates', icon: <UserCheck className="w-3.5 h-3.5" /> },
  { label: 'Drops', href: '/admin/drops', icon: <Zap className="w-3.5 h-3.5" /> },
  { label: 'Comunidade', href: '/admin/community', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { label: 'Chat', href: '/admin/chat', icon: <Hash className="w-3.5 h-3.5" /> },
];

const AdminSkull = () => (
  <svg width="20" height="22" viewBox="0 0 36 40" fill="none"
    style={{ filter: 'drop-shadow(0 0 5px rgba(0,212,255,0.6))' }}>
    <path d="M18 2C9.163 2 2 9.163 2 18c0 5.4 2.56 10.2 6.56 13.28L9 32h18l.44-0.72C31.44 28.2 34 23.4 34 18 34 9.163 26.837 2 18 2z"
      fill="rgba(0,212,255,0.1)" stroke="#00d4ff" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 32v2h2.5v3h3v-3h7v3h3v-3H27v-2H9z"
      fill="rgba(0,212,255,0.1)" stroke="#00d4ff" strokeWidth="1.5"/>
    <rect x="6.5" y="13" width="8" height="7" rx="1.5" fill="#00d4ff" opacity="0.9"/>
    <rect x="21.5" y="13" width="8" height="7" rx="1.5" fill="#00d4ff" opacity="0.9"/>
    <path d="M15.5 23.5h5l-2.5 3.5-2.5-3.5z" fill="#00d4ff" opacity="0.5"/>
  </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#040b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid #00d4ff',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#040b14' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(4,11,20,0.85)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 224,
          minHeight: '100vh',
          background: '#060d18',
          borderRight: '1px solid rgba(0,150,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}>
        {/* Logo */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,150,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'block' }} onClick={() => setSidebarOpen(false)}>
            <Logo size={140} />
          </Link>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#00d4ff',
            textShadow: '0 0 8px rgba(0,212,255,0.5)',
          }}>ADMIN PANEL</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{
              position: 'absolute', right: 8, top: 8,
              padding: 4, color: '#708090', background: 'none', border: 'none',
              cursor: 'pointer', transition: 'color 0.15s', borderRadius: 4,
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#00d4ff')}
            onMouseOut={e => (e.currentTarget.style.color = '#708090')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          <div style={{ marginBottom: 6, padding: '0 10px' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', color: '#708090' }}>
              {'// CONTROLES'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  fontSize: '0.76rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  border: '1px solid transparent',
                  ...(isActive(item.href) ? {
                    color: '#00d4ff',
                    background: 'rgba(0,212,255,0.08)',
                    borderColor: 'rgba(0,212,255,0.25)',
                    boxShadow: '0 0 8px rgba(0,212,255,0.1)',
                  } : {
                    color: '#a8c4d4',
                  }),
                }}
                onMouseOver={e => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#40c8ff';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,150,255,0.06)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,150,255,0.15)';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#a8c4d4';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent';
                  }
                }}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </Link>
            ))}
          </div>

          {/* Back to user dashboard */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,150,255,0.08)' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px', borderRadius: 4,
                fontSize: '0.72rem', color: '#8aabbb',
                textDecoration: 'none', transition: 'all 0.15s',
                border: '1px solid transparent',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#00d4ff';
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,212,255,0.06)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,212,255,0.15)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#8aabbb';
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent';
              }}
            >
              <Terminal className="w-3.5 h-3.5" />
              Dashboard do Usuário
            </Link>
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(0,150,255,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
          }}>
            <div style={{
              width: 26, height: 26,
              background: 'rgba(0,150,255,0.15)',
              border: '1px solid rgba(0,150,255,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: '#00d4ff', flexShrink: 0,
            }}>
              {getInitials(user?.name || 'A')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#80c8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.58rem', color: '#a8c4d4', letterSpacing: '0.08em' }}>ADMINISTRADOR</p>
            </div>
            <button onClick={logout}
              style={{ padding: 4, color: '#8aabbb', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = '#ff0040')}
              onMouseOut={e => (e.currentTarget.style.color = '#8aabbb')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 44,
          background: 'rgba(6,13,24,0.95)',
          borderBottom: '1px solid rgba(0,150,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 8px',
          gap: 8,
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
            style={{
              padding: 6, color: '#708090', background: 'none', border: 'none',
              cursor: 'pointer', transition: 'color 0.15s', borderRadius: 4, flexShrink: 0,
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#00d4ff')}
            onMouseOut={e => (e.currentTarget.style.color = '#708090')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <span style={{ color: '#00d4ff', flexShrink: 0 }}>root</span>
            <span className="hidden sm:inline" style={{ color: '#8aabbb' }}>@</span>
            <span className="hidden sm:inline" style={{ color: '#0096ff' }}>elite-trojan</span>
            <span style={{ color: '#8aabbb', flexShrink: 0 }}>:~$</span>
            <span style={{ color: '#8898aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pathname}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <AlertTriangle className="w-3 h-3" style={{ color: '#00d4ff', opacity: 0.6 }} />
            <span className="hidden sm:inline" style={{ fontSize: '0.58rem', color: '#9ab8c8', letterSpacing: '0.12em' }}>ZONA RESTRITA</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 5px #00ff41', animation: 'pulse 2s infinite' }} />
              <span className="hidden sm:inline" style={{ fontSize: '0.58rem', color: '#7a9aaa', letterSpacing: '0.1em' }}>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</main>
      </div>
    </div>
  );
}
