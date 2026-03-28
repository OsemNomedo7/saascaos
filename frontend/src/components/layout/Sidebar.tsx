'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Library, Users, Zap,
  User, CreditCard, Terminal, LogOut, ChevronRight,
  Shield, Hash, Heart, Download, Star
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
}

const userNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { label: 'Conteúdo', href: '/content', icon: <Library className="w-3.5 h-3.5" /> },
  { label: 'Comunidade', href: '/community', icon: <Users className="w-3.5 h-3.5" /> },
  { label: 'Chat', href: '/community/chat', icon: <Hash className="w-3.5 h-3.5" /> },
  { label: 'Drops', href: '/drops', icon: <Zap className="w-3.5 h-3.5" /> },
  { label: 'Planos', href: '/planos', icon: <CreditCard className="w-3.5 h-3.5" /> },
];

const accountNav: NavItem[] = [
  { label: 'Perfil', href: '/profile', icon: <User className="w-3.5 h-3.5" /> },
  { label: 'Favoritos', href: '/favorites', icon: <Heart className="w-3.5 h-3.5" /> },
  { label: 'Histórico', href: '/history', icon: <Download className="w-3.5 h-3.5" /> },
  { label: 'Níveis', href: '/niveis', icon: <Star className="w-3.5 h-3.5" /> },
];

const adminNav: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: <Shield className="w-3.5 h-3.5" /> },
];

const SkullMini = () => (
  <svg width="22" height="26" viewBox="0 0 36 40" fill="none"
    style={{ filter: 'drop-shadow(0 0 5px rgba(0,120,255,0.5))' }}>
    <path d="M18 2C9.163 2 2 9.163 2 18c0 5.4 2.56 10.2 6.56 13.28L9 32h18l.44-0.72C31.44 28.2 34 23.4 34 18 34 9.163 26.837 2 18 2z"
      fill="rgba(0,120,255,0.08)" stroke="#0096ff" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M9 32v2h2.5v3h3v-3h7v3h3v-3H27v-2H9z"
      fill="rgba(0,120,255,0.08)" stroke="#0096ff" strokeWidth="1.6"/>
    <rect x="6.5" y="13" width="8" height="7" rx="1.5" fill="#00d4ff" opacity="0.9"/>
    <rect x="21.5" y="13" width="8" height="7" rx="1.5" fill="#00d4ff" opacity="0.9"/>
    <path d="M15.5 23.5h5l-2.5 3.5-2.5-3.5z" fill="#0096ff" opacity="0.7"/>
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [avatarImgError, setAvatarImgError] = React.useState(false);
  React.useEffect(() => { setAvatarImgError(false); }, [user?.avatar]);
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

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#060d18',
      borderRight: '1px solid rgba(0,120,255,0.12)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(0,120,255,0.1)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <SkullMini />
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#0096ff',
              textShadow: '0 0 8px rgba(0,120,255,0.5)',
            }}>
              ELITE TROJAN
            </div>
            <div style={{ fontSize: '0.58rem', color: '#0d1f38', letterSpacing: '0.12em', marginTop: 1 }}>
              v2.0.0 // SISTEMA
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Main nav */}
        <div>
          <div className="section-hack">{'// NAVEGAÇÃO'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {userNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(isActive(item.href) ? 'nav-link-active' : 'nav-link')}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="section-hack">{'// CONTA'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {accountNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(isActive(item.href) ? 'nav-link-active' : 'nav-link')}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Admin */}
        {user?.role === 'admin' && (
          <div>
            <div className="section-hack" style={{ color: '#0a1a3d' }}>{'// ADMIN'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(isActive(item.href) ? 'nav-link-active' : 'nav-link')}
                  style={isActive(item.href) ? {
                    color: '#ff4400',
                    background: 'rgba(255,68,0,0.08)',
                    borderColor: 'rgba(255,68,0,0.25)',
                    boxShadow: '0 0 8px rgba(255,68,0,0.1)',
                  } : { color: '#4d2a1a' }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(0,120,255,0.08)' }}>
        {/* Subscription */}
        {subscription && (
          <div style={{
            marginBottom: 8,
            padding: '8px 12px',
            background: 'rgba(0,120,255,0.04)',
            border: '1px solid rgba(0,120,255,0.15)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.62rem', color: '#1a3560', letterSpacing: '0.1em' }}>PLANO</span>
            <PlanBadge plan={subscription.plan} />
          </div>
        )}

        {/* Socket status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          marginBottom: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isConnected ? '#0096ff' : '#3a3a3a',
            boxShadow: isConnected ? '0 0 6px #0096ff' : undefined,
            animation: isConnected ? 'pulse 2s infinite' : undefined,
          }} />
          <span style={{ fontSize: '0.6rem', color: '#0d1f38', letterSpacing: '0.1em' }}>
            {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
          </span>
        </div>

        {/* User info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 4,
          transition: 'background 0.15s',
          cursor: 'default',
        }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,120,255,0.04)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={{
            width: 30, height: 30,
            background: user?.avatar
              ? `url(${user.avatar}) center top / cover no-repeat, rgba(0,120,255,0.1)`
              : 'rgba(0,120,255,0.1)',
            border: '1px solid rgba(0,120,255,0.25)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#0096ff',
            flexShrink: 0,
          }}>
            {!user?.avatar && getInitials(user?.name || 'U')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#a0c0e0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{user?.name}</p>
            <LevelBadge level={user?.level || 'iniciante'} size="sm" />
          </div>
          <button
            onClick={logout}
            style={{ padding: 4, color: '#1a3560', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Sair"
            onMouseOver={e => (e.currentTarget.style.color = '#ff0040')}
            onMouseOut={e => (e.currentTarget.style.color = '#1a3560')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
