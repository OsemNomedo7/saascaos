'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, X, Trophy, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react';
import api from '@/lib/api';

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  isAffiliateActive: boolean;
  commissionRate: number;
  totalSales: number;
  totalReferrals: number;
  pendingAmount: number;
  paidAmount: number;
}

interface Commission {
  _id: string;
  affiliate?: { name: string; email: string };
  referredUser?: { name: string; email: string };
  plan: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

interface AffiliateDetail {
  affiliate: {
    _id: string;
    name: string;
    email: string;
    referralCode: string;
    createdAt: string;
    isAffiliateActive: boolean;
    commissionRate: number;
  };
  stats: {
    totalReferrals: number;
    totalSales: number;
    conversionRate: number;
    pendingAmount: number;
    paidAmount: number;
  };
  referredUsers: {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    level: string;
    converted: boolean;
  }[];
  commissions: Commission[];
}

interface RankingItem {
  position: number;
  affiliate: { _id: string; name: string; email: string; referralCode: string };
  totalSales: number;
  totalAmount: number;
  totalRevenue: number;
}

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

export default function AdminAffiliatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'affiliates' | 'ranking' | 'withdrawals'>('affiliates');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState('');

  const { data: affiliatesData } = useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: () => api.get('/affiliates/admin/all').then(r => r.data),
  });

  const { data: detailData } = useQuery({
    queryKey: ['admin-affiliate-detail', selectedId],
    queryFn: () => api.get(`/affiliates/admin/affiliate/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  });

  const { data: rankingData } = useQuery({
    queryKey: ['admin-ranking'],
    queryFn: () => api.get('/affiliates/admin/ranking').then(r => r.data),
    enabled: activeTab === 'ranking',
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => api.get('/affiliates/admin/withdrawals').then(r => r.data),
    enabled: activeTab === 'withdrawals',
  });

  const payCommission = useMutation({
    mutationFn: (id: string) => api.patch(`/affiliates/admin/commission/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-detail', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
  });

  const updateAffiliate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isAffiliateActive?: boolean; affiliateCommissionRate?: number } }) =>
      api.patch(`/affiliates/admin/affiliate/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-detail', selectedId] });
    },
  });

  const affiliates: Affiliate[] = affiliatesData?.affiliates || [];
  const detail: AffiliateDetail | null = detailData || null;
  const ranking: RankingItem[] = rankingData?.ranking || [];
  const withdrawals = withdrawalsData?.withdrawals || [];

  const totalPending = affiliates.reduce((s, a) => s + a.pendingAmount, 0);
  const totalPaid = affiliates.reduce((s, a) => s + a.paidAmount, 0);

  const handleToggleActive = (aff: Affiliate) => {
    updateAffiliate.mutate({ id: aff._id, data: { isAffiliateActive: !aff.isAffiliateActive } });
  };

  const handleSaveRate = (id: string) => {
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateAffiliate.mutate({ id, data: { affiliateCommissionRate: val } });
    }
    setEditingRateId(null);
  };

  const rankMedals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#ff4400', letterSpacing: '0.1em', margin: '0 0 4px' }}>
          {'// AFILIADOS'}
        </h1>
        <p style={{ ...mono, fontSize: '0.65rem', color: '#5a2a10' }}>
          Gerencie afiliados, comissões e saques
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'AFILIADOS', value: affiliates.length, color: '#ff4400' },
          { label: 'TOTAL VENDAS', value: affiliates.reduce((s, a) => s + a.totalSales, 0), color: '#00ff41' },
          { label: 'A PAGAR', value: `R$ ${totalPending.toFixed(2)}`, color: '#ffcc00' },
          { label: 'JÁ PAGO', value: `R$ ${totalPaid.toFixed(2)}`, color: '#00d4ff' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '14px 16px', borderRadius: 6,
            background: '#0a0a0a', border: `1px solid ${s.color}22`,
          }}>
            <p style={{ ...mono, fontSize: '0.55rem', color: '#5a2a10', letterSpacing: '0.15em', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ ...mono, fontSize: '1.1rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'affiliates', label: 'AFILIADOS' },
          { key: 'ranking', label: 'RANKING' },
          { key: 'withdrawals', label: 'SAQUES SOLICITADOS' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key as typeof activeTab); setSelectedId(null); }} style={{
            padding: '7px 16px', borderRadius: 4, cursor: 'pointer',
            ...mono, fontSize: '0.65rem', fontWeight: 700,
            background: activeTab === tab.key ? 'rgba(255,68,0,0.12)' : 'transparent',
            border: `1px solid ${activeTab === tab.key ? 'rgba(255,68,0,0.35)' : 'rgba(255,68,0,0.1)'}`,
            color: activeTab === tab.key ? '#ff4400' : '#7a3a20',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Afiliados */}
      {activeTab === 'affiliates' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '1fr 420px' : '1fr', gap: 16, alignItems: 'start' }}>
          {/* Tabela */}
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,68,0,0.12)' }}>
                    {['AFILIADO', 'CÓDIGO', 'COMISSÃO %', 'VENDAS', 'A PAGAR', 'PAGO', 'STATUS', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#7a3a20', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.68rem', color: '#3a1800' }}>Nenhum afiliado ainda</td></tr>
                  ) : affiliates.map((aff) => (
                    <tr key={aff._id} style={{ borderBottom: '1px solid rgba(255,68,0,0.06)', background: selectedId === aff._id ? 'rgba(255,68,0,0.04)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <p style={{ ...mono, fontSize: '0.7rem', color: '#d08060', margin: 0, whiteSpace: 'nowrap' }}>{aff.name}</p>
                        <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{aff.email}</p>
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '0.65rem', color: '#ff4400', whiteSpace: 'nowrap' }}>{aff.referralCode}</td>
                      {/* Commission rate */}
                      <td style={{ padding: '10px 12px' }}>
                        {editingRateId === aff._id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number" min={0} max={100} step={0.5}
                              value={rateInput}
                              onChange={e => setRateInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveRate(aff._id); if (e.key === 'Escape') setEditingRateId(null); }}
                              style={{ width: 52, padding: '2px 6px', ...mono, fontSize: '0.65rem', background: '#111', border: '1px solid rgba(255,68,0,0.4)', borderRadius: 3, color: '#ff8855', outline: 'none' }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveRate(aff._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00ff41', padding: 2 }}>
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={() => setEditingRateId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', padding: 2 }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingRateId(aff._id); setRateInput(String(aff.commissionRate)); }} style={{
                            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          }}>
                            <span style={{ ...mono, fontSize: '0.72rem', color: '#ffcc00' }}>{aff.commissionRate}%</span>
                            <Edit2 style={{ width: 10, height: 10, color: '#5a2a10' }} />
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '0.72rem', color: '#d08060' }}>{aff.totalSales}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '0.72rem', color: '#ffcc00', whiteSpace: 'nowrap' }}>R$ {aff.pendingAmount.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '0.72rem', color: '#00ff41', whiteSpace: 'nowrap' }}>R$ {aff.paidAmount.toFixed(2)}</td>
                      {/* Toggle active */}
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => handleToggleActive(aff)} title={aff.isAffiliateActive ? 'Desativar' : 'Ativar'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {aff.isAffiliateActive
                            ? <ToggleRight style={{ width: 20, height: 20, color: '#00ff41' }} />
                            : <ToggleLeft style={{ width: 20, height: 20, color: '#3a1800' }} />}
                        </button>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => setSelectedId(selectedId === aff._id ? null : aff._id)} style={{
                          padding: '4px 8px', borderRadius: 3, cursor: 'pointer',
                          background: selectedId === aff._id ? 'rgba(255,68,0,0.15)' : 'rgba(255,68,0,0.08)',
                          border: '1px solid rgba(255,68,0,0.2)',
                          color: '#ff4400', display: 'flex', alignItems: 'center',
                        }}>
                          {selectedId === aff._id ? <X className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Painel de detalhe */}
          {selectedId && detail && (
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.15)', borderRadius: 6, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              {/* Header do perfil */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,68,0,0.1)', background: 'rgba(255,68,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ ...mono, fontSize: '0.75rem', color: '#ff8855', fontWeight: 700, margin: '0 0 2px' }}>{detail.affiliate.name}</p>
                    <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{detail.affiliate.email}</p>
                    <p style={{ ...mono, fontSize: '0.6rem', color: '#ff4400', margin: '4px 0 0' }}>REF: {detail.affiliate.referralCode}</p>
                  </div>
                  <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a1800', padding: 4 }}
                    onMouseOver={e => (e.currentTarget.style.color = '#ff4400')}
                    onMouseOut={e => (e.currentTarget.style.color = '#3a1800')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
                  {[
                    { label: 'INDICADOS', value: detail.stats.totalReferrals, color: '#00d4ff' },
                    { label: 'CONVERSÃO', value: `${detail.stats.conversionRate}%`, color: '#00ff41' },
                    { label: 'VENDAS', value: detail.stats.totalSales, color: '#ffcc00' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '6px 8px', background: '#050505', borderRadius: 4, border: `1px solid ${s.color}18` }}>
                      <p style={{ ...mono, fontSize: '0.5rem', color: '#5a2a10', margin: '0 0 2px', letterSpacing: '0.1em' }}>{s.label}</p>
                      <p style={{ ...mono, fontSize: '0.82rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                  {[
                    { label: 'A PAGAR', value: `R$ ${detail.stats.pendingAmount.toFixed(2)}`, color: '#ffcc00' },
                    { label: 'PAGO', value: `R$ ${detail.stats.paidAmount.toFixed(2)}`, color: '#00ff41' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '6px 8px', background: '#050505', borderRadius: 4, border: `1px solid ${s.color}18` }}>
                      <p style={{ ...mono, fontSize: '0.5rem', color: '#5a2a10', margin: '0 0 2px', letterSpacing: '0.1em' }}>{s.label}</p>
                      <p style={{ ...mono, fontSize: '0.82rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {/* Usuários indicados */}
                <div style={{ borderBottom: '1px solid rgba(255,68,0,0.08)' }}>
                  <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...mono, fontSize: '0.6rem', color: '#ff4400', letterSpacing: '0.1em' }}>INDICADOS ({detail.referredUsers.length})</span>
                  </div>
                  {detail.referredUsers.length === 0 ? (
                    <p style={{ padding: '12px 14px', ...mono, fontSize: '0.65rem', color: '#3a1800', margin: 0 }}>Nenhum usuário indicado</p>
                  ) : detail.referredUsers.slice(0, 10).map(u => (
                    <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,68,0,0.04)' }}>
                      <div>
                        <p style={{ ...mono, fontSize: '0.65rem', color: '#d08060', margin: 0 }}>{u.name}</p>
                        <p style={{ ...mono, fontSize: '0.55rem', color: '#5a2a10', margin: 0 }}>{u.email}</p>
                      </div>
                      <span style={{
                        ...mono, fontSize: '0.5rem', fontWeight: 700,
                        padding: '2px 6px', borderRadius: 3,
                        background: u.converted ? 'rgba(0,255,65,0.1)' : 'rgba(255,68,0,0.08)',
                        border: `1px solid ${u.converted ? 'rgba(0,255,65,0.2)' : 'rgba(255,68,0,0.15)'}`,
                        color: u.converted ? '#00ff41' : '#5a2a10',
                        letterSpacing: '0.08em',
                      }}>
                        {u.converted ? '✓ COMPROU' : 'SEM COMPRA'}
                      </span>
                    </div>
                  ))}
                  {detail.referredUsers.length > 10 && (
                    <p style={{ padding: '8px 14px', ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>
                      +{detail.referredUsers.length - 10} indicados adicionais
                    </p>
                  )}
                </div>

                {/* Comissões */}
                <div>
                  <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.3)' }}>
                    <span style={{ ...mono, fontSize: '0.6rem', color: '#ff4400', letterSpacing: '0.1em' }}>COMISSÕES ({detail.commissions.length})</span>
                  </div>
                  {detail.commissions.length === 0 ? (
                    <p style={{ padding: '12px 14px', ...mono, fontSize: '0.65rem', color: '#3a1800', margin: 0 }}>Nenhuma comissão</p>
                  ) : detail.commissions.map(c => (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,68,0,0.04)' }}>
                      <div>
                        <p style={{ ...mono, fontSize: '0.65rem', color: '#d08060', margin: 0 }}>{c.referredUser?.name}</p>
                        <p style={{ ...mono, fontSize: '0.55rem', color: '#5a2a10', margin: 0 }}>{c.plan} — R$ {c.saleAmount?.toFixed(2)}</p>
                        <p style={{ ...mono, fontSize: '0.52rem', color: '#3a1800', margin: 0 }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ ...mono, fontSize: '0.75rem', fontWeight: 700, color: '#00ff41' }}>R$ {c.commissionAmount.toFixed(2)}</span>
                        {c.status === 'pending' ? (
                          <button onClick={() => payCommission.mutate(c._id)} disabled={payCommission.isPending} style={{
                            padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                            background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)',
                            color: '#00ff41', ...mono, fontSize: '0.52rem',
                            display: 'flex', alignItems: 'center', gap: 3,
                            opacity: payCommission.isPending ? 0.5 : 1,
                          }}>
                            <Check className="w-3 h-3" /> PAGAR
                          </button>
                        ) : (
                          <span style={{ ...mono, fontSize: '0.52rem', color: '#00ff41' }}>✓ PAGO</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ranking */}
      {activeTab === 'ranking' && (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,68,0,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy style={{ width: 14, height: 14, color: '#ffcc00' }} />
            <span style={{ ...mono, fontSize: '0.65rem', color: '#ffcc00', letterSpacing: '0.12em', fontWeight: 700 }}>
              TOP AFILIADOS DO MÊS — {rankingData?.month?.toUpperCase() || ''}
            </span>
          </div>
          {ranking.length === 0 ? (
            <p style={{ padding: '32px', textAlign: 'center', ...mono, fontSize: '0.68rem', color: '#3a1800', margin: 0 }}>
              Nenhuma venda registrada neste mês
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,68,0,0.1)' }}>
                  {['POS', 'AFILIADO', 'CÓDIGO', 'VENDAS', 'COMISSÃO', 'RECEITA GERADA'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#7a3a20', letterSpacing: '0.12em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.affiliate?._id} style={{ borderBottom: '1px solid rgba(255,68,0,0.06)', background: r.position === 1 ? 'rgba(255,204,0,0.03)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...mono, fontSize: r.position <= 3 ? '1.2rem' : '0.8rem', color: '#7a3a20' }}>
                        {r.position <= 3 ? rankMedals[r.position - 1] : `#${r.position}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ ...mono, fontSize: '0.72rem', color: '#d08060', margin: 0, fontWeight: r.position === 1 ? 700 : 400 }}>{r.affiliate?.name}</p>
                      <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{r.affiliate?.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px', ...mono, fontSize: '0.65rem', color: '#ff4400' }}>{r.affiliate?.referralCode}</td>
                    <td style={{ padding: '12px 16px', ...mono, fontSize: '0.82rem', color: '#d08060', fontWeight: 700 }}>{r.totalSales}</td>
                    <td style={{ padding: '12px 16px', ...mono, fontSize: '0.82rem', color: '#00ff41', fontWeight: 700 }}>
                      R$ {r.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', ...mono, fontSize: '0.82rem', color: '#00d4ff', fontWeight: 700 }}>
                      R$ {r.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Saques */}
      {activeTab === 'withdrawals' && (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,68,0,0.12)' }}>
                  {['AFILIADO', 'CHAVE PIX', 'NOME / CPF', 'VALOR', 'DATA', 'OBS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#7a3a20', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.68rem', color: '#3a1800' }}>Nenhuma solicitação de saque</td></tr>
                ) : withdrawals.map((w: { _id: string; user: { name: string; email: string }; metadata: { pixKey: string; pixKeyType: string; name: string; cpf: string; amount: number; notes: string }; createdAt: string }) => (
                  <tr key={w._id} style={{ borderBottom: '1px solid rgba(255,68,0,0.06)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#d08060', margin: 0 }}>{w.user?.name}</p>
                      <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{w.user?.email}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ ...mono, fontSize: '0.65rem', color: '#ff4400', margin: 0 }}>{w.metadata?.pixKey}</p>
                      <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{w.metadata?.pixKeyType}</p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ ...mono, fontSize: '0.65rem', color: '#d08060', margin: 0 }}>{w.metadata?.name}</p>
                      <p style={{ ...mono, fontSize: '0.58rem', color: '#5a2a10', margin: 0 }}>{w.metadata?.cpf}</p>
                    </td>
                    <td style={{ padding: '10px 14px', ...mono, fontSize: '0.75rem', fontWeight: 700, color: '#ffcc00', whiteSpace: 'nowrap' }}>
                      R$ {w.metadata?.amount?.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 14px', ...mono, fontSize: '0.62rem', color: '#7a3a20', whiteSpace: 'nowrap' }}>
                      {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 14px', ...mono, fontSize: '0.62rem', color: '#5a2a10' }}>
                      {w.metadata?.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
