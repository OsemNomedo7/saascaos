'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, DollarSign, Check, Clock, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  totalSales: number;
  pendingAmount: number;
  paidAmount: number;
}

interface Commission {
  _id: string;
  affiliate: { name: string; email: string };
  referredUser: { name: string; email: string };
  plan: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export default function AdminAffiliatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'affiliates' | 'withdrawals'>('affiliates');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);

  const { data: affiliatesData } = useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: () => api.get('/affiliates/admin/all').then(r => r.data),
  });

  const { data: commissionsData } = useQuery({
    queryKey: ['admin-commissions', selectedAffiliate],
    queryFn: () => api.get('/affiliates/admin/commissions', { params: selectedAffiliate ? { affiliateId: selectedAffiliate } : {} }).then(r => r.data),
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => api.get('/affiliates/admin/withdrawals').then(r => r.data),
  });

  const payCommission = useMutation({
    mutationFn: (id: string) => api.patch(`/affiliates/admin/commission/${id}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
  });

  const affiliates: Affiliate[] = affiliatesData?.affiliates || [];
  const commissions: Commission[] = commissionsData?.commissions || [];
  const withdrawals: { _id: string; user: { name: string; email: string }; metadata: { pixKey: string; pixKeyType: string; name: string; cpf: string; amount: number; notes: string }; createdAt: string }[] = withdrawalsData?.withdrawals || [];

  const totalPending = affiliates.reduce((s, a) => s + a.pendingAmount, 0);
  const totalPaid = affiliates.reduce((s, a) => s + a.paidAmount, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: '#ff4400', letterSpacing: '0.1em', margin: '0 0 4px' }}>
          // AFILIADOS
        </h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#3a1800' }}>
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
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#3a1800', letterSpacing: '0.15em', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'affiliates', label: 'AFILIADOS' },
          { key: 'withdrawals', label: 'SAQUES SOLICITADOS' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} style={{
            padding: '7px 16px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
            background: activeTab === tab.key ? 'rgba(255,68,0,0.12)' : 'transparent',
            border: `1px solid ${activeTab === tab.key ? 'rgba(255,68,0,0.35)' : 'rgba(255,68,0,0.1)'}`,
            color: activeTab === tab.key ? '#ff4400' : '#3a1800',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Afiliados */}
      {activeTab === 'affiliates' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAffiliate ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Lista */}
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,68,0,0.12)' }}>
                  {['AFILIADO', 'CÓDIGO', 'VENDAS', 'A PAGAR', 'PAGO', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#3a1800', letterSpacing: '0.15em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#2a1000' }}>Nenhum afiliado ainda</td></tr>
                ) : affiliates.map((aff) => (
                  <tr key={aff._id} style={{ borderBottom: '1px solid rgba(255,68,0,0.06)', background: selectedAffiliate === aff._id ? 'rgba(255,68,0,0.04)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#c08060', margin: 0 }}>{aff.name}</p>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800', margin: 0 }}>{aff.email}</p>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ff4400' }}>{aff.referralCode}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#c08060' }}>{aff.totalSales}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#ffcc00' }}>R$ {aff.pendingAmount.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#00ff41' }}>R$ {aff.paidAmount.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => setSelectedAffiliate(selectedAffiliate === aff._id ? null : aff._id)} style={{
                        padding: '4px 8px', borderRadius: 3, cursor: 'pointer',
                        background: 'rgba(255,68,0,0.08)', border: '1px solid rgba(255,68,0,0.2)',
                        color: '#ff4400', display: 'flex', alignItems: 'center',
                      }}>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comissões do afiliado selecionado */}
          {selectedAffiliate && (
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,68,0,0.1)' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ff4400', letterSpacing: '0.1em' }}>COMISSÕES</span>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {commissions.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#2a1000' }}>Nenhuma comissão</p>
                ) : commissions.map((c) => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,68,0,0.06)' }}>
                    <div>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#c08060', margin: 0 }}>{c.referredUser?.name}</p>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800', margin: 0 }}>{c.plan} — R$ {c.saleAmount?.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#00ff41' }}>R$ {c.commissionAmount.toFixed(2)}</span>
                      {c.status === 'pending' ? (
                        <button onClick={() => payCommission.mutate(c._id)} style={{
                          padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                          background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)',
                          color: '#00ff41', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Check className="w-3 h-3" /> PAGAR
                        </button>
                      ) : (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#00ff41' }}>✓ PAGO</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Saques */}
      {activeTab === 'withdrawals' && (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,68,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,68,0,0.12)' }}>
                {['AFILIADO', 'CHAVE PIX', 'NOME / CPF', 'VALOR', 'DATA', 'OBS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#3a1800', letterSpacing: '0.15em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#2a1000' }}>Nenhuma solicitação de saque</td></tr>
              ) : withdrawals.map((w) => (
                <tr key={w._id} style={{ borderBottom: '1px solid rgba(255,68,0,0.06)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#c08060', margin: 0 }}>{w.user?.name}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800', margin: 0 }}>{w.user?.email}</p>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ff4400', margin: 0 }}>{w.metadata?.pixKey}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800', margin: 0 }}>{w.metadata?.pixKeyType}</p>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#c08060', margin: 0 }}>{w.metadata?.name}</p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#3a1800', margin: 0 }}>{w.metadata?.cpf}</p>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#ffcc00' }}>
                    R$ {w.metadata?.amount?.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#3a1800' }}>
                    {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#5a2a1a' }}>
                    {w.metadata?.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
