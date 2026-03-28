'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Library, Users, Zap, TrendingUp, ArrowRight,
  Download, Eye, Clock, Star, ChevronRight, Terminal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { contentApi, dropsApi, subscriptionsApi } from '@/lib/api';
import { LevelBadge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { formatRelativeDate, getContentTypeIcon, getCountdown } from '@/lib/utils';
import type { Content, Subscription } from '@/types';
import React, { useState, useEffect } from 'react';

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState(getCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (countdown.expired) {
    return <span style={{ color: '#ff0040', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>EXPIRADO</span>;
  }

  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#00ff41', textShadow: '0 0 6px rgba(0,255,65,0.4)' }}>
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

  const quickLinks: { label: string; href: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }[] = [
    { label: 'Conteúdo', href: '/content', icon: <Library className="w-5 h-5" />, color: '#00ff41', bg: 'rgba(0,255,65,0.07)', border: 'rgba(0,255,65,0.2)', desc: 'Biblioteca completa' },
    { label: 'Comunidade', href: '/community', icon: <Users className="w-5 h-5" />, color: '#00d4ff', bg: 'rgba(0,212,255,0.07)', border: 'rgba(0,212,255,0.2)', desc: 'Posts e discussões' },
    { label: 'Drops', href: '/drops', icon: <Zap className="w-5 h-5" />, color: '#ffcc00', bg: 'rgba(255,204,0,0.07)', border: 'rgba(255,204,0,0.2)', desc: 'Conteúdo exclusivo' },
    { label: 'Planos', href: '/planos', icon: <Star className="w-5 h-5" />, color: '#cc66ff', bg: 'rgba(200,100,255,0.07)', border: 'rgba(200,100,255,0.2)', desc: 'Assinar / Upgrade' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-6">
      {/* Hero Banner */}
      <div style={{
        padding: '40px 32px 36px',
        background: 'linear-gradient(160deg, rgba(0,8,0,0.72) 0%, rgba(0,20,8,0.68) 40%, rgba(0,15,20,0.72) 100%), url(https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(0,255,65,0.2)',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
      }}>
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)' }} />
        {/* Neon glows */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,65,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -20, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(150,80,255,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent 0%, #00ff41 30%, #00d4ff 60%, transparent 100%)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 8px #00ff41', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a6a3a', letterSpacing: '0.2em' }}>
                SISTEMA ATIVO // ELITE TROJAN v2.0
              </span>
            </div>
            <h1 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 700, color: '#e0ffe8', margin: '0 0 6px', lineHeight: 1.2 }}>
              Bem-vindo,{' '}
              <span style={{ color: '#00ff41', textShadow: '0 0 16px rgba(0,255,65,0.6)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#4a7a5a', margin: '0 0 12px' }}>
              {'> Acesso autorizado. Explore o conteúdo exclusivo da plataforma.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <LevelBadge level={user?.level || 'iniciante'} />
              {subscription && <PlanBadge plan={subscription.plan} />}
              {!subscription && (
                <Link href="/planos" style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                  color: '#ffcc00', textDecoration: 'none',
                  background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.2)',
                  padding: '2px 8px', borderRadius: 3,
                }}>
                  ⚡ Sem plano — Assinar agora →
                </Link>
              )}
            </div>
          </div>

          {user && (
            <div style={{ textAlign: 'right', minWidth: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a4d30', letterSpacing: '0.12em' }}>XP</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', fontWeight: 700, color: '#00ff41', textShadow: '0 0 8px rgba(0,255,65,0.5)' }}>
                  {(user.xp || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ width: 160, height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, ((user.xp || 0) / (user.level === 'iniciante' ? 100 : user.level === 'intermediario' ? 500 : user.level === 'avancado' ? 2000 : 9999)) * 100)}%`,
                  background: 'linear-gradient(90deg, #00ff41, #00d4ff)',
                  boxShadow: '0 0 8px rgba(0,255,65,0.5)',
                  borderRadius: 2,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#1a3020', textTransform: 'uppercase' }}>
                  {user.level}
                </span>
                <Link href="/niveis" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#2a5a4a', textDecoration: 'none' }}>
                  ver níveis →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(0,255,65,0.03)',
        border: '1px solid rgba(0,255,65,0.12)',
        borderRadius: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #00ff41, transparent)',
          opacity: 0.5,
        }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Terminal className="w-3.5 h-3.5" style={{ color: '#00ff41' }} />
              <span style={{ fontSize: '0.65rem', color: '#2a4d30', letterSpacing: '0.15em' }}>
                CONNECTION ESTABLISHED
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e0ffe8', lineHeight: 1.2 }}>
              Bem-vindo,{' '}
              <span style={{ color: '#00ff41', textShadow: '0 0 10px rgba(0,255,65,0.5)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <LevelBadge level={user?.level || 'iniciante'} />
              {subscription && <PlanBadge plan={subscription.plan} />}
              {!subscription && (
                <Link href="/planos" style={{ fontSize: '0.7rem', color: '#ffcc00', textDecoration: 'none' }}>
                  Sem plano ativo — Assinar agora →
                </Link>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }} className="hidden sm:block">
            <p style={{ fontSize: '0.6rem', color: '#1a3020', letterSpacing: '0.12em' }}>MEMBRO DESDE</p>
            <p style={{ fontSize: '0.78rem', color: '#4d8c5a' }}>{formatRelativeDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: link.bg,
              border: `1px solid ${link.border}`,
              borderRadius: 6,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
              onMouseOver={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 20px rgba(0,0,0,0.3), 0 0 15px ${link.bg}`;
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}>
              <div style={{
                width: 36, height: 36,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: link.color,
              }}>
                {link.icon}
              </div>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: link.color, fontFamily: 'JetBrains Mono, monospace' }}>{link.label}</p>
                <p style={{ fontSize: '0.65rem', color: link.color, opacity: 0.5, margin: '2px 0 6px', fontFamily: 'Inter, sans-serif' }}>{link.desc}</p>
                <ArrowRight className="w-3 h-3" style={{ color: link.color, opacity: 0.4 }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent content */}
        <div className="lg:col-span-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#a0c8a8' }}>
              <Library className="w-3.5 h-3.5" style={{ color: '#00ff41' }} />
              <span style={{ letterSpacing: '0.08em' }}>CONTEÚDO RECENTE</span>
            </h2>
            <Link href="/content" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.7rem', color: '#00a828', textDecoration: 'none', transition: 'color 0.15s',
            }}
              onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
              onMouseOut={e => (e.currentTarget.style.color = '#00a828')}
            >
              Ver tudo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentContent.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: 'rgba(0,255,65,0.02)',
                border: '1px solid rgba(0,255,65,0.08)',
                borderRadius: 6,
              }}>
                <Library className="w-8 h-8" style={{ color: '#1a3020', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.78rem', color: '#2a4d30' }}>Nenhum conteúdo disponível</p>
              </div>
            ) : (
              recentContent.map((item) => (
                <div key={item._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(5,10,5,0.8)',
                  border: '1px solid rgba(0,255,65,0.08)',
                  borderRadius: 5,
                  transition: 'border-color 0.15s, background 0.15s',
                  cursor: 'default',
                }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,65,0.2)';
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,255,65,0.03)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,65,0.08)';
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(5,10,5,0.8)';
                  }}>
                  <div style={{
                    width: 36, height: 36,
                    background: 'rgba(0,255,65,0.06)',
                    border: '1px solid rgba(0,255,65,0.15)',
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {getContentTypeIcon(item.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#c0e8c8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#2a4d30' }}>
                        <Eye className="w-3 h-3" /> {item.views}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#2a4d30' }}>
                        <Download className="w-3 h-3" /> {item.downloads}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', color: '#2a4d30' }}>
                        <Clock className="w-3 h-3" /> {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/content?id=${item._id}`}
                    style={{
                      padding: 7,
                      color: '#2a4d30',
                      borderRadius: 4,
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#00ff41';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,255,65,0.08)';
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#2a4d30';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'none';
                    }}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active drops */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: '#a0c8a8' }}>
                <Zap className="w-3.5 h-3.5" style={{ color: '#ffcc00' }} />
                <span style={{ letterSpacing: '0.08em' }}>DROPS ATIVOS</span>
              </h2>
              <Link href="/drops" style={{ fontSize: '0.7rem', color: '#998800', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#ffcc00')}
                onMouseOut={e => (e.currentTarget.style.color = '#998800')}>
                Ver <ChevronRight className="w-3 h-3 inline" />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDrops.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(255,204,0,0.03)',
                  border: '1px solid rgba(255,204,0,0.1)',
                  borderRadius: 6,
                }}>
                  <Zap className="w-6 h-6" style={{ color: '#443300', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '0.72rem', color: '#443300' }}>Nenhum drop ativo</p>
                </div>
              ) : (
                activeDrops.map((drop) => (
                  <div key={drop._id} style={{
                    padding: '12px',
                    background: 'rgba(255,204,0,0.04)',
                    border: '1px solid rgba(255,204,0,0.15)',
                    borderRadius: 5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c8c080', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {drop.title}
                        </p>
                        <p style={{ fontSize: '0.65rem', color: '#665500', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {drop.description}
                        </p>
                      </div>
                      <span style={{ fontSize: '1rem' }}>{getContentTypeIcon(drop.type)}</span>
                    </div>
                    {drop.dropExpiresAt && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.6rem', color: '#443300', letterSpacing: '0.1em' }}>EXPIRA EM</span>
                        <CountdownTimer expiresAt={drop.dropExpiresAt} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subscription card */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(0,255,65,0.06), rgba(0,212,255,0.04))',
            border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.5), transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00ff41' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a0c8a8', letterSpacing: '0.1em' }}>
                SEU PLANO
              </span>
            </div>
            {subscription ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#2a4d30' }}>Status</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#2a4d30' }}>Plano</span>
                  <PlanBadge plan={subscription.plan} />
                </div>
                {subscription.endDate && subscription.plan !== 'lifetime' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.65rem', color: '#2a4d30' }}>Expira</span>
                    <span style={{ fontSize: '0.72rem', color: '#4d8c5a' }}>{formatRelativeDate(subscription.endDate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.72rem', color: '#2a4d30', marginBottom: 10 }}>Sem assinatura ativa</p>
                <Link href="/planos" className="btn-hack w-full flex items-center justify-center gap-2"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', fontSize: '0.72rem', textDecoration: 'none' }}>
                  <Zap className="w-3 h-3" /> ASSINAR AGORA
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
