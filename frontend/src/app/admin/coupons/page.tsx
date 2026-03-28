'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Tag, Plus, Trash2, X, Check, Percent, Calendar, Users
} from 'lucide-react';
import { adminExtApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Coupon } from '@/types';

interface CouponForm {
  code: string;
  description: string;
  discountPercent: number;
  planRestriction: 'weekly' | 'monthly' | 'lifetime' | 'all';
  maxUses: string;
  expiresAt: string;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminExtApi.coupons().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CouponForm>({
    defaultValues: {
      code: '',
      description: '',
      discountPercent: 10,
      planRestriction: 'all',
      maxUses: '',
      expiresAt: '',
    },
  });

  const createCoupon = useMutation({
    mutationFn: (data: CouponForm) => adminExtApi.createCoupon({
      code: data.code.toUpperCase(),
      description: data.description,
      discountPercent: Number(data.discountPercent),
      planRestriction: data.planRestriction,
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      expiresAt: data.expiresAt || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      reset();
      setError('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Erro ao criar cupom');
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => adminExtApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteId(null);
    },
  });

  const coupons: Coupon[] = data?.coupons || [];

  const onSubmit = (data: CouponForm) => {
    createCoupon.mutate(data);
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,68,0,0.04)',
    border: '1px solid rgba(255,68,0,0.2)',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0c8b8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.78rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem',
    color: '#4d2a1a',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: 4,
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag style={{ width: 16, height: 16, color: '#ff4400' }} />
          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem', fontWeight: 700,
            color: '#ff4400', letterSpacing: '0.12em', margin: 0,
            textShadow: '0 0 12px rgba(255,68,0,0.4)',
          }}>{'// CUPONS'}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
            color: '#ff4400', background: 'rgba(255,68,0,0.08)',
            border: '1px solid rgba(255,68,0,0.3)',
            letterSpacing: '0.08em',
          }}
        >
          {showForm ? <X style={{ width: 13, height: 13 }} /> : <Plus style={{ width: 13, height: 13 }} />}
          {showForm ? 'CANCELAR' : 'NOVO CUPOM'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          marginBottom: 20,
          background: 'rgba(10,18,10,0.9)',
          border: '1px solid rgba(255,68,0,0.25)',
          borderRadius: 6, padding: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #ff440088, transparent)',
          }} />
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700, color: '#ff4400', letterSpacing: '0.1em' }}>
              {'// CRIAR NOVO CUPOM'}
            </span>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.2)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#ff0040' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>CÓDIGO DO CUPOM *</label>
                <input
                  {...register('code', { required: 'Código obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="EX: TROJAN50"
                />
                {errors.code && <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#ff0040', marginTop: 3 }}>{errors.code.message}</p>}
              </div>

              <div>
                <label style={labelStyle}>DESCONTO (%) *</label>
                <input
                  {...register('discountPercent', { required: true, min: 1, max: 100 })}
                  type="number"
                  min={1} max={100}
                  style={inputStyle}
                  placeholder="10"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>DESCRIÇÃO</label>
                <input
                  {...register('description')}
                  style={inputStyle}
                  placeholder="Descrição do cupom (opcional)"
                />
              </div>

              <div>
                <label style={labelStyle}>RESTRIÇÃO DE PLANO</label>
                <select
                  {...register('planRestriction')}
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  <option value="all">Todos os planos</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="lifetime">Vitalício</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>USO MÁXIMO (vazio = ilimitado)</label>
                <input
                  {...register('maxUses')}
                  type="number"
                  min={1}
                  style={inputStyle}
                  placeholder="100"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>EXPIRAÇÃO (vazio = sem expiração)</label>
                <input
                  {...register('expiresAt')}
                  type="datetime-local"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={createCoupon.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', borderRadius: 4, cursor: createCoupon.isPending ? 'wait' : 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 700,
                  color: '#ff4400', background: 'rgba(255,68,0,0.1)',
                  border: '1px solid rgba(255,68,0,0.4)',
                  opacity: createCoupon.isPending ? 0.6 : 1,
                  letterSpacing: '0.08em',
                }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                {createCoupon.isPending ? 'CRIANDO...' : 'CRIAR CUPOM'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              height: 52, borderRadius: 4, background: 'rgba(10,18,10,0.6)',
              border: '1px solid rgba(255,68,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          border: '1px solid rgba(255,68,0,0.1)', borderRadius: 6,
          background: 'rgba(10,18,10,0.6)',
        }}>
          <Tag style={{ width: 32, height: 32, color: '#3a1800', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#4d2a1a' }}>
            {'> NENHUM CUPOM CADASTRADO'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(255,68,0,0.15)',
          borderRadius: 6, overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 80px 80px 40px',
            gap: 10, padding: '10px 16px',
            background: 'rgba(255,68,0,0.04)', borderBottom: '1px solid rgba(255,68,0,0.15)',
          }}>
            {['CÓDIGO', 'DESCRIÇÃO', 'DESCONTO', 'PLANO', 'USOS', 'EXPIRA', ''].map((h) => (
              <span key={h} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', fontWeight: 700, color: '#4d2a1a', letterSpacing: '0.12em' }}>
                {h}
              </span>
            ))}
          </div>

          {coupons.map((coupon, i) => (
            <div key={coupon._id} style={{
              display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px 80px 80px 40px',
              gap: 10, padding: '12px 16px', alignItems: 'center',
              borderBottom: i < coupons.length - 1 ? '1px solid rgba(255,68,0,0.06)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,68,0,0.02)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: coupon.isActive ? '#00ff41' : '#ff0040',
                  boxShadow: coupon.isActive ? '0 0 5px #00ff41' : 'none',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', fontWeight: 700,
                  color: coupon.isActive ? '#ff8844' : '#3a2010', letterSpacing: '0.08em',
                }}>
                  {coupon.code}
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4a6a4a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {coupon.description || '—'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Percent style={{ width: 10, height: 10, color: '#ff4400' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', fontWeight: 700, color: '#ff8844' }}>
                  {coupon.discountPercent}
                </span>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                padding: '2px 7px', borderRadius: 3,
                background: 'rgba(255,68,0,0.06)', border: '1px solid rgba(255,68,0,0.15)',
                color: '#ff6633', textTransform: 'uppercase',
              }}>
                {coupon.planRestriction === 'all' ? 'todos' : coupon.planRestriction}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users style={{ width: 10, height: 10, color: '#4d2a1a' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#6a4a2a' }}>
                  {coupon.usedCount}/{coupon.maxUses ?? '∞'}
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#3a2010' }}>
                {coupon.expiresAt ? formatDate(coupon.expiresAt) : '∞'}
              </span>
              <button
                onClick={() => setDeleteId(coupon._id)}
                style={{
                  padding: 5, borderRadius: 3, cursor: 'pointer',
                  background: 'none', border: 'none', color: '#3a1800',
                  transition: 'color 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff0040')}
                onMouseOut={e => (e.currentTarget.style.color = '#3a1800')}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
        }} onClick={() => setDeleteId(null)}>
          <div style={{
            background: '#0a120a', border: '1px solid rgba(255,0,64,0.3)',
            borderRadius: 8, padding: 24, maxWidth: 340, width: '90%',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700, color: '#ff0040', marginBottom: 10 }}>
              Confirmar exclusão
            </h3>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#6a4a4a', marginBottom: 20 }}>
              Tem certeza que deseja excluir este cupom? Esta ação é irreversível.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: '7px 16px', borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
                  background: 'transparent', border: '1px solid rgba(0,255,65,0.2)',
                  color: '#2a6a3a',
                }}
              >
                CANCELAR
              </button>
              <button
                onClick={() => deleteCoupon.mutate(deleteId)}
                disabled={deleteCoupon.isPending}
                style={{
                  padding: '7px 16px', borderRadius: 4, cursor: deleteCoupon.isPending ? 'wait' : 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.35)',
                  color: '#ff0040',
                }}
              >
                {deleteCoupon.isPending ? 'EXCLUINDO...' : 'EXCLUIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
