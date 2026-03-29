'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users, Library, CreditCard, DollarSign,
  TrendingUp, Activity, UserPlus, ShoppingCart,
  Terminal, Zap, Bell, Download, BarChart2, Send
} from 'lucide-react';
import { adminApi, adminExtApi } from '@/lib/api';
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

function GrowthChart({ data }: { data: { _id: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#1a3020' }}>
        {'> sem dados de crescimento'}
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const recent = data.slice(-14); // last 14 days

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
      {recent.map((day) => {
        const height = Math.max(4, (day.count / maxCount) * 60);
        const date = new Date(day._id);
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        return (
          <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            title={`${label}: ${day.count}`}>
            <div style={{
              width: '100%', height: `${height}px`,
              background: `linear-gradient(180deg, #00ff41, #00ff4166)`,
              borderRadius: '2px 2px 0 0',
              boxShadow: '0 0 4px rgba(0,255,65,0.3)',
              transition: 'height 0.3s ease',
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'subscribers'>('all');
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminApi.revenue().then((r) => r.data),
  });

  const { data: growthData } = useQuery({
    queryKey: ['admin-growth'],
    queryFn: () => adminExtApi.growth().then((r) => r.data),
  });

  const sendNotification = useMutation({
    mutationFn: () => adminExtApi.sendNotification({
      title: notifTitle,
      message: notifMessage,
      target: notifTarget,
      type: 'system',
    }),
    onSuccess: (res) => {
      setNotifSuccess(`✓ Notificação enviada para ${res.data.count || 0} usuários`);
      setNotifTitle('');
      setNotifMessage('');
      setNotifError('');
      setTimeout(() => setNotifSuccess(''), 5000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setNotifError(e.response?.data?.message || 'Erro ao enviar notificação');
    },
  });

  const handleExportCSV = async () => {
    try {
      const res = await adminExtApi.exportUsers();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Silently fail
    }
  };

  const stats = data?.stats;
  const recentLogs: Log[] = data?.recentLogs || [];
  const subscriptionsByPlan = data?.subscriptionsByPlan || [];
  const growthUsers: { _id: string; count: number }[] = growthData?.newUsers || [];
  const growthSubs: { _id: string; count: number }[] = growthData?.newSubscriptions || [];

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,150,255,0.04)',
    border: '1px solid rgba(0,150,255,0.2)',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0c8b8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.75rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Terminal style={{ width: 16, height: 16, color: '#00d4ff' }} />
            <h1 style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.1rem', fontWeight: 700,
              color: '#00d4ff', letterSpacing: '0.12em', margin: 0,
              textShadow: '0 0 12px rgba(0,150,255,0.4)',
            }}>
              {'// PAINEL DE CONTROLE'}
            </h1>
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#0a1e2e', margin: 0 }}>
            {'> monitoramento em tempo real do sistema elite-trojan'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
            color: '#00d4ff', background: 'rgba(0,212,255,0.06)',
            border: '1px solid rgba(0,212,255,0.2)',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'; }}
        >
          <Download style={{ width: 13, height: 13 }} />
          EXPORTAR USUÁRIOS CSV
        </button>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 100, borderRadius: 6,
              background: 'rgba(10,18,10,0.6)',
              border: '1px solid rgba(0,150,255,0.06)',
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

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* User growth chart */}
        <div style={{
          background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.15)',
          borderRadius: 6, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 style={{ width: 14, height: 14, color: '#00ff41' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#00ff41', letterSpacing: '0.1em' }}>
              NOVOS USUÁRIOS (30 DIAS)
            </span>
          </div>
          <GrowthChart data={growthUsers} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020', marginTop: 8 }}>
            Total: {growthUsers.reduce((s, d) => s + d.count, 0)} nos últimos 30 dias
          </p>
        </div>

        {/* Subscription growth chart */}
        <div style={{
          background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(255,204,0,0.15)',
          borderRadius: 6, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 style={{ width: 14, height: 14, color: '#ffcc00' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#ffcc00', letterSpacing: '0.1em' }}>
              NOVAS ASSINATURAS (30 DIAS)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
            {(growthSubs.slice(-14) || []).map((day) => {
              const maxCount = Math.max(...(growthSubs.map((d) => d.count)), 1);
              const height = Math.max(4, (day.count / maxCount) * 60);
              const date = new Date(day._id);
              const label = `${date.getDate()}/${date.getMonth() + 1}`;
              return (
                <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                  title={`${label}: ${day.count}`}>
                  <div style={{
                    width: '100%', height: `${height}px`,
                    background: 'linear-gradient(180deg, #ffcc00, #ffcc0066)',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '0 0 4px rgba(255,204,0,0.3)',
                  }} />
                </div>
              );
            })}
            {growthSubs.length === 0 && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#1a3020' }}>
                {'> sem dados'}
              </p>
            )}
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a2800', marginTop: 8 }}>
            Total: {growthSubs.reduce((s, d) => s + d.count, 0)} nos últimos 30 dias
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Subscriptions by plan */}
        <div style={{
          background: 'rgba(10,18,10,0.8)',
          border: '1px solid rgba(0,150,255,0.15)',
          borderRadius: 6,
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard style={{ width: 14, height: 14, color: '#00d4ff' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em' }}>
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
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 5px #00d4ff' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#70b0d0', textTransform: 'uppercase' }}>
                      {item._id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#ff8844' }}>
                      {item.count}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#0a1e2e' }}>subs</span>
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
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#70b0d0', textTransform: 'uppercase' }}>
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

        {/* Send notification */}
        <div style={{
          background: 'rgba(10,18,10,0.8)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: 6,
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell style={{ width: 14, height: 14, color: '#00d4ff' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em' }}>
              ENVIAR NOTIFICAÇÃO
            </span>
          </div>

          {notifSuccess && (
            <div style={{ marginBottom: 10, padding: '7px 10px', background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#00ff41' }}>
              {notifSuccess}
            </div>
          )}
          {notifError && (
            <div style={{ marginBottom: 10, padding: '7px 10px', background: 'rgba(255,0,64,0.05)', border: '1px solid rgba(255,0,64,0.2)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ff0040' }}>
              {notifError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a5a5a', letterSpacing: '0.1em', display: 'block', marginBottom: 3 }}>
                DESTINATÁRIOS
              </label>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value as 'all' | 'subscribers')}
                style={{ ...inputStyle, border: '1px solid rgba(0,212,255,0.2)', appearance: 'none' }}
              >
                <option value="all">Todos os usuários</option>
                <option value="subscribers">Apenas assinantes</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a5a5a', letterSpacing: '0.1em', display: 'block', marginBottom: 3 }}>
                TÍTULO
              </label>
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Título da notificação"
                style={{ ...inputStyle, border: '1px solid rgba(0,212,255,0.2)' }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a5a5a', letterSpacing: '0.1em', display: 'block', marginBottom: 3 }}>
                MENSAGEM
              </label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Conteúdo da notificação..."
                rows={3}
                style={{ ...inputStyle, border: '1px solid rgba(0,212,255,0.2)', resize: 'none' }}
              />
            </div>
            <button
              onClick={() => sendNotification.mutate()}
              disabled={!notifTitle.trim() || !notifMessage.trim() || sendNotification.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px', borderRadius: 4,
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
                color: '#00d4ff', background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.25)',
                cursor: (!notifTitle.trim() || !notifMessage.trim() || sendNotification.isPending) ? 'not-allowed' : 'pointer',
                opacity: (!notifTitle.trim() || !notifMessage.trim()) ? 0.5 : 1,
                letterSpacing: '0.08em',
              }}
            >
              <Send style={{ width: 13, height: 13 }} />
              {sendNotification.isPending ? 'ENVIANDO...' : 'ENVIAR NOTIFICAÇÃO'}
            </button>
          </div>
        </div>

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
