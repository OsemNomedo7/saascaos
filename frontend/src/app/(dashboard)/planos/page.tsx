'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Zap, Star, Crown, CreditCard, Shield } from 'lucide-react';
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
  checkoutUrl: string;
}

const plans: Plan[] = [
  {
    key: 'weekly',
    name: 'SEMANAL',
    price: 19.90,
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
    checkoutUrl: 'https://pay.inovapaypagamentoseguro.site/checkout/cmnavd8j600lr1zmykyct2wda?offer=6H2RWU4',
  },
  {
    key: 'monthly',
    name: 'MENSAL',
    price: 49.90,
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
    checkoutUrl: 'https://pay.inovapaypagamentoseguro.site/checkout/cmnavry8800pw1smywwtvqimx?offer=I3PTVHA',
  },
  {
    key: 'lifetime',
    name: 'VITALÍCIO',
    price: 99.90,
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
    checkoutUrl: 'https://pay.inovapaypagamentoseguro.site/checkout/cmnaw5ge7003i1ro424ciajvv?offer=OE6AKV4',
  },
];

export default function PlanosPage() {
  const { user } = useAuth();

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
  });

  const subscription = subData?.subscription as Subscription | null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Visual Banner */}
      <div style={{
        marginBottom: 28, borderRadius: 8, overflow: 'hidden', position: 'relative', height: 190,
        background: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80) center/cover no-repeat',
        border: '1px solid rgba(255,204,0,0.15)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(5,3,0,0.94) 0%, rgba(15,10,0,0.88) 50%, rgba(0,0,0,0.6) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,204,0,0.012) 3px, rgba(255,204,0,0.012) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.5), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#00ff41', letterSpacing: '0.25em', margin: 0, opacity: 0.7 }}>{'// ELITE TROJAN > ACESSO PREMIUM'}</p>
          <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 700, color: '#e0ffe8', margin: 0, textShadow: '0 0 24px rgba(0,255,65,0.4)', letterSpacing: '0.06em' }}>PLANOS E ASSINATURAS</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4a7a5a', margin: 0 }}>{'> Escolha o plano ideal e acesse todo o conteúdo exclusivo'}</p>
        </div>
      </div>

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

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
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
                <a
                  href={plan.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%', padding: '10px', borderRadius: 4,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.1em',
                    background: plan.highlight ? plan.color : 'transparent',
                    color: plan.highlight ? '#050a05' : plan.color,
                    border: `1px solid ${plan.borderColor}`,
                    boxShadow: plan.highlight ? `0 0 15px ${plan.color}44` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseOver={e => {
                    if (!plan.highlight) {
                      (e.currentTarget as HTMLAnchorElement).style.background = `${plan.color}14`;
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 12px ${plan.color}33`;
                    }
                  }}
                  onMouseOut={e => {
                    if (!plan.highlight) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                    }
                  }}
                >
                  <CreditCard style={{ width: 14, height: 14 }} />
                  ASSINAR
                </a>
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
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
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
