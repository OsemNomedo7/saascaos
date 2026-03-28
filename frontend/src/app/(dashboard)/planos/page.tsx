'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Zap, Star, Crown, CreditCard, Loader2, Shield } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { formatRelativeDate, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/types';

interface Plan {
  key: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  glowColor: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    key: 'weekly',
    name: 'SEMANAL',
    price: 9.99,
    period: '/ semana',
    icon: <Zap style={{ width: 20, height: 20 }} />,
    color: '#00d4ff',
    borderColor: 'rgba(0,212,255,0.25)',
    glowColor: 'rgba(0,212,255,0.1)',
    description: 'Acesso completo por 7 dias',
    features: [
      'Acesso completo por 7 dias',
      'Biblioteca completa de conteúdo',
      'Fórum da comunidade',
      'Chat ao vivo',
      'Drops com limite de tempo',
    ],
  },
  {
    key: 'monthly',
    name: 'MENSAL',
    price: 29.99,
    period: '/ mês',
    icon: <Star style={{ width: 20, height: 20 }} />,
    color: '#00ff41',
    borderColor: 'rgba(0,255,65,0.4)',
    glowColor: 'rgba(0,255,65,0.08)',
    description: 'Mais popular — melhor custo-benefício',
    features: [
      'Acesso completo por 30 dias',
      'Biblioteca completa de conteúdo',
      'Fórum e chat da comunidade',
      'Drops exclusivos',
      'Suporte prioritário',
      'Progressão de nível',
    ],
    highlight: true,
  },
  {
    key: 'lifetime',
    name: 'VITALÍCIO',
    price: 99.99,
    period: 'pagamento único',
    icon: <Crown style={{ width: 20, height: 20 }} />,
    color: '#ffcc00',
    borderColor: 'rgba(255,204,0,0.25)',
    glowColor: 'rgba(255,204,0,0.06)',
    description: 'Pague uma vez, acesse para sempre',
    features: [
      'Acesso vitalício',
      'Todo conteúdo atual e futuro',
      'Acesso VIP à comunidade',
      'Todos os drops para sempre',
      'Suporte Elite',
      'Acesso antecipado a novos recursos',
      'Badge exclusivo Elite',
    ],
  },
];

export default function PlanosPage() {
  const { user } = useAuth();
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
  });

  const checkout = useMutation({
    mutationFn: (plan: string) => subscriptionsApi.checkout({ plan, gateway: 'stripe' }),
    onSuccess: (data) => {
      setCheckoutError('');
      setCheckoutSuccess(
        `Checkout criado! Em produção, você seria redirecionado para o pagamento. (ID: ${data.data.subscription._id})`
      );
      setTimeout(() => setCheckoutSuccess(''), 8000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr.response?.data?.message || 'Falha ao criar checkout.');
    },
  });

  const subscription = subData?.subscription as Subscription | null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <Shield style={{ width: 14, height: 14, color: '#00ff41' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#2a4a2a', letterSpacing: '0.2em' }}>
            SISTEMA DE ASSINATURAS
          </span>
          <Shield style={{ width: 14, height: 14, color: '#00ff41' }} />
        </div>
        <h1 style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.6rem', fontWeight: 700,
          color: '#00ff41',
          textShadow: '0 0 20px rgba(0,255,65,0.5)',
          margin: '0 0 8px',
          letterSpacing: '0.08em',
        }}>
          {'// ESCOLHA SEU PLANO'}
        </h1>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#4a7a5a', maxWidth: 400, margin: '0 auto' }}>
          {'> Acesso completo à plataforma com conteúdo exclusivo,'}
          <br />
          {'  comunidade ativa e recursos premium.'}
        </p>

        {subscription && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 16, padding: '8px 16px',
            background: 'rgba(0,255,65,0.05)',
            border: '1px solid rgba(0,255,65,0.25)',
            borderRadius: 4,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 6px #00ff41', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#4a7a5a' }}>Plano ativo:</span>
            <PlanBadge plan={subscription.plan} />
            <StatusBadge status={subscription.status} />
            {subscription.endDate && subscription.plan !== 'lifetime' && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a4d30' }}>
                · expira {formatRelativeDate(subscription.endDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {checkoutError && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.25)',
          borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#ff0040',
        }}>
          ⚠ {checkoutError}
        </div>
      )}
      {checkoutSuccess && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.25)',
          borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#00ff41',
        }}>
          ✓ {checkoutSuccess}
        </div>
      )}

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.key && subscription?.status === 'active';

          return (
            <div
              key={plan.key}
              style={{
                background: plan.highlight ? `linear-gradient(135deg, ${plan.glowColor}, rgba(10,18,10,0.95))` : 'rgba(10,18,10,0.8)',
                border: `1px solid ${plan.borderColor}`,
                borderRadius: 8,
                padding: 24,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: plan.highlight ? `0 0 30px ${plan.glowColor}, inset 0 0 40px ${plan.glowColor}` : 'none',
                transform: plan.highlight ? 'scale(1.03)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={e => {
                if (!plan.highlight) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${plan.glowColor}`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = plan.color;
                }
              }}
              onMouseOut={e => {
                if (!plan.highlight) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = plan.borderColor;
                }
              }}
            >
              {/* Decorative top line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)`,
              }} />

              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 10, right: -20,
                  background: plan.color, color: '#050a05',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 700,
                  padding: '3px 28px', transform: 'rotate(40deg)',
                  letterSpacing: '0.1em',
                }}>
                  POPULAR
                </div>
              )}

              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 6, marginBottom: 16,
                background: `${plan.glowColor || plan.color}20`,
                border: `1px solid ${plan.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: plan.color,
                boxShadow: `0 0 12px ${plan.glowColor || plan.color}40`,
              }}>
                {plan.icon}
              </div>

              <h3 style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem',
                fontWeight: 700, color: plan.color,
                letterSpacing: '0.15em', marginBottom: 4,
                textShadow: `0 0 10px ${plan.color}66`,
              }}>
                {plan.name}
              </h3>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4d30', marginBottom: 16 }}>
                {plan.description}
              </p>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem',
                  fontWeight: 700, color: '#e0ffe8',
                  textShadow: `0 0 14px ${plan.color}44`,
                }}>
                  {formatCurrency(plan.price)}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4d30' }}>
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Check style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: plan.color }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#6a9a6a', lineHeight: 1.5 }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrentPlan ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 4,
                  background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.2)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700,
                  color: '#2a6a3a', letterSpacing: '0.1em',
                }}>
                  <Check style={{ width: 13, height: 13, color: '#00ff41' }} />
                  PLANO ATUAL
                </div>
              ) : (
                <button
                  onClick={() => checkout.mutate(plan.key)}
                  disabled={checkout.isPending}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 4,
                    cursor: checkout.isPending ? 'wait' : 'pointer',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.1em',
                    background: plan.highlight ? plan.color : 'transparent',
                    color: plan.highlight ? '#050a05' : plan.color,
                    border: `1px solid ${plan.borderColor}`,
                    boxShadow: plan.highlight ? `0 0 15px ${plan.color}44` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                    opacity: checkout.isPending ? 0.7 : 1,
                  }}
                  onMouseOver={e => {
                    if (!plan.highlight && !checkout.isPending) {
                      (e.currentTarget as HTMLButtonElement).style.background = `${plan.color}14`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${plan.color}33`;
                    }
                  }}
                  onMouseOut={e => {
                    if (!plan.highlight) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }
                  }}
                >
                  {checkout.isPending && checkout.variables === plan.key ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <CreditCard style={{ width: 14, height: 14 }} />
                  )}
                  ASSINAR
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{
        marginTop: 36, padding: '20px 24px',
        background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.1)',
        borderRadius: 6,
      }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
            {'// PERGUNTAS FREQUENTES'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Planos semanais e mensais podem ser cancelados antes da renovação.' },
            { q: 'Quais métodos de pagamento são aceitos?', a: 'Aceitamos cartões de crédito, débito e PIX via Stripe e MercadoPago.' },
            { q: 'O plano vitalício é realmente para sempre?', a: 'Sim! Pague uma vez e tenha acesso a todo o conteúdo da plataforma para sempre.' },
            { q: 'O que acontece se meu plano expirar?', a: 'Você perde acesso ao conteúdo mas mantém sua conta na comunidade.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 600, color: '#a0c8a8', margin: 0 }}>
                {'> '}{item.q}
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4a6a4a', margin: 0, lineHeight: 1.6 }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
