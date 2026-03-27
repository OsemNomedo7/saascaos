'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, Library, CreditCard, DollarSign,
  TrendingUp, Activity, UserPlus, ShoppingCart,
  Terminal, Zap
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { Log } from '@/types';

const ACTION_ICONS: Record<string, string> = {
  login: '🔐',
  register: '✨',
  download: '📥',
  subscribe: '💳',
  upload: '📤',
  ban: '🚫',
  access: '👁',
};

const ACTION_COLORS: Record<string, string> = {
  login: '#00d4ff',
  register: '#00ff41',
  download: '#cc66ff',
  subscribe: '#ffcc00',
  upload: '#00ff41',
  ban: '#ff0040',
  access: '#4d8c5a',
};

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div style={{
      background: 'rgba(10,18,10,0.8)',
      border: `1px solid ${color}22`,
      borderRadius: 6,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}66, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 4,
          background: `${color}14`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.55rem', fontWeight: 700,
          letterSpacing: '0.15em', color: `${color}66`,
        }}>
          LIVE
        </div>
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.4rem', fontWeight: 700,
        color: '#c8e8c8',
        textShadow: `0 0 12px ${color}40`,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a4a2a', letterSpacing: '0.1em' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: `${color}88`, marginTop: 3 }}>
          +{sub}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.revenue().then((r) => r.data),
  });

  const stats = data?.stats;
  const recentLogs: Log[] = data?.recentLogs || [];
  const subscriptionsByPlan = data?.subscriptionsByPlan || [];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Terminal style={{ width: 16, height: 16, color: '#ff4400' }} />
          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ff4400',
            letterSpacing: '0.12em',
            margin: 0,
            textShadow: '0 0 12px rgba(255,68,0,0.4)',
          }}>
            {'// PAINEL DE CONTROLE'}
          </h1>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#3a1800', margin: 0 }}>
          {'> monitoramento em tempo real do sistema elite-trojan'}
        </p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 100, borderRadius: 6,
              background: 'rgba(10,18,10,0.6)',
              border: '1px solid rgba(255,68,0,0.06)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="TOTAL USUÁRIOS" value={stats?.totalUsers || 0} sub={`${stats?.newUsersThisMonth || 0} este mês`} icon={Users} color="#00d4ff" />
          <StatCard label="ASSINATURAS ATIVAS" value={stats?.activeSubscriptions || 0} sub={`${stats?.newSubscriptionsThisMonth || 0} este mês`} icon={CreditCard} color="#00ff41" />
          <StatCard label="TOTAL CONTEÚDO" value={stats?.totalContent || 0} icon={Library} color="#cc66ff" />
          <StatCard label="RECEITA TOTAL" value={formatCurrency(stats?.totalRevenue || 0)} icon={DollarSign} color="#ffcc00" />
          <StatCard label="NOVOS USUÁRIOS" value={stats?.newUsersThisMonth || 0} sub="este mês" icon={UserPlus} color="#00d4ff" />
          <StatCard label="NOVAS ASSINATURAS" value={stats?.newSubscriptionsThisMonth || 0} sub="este mês" icon={ShoppingCart} color="#00ff41" />
          <StatCard label="POSTS COMUNIDADE" value={stats?.totalPosts || 0} icon={Activity} color="#00d4ff" />
          <StatCard label="RECEITA MÊS" value={formatCurrency(revenueData?.monthlyRevenue?.[0]?.total || 0)} sub="mês atual" icon={TrendingUp} color="#ffcc00" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Subscriptions by plan */}
        <div style={{
          background: 'rgba(10,18,10,0.8)',
          border: '1px solid rgba(255,68,0,0.15)',
          borderRadius: 6,
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard style={{ width: 14, height: 14, color: '#ff4400' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#ff4400', letterSpacing: '0.1em' }}>
              ASSINATURAS POR PLANO
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subscriptionsByPlan.length === 0 ? (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a1400' }}>{'> sem dados'}</p>
            ) : (
              subscriptionsByPlan.map((item: { _id: string; count: number; revenue: number }) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4400', boxShadow: '0 0 5px #ff4400' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#c08060', textTransform: 'uppercase' }}>
                      {item._id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#ff8844' }}>
                      {item.count}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800' }}>subs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue by plan */}
        {revenueData?.byPlan && (
          <div style={{
            background: 'rgba(10,18,10,0.8)',
            border: '1px solid rgba(255,204,0,0.15)',
            borderRadius: 6,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <DollarSign style={{ width: 14, height: 14, color: '#ffcc00' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#ffcc00', letterSpacing: '0.1em' }}>
                RECEITA POR PLANO
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {revenueData.byPlan.map((item: { _id: string; total: number; count: number }) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#c08060', textTransform: 'uppercase' }}>
                    {item._id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#ffcc00' }}>
                      {formatCurrency(item.total)}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a2800' }}>
                      ({item.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent logs */}
        <div style={{
          background: 'rgba(10,18,10,0.8)',
          border: '1px solid rgba(0,255,65,0.12)',
          borderRadius: 6,
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap style={{ width: 14, height: 14, color: '#00ff41' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#00ff41', letterSpacing: '0.1em' }}>
              ATIVIDADE RECENTE
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentLogs.length === 0 ? (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#1a3020' }}>{'> sem atividade recente'}</p>
            ) : (
              recentLogs.slice(0, 10).map((log) => {
                const logUser = log.user as { name?: string; email?: string } | null;
                const color = ACTION_COLORS[log.action] || '#4d8c5a';
                return (
                  <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 3, flexShrink: 0,
                      background: `${color}14`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem',
                    }}>
                      {ACTION_ICONS[log.action] || '⚡'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#6a9a6a', margin: 0 }}>
                        <span style={{ color: '#a0c8a0', fontWeight: 700 }}>{logUser?.name || 'Unknown'}</span>
                        {' '}
                        <span style={{ color }}>{log.action}</span>
                      </p>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020', margin: '1px 0 0' }}>
                        {formatRelativeDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
