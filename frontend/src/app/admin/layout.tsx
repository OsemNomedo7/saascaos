'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Library, CreditCard, FileText,
  Terminal, LogOut, ChevronRight, AlertTriangle, Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { label: 'Usuários', href: '/admin/users', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Conteúdo', href: '/admin/content', icon: <Library className="w-3.5 h-3.5" /> },
  { label: 'Categorias', href: '/admin/categories', icon: <FileText className="w-3.5 h-3.5" /> },
  { label: 'Assinaturas', href: '/admin/subscriptions', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { label: 'Cupons', href: '/admin/coupons', icon: <Tag className="w-3.5 h-3.5" /> },
];

const AdminSkull = () => (
  <svg width="20" height="22" viewBox="0 0 36 40" fill="none"
    style={{ filter: 'drop-shadow(0 0 5px rgba(255,68,0,0.6))' }}>
    <path d="M18 2C9.163 2 2 9.163 2 18c0 5.4 2.56 10.2 6.56 13.28L9 32h18l.44-0.72C31.44 28.2 34 23.4 34 18 34 9.163 26.837 2 18 2z"
      fill="rgba(255,68,0,0.1)" stroke="#ff4400" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 32v2h2.5v3h3v-3h7v3h3v-3H27v-2H9z"
      fill="rgba(255,68,0,0.1)" stroke="#ff4400" strokeWidth="1.5"/>
    <rect x="6.5" y="13" width="8" height="7" rx="1.5" fill="#ff4400" opacity="0.9"/>
    <rect x="21.5" y="13" width="8" height="7" rx="1.5" fill="#ff4400" opacity="0.9"/>
    <path d="M15.5 23.5h5l-2.5 3.5-2.5-3.5z" fill="#ff4400" opacity="0.5"/>
  </svg>
);

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
      <div style={{ minHeight: '100vh', background: '#050a05', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid #ff4400',
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050a05' }}>
      {/* Admin Sidebar */}
      <aside style={{
        width: 224,
        minHeight: '100vh',
        background: '#080808',
        borderRight: '1px solid rgba(255,68,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,68,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'block' }}>
            <Logo size={100} />
          </Link>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#ff4400',
            textShadow: '0 0 8px rgba(255,68,0,0.4)',
          }}>ADMIN PANEL</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          <div style={{ marginBottom: 6, padding: '0 10px' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', color: '#3a1800' }}>
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
                    color: '#ff4400',
                    background: 'rgba(255,68,0,0.08)',
                    borderColor: 'rgba(255,68,0,0.25)',
                    boxShadow: '0 0 8px rgba(255,68,0,0.1)',
                  } : {
                    color: '#5a2a1a',
                  }),
                }}
                onMouseOver={e => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#ff8866';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,68,0,0.05)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,68,0,0.12)';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive(item.href)) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#5a2a1a';
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </Link>
            ))}
          </div>

          {/* Back to user dashboard */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,68,0,0.08)' }}>
            <Link href="/dashboard"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px', borderRadius: 4,
                fontSize: '0.72rem', color: '#2a2a2a',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#4d8c5a')}
              onMouseOut={e => (e.currentTarget.style.color = '#2a2a2a')}
            >
              <Terminal className="w-3.5 h-3.5" />
              Dashboard do Usuário
            </Link>
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,68,0,0.08)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
          }}>
            <div style={{
              width: 26, height: 26,
              background: 'rgba(255,68,0,0.15)',
              border: '1px solid rgba(255,68,0,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: '#ff4400', flexShrink: 0,
            }}>
              {getInitials(user?.name || 'A')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#c08060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.58rem', color: '#5a2a1a', letterSpacing: '0.08em' }}>ADMINISTRADOR</p>
            </div>
            <button onClick={logout}
              style={{ padding: 4, color: '#3a1800', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = '#ff0040')}
              onMouseOut={e => (e.currentTarget.style.color = '#3a1800')}
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
          background: 'rgba(8,8,8,0.95)',
          borderBottom: '1px solid rgba(255,68,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
            <span style={{ color: '#ff4400' }}>root</span>
            <span style={{ color: '#3a3a3a' }}>@</span>
            <span style={{ color: '#cc6600' }}>elite-trojan</span>
            <span style={{ color: '#3a3a3a' }}>:~$</span>
            <span style={{ color: '#555' }}>{pathname}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="w-3 h-3" style={{ color: '#ff4400', opacity: 0.6 }} />
            <span style={{ fontSize: '0.58rem', color: '#3a1800', letterSpacing: '0.12em' }}>ZONA RESTRITA</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 5px #00ff41', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.58rem', color: '#1a3020', letterSpacing: '0.1em' }}>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>{children}</main>
      </div>
    </div>
  );
}
