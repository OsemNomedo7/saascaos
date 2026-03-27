'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Zap, Star, Crown, CreditCard, Loader2 } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatRelativeDate, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/types';
import { useState } from 'react';

interface Plan {
  key: string;
  name: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  border: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    key: 'weekly',
    name: 'Semanal',
    price: 9.99,
    period: '/ week',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/10 to-cyan-900/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    description: 'Perfect to test the platform',
    features: [
      'Full access for 7 days',
      'All content library',
      'Community forum',
      'Live chat',
      'Time-limited drops',
    ],
  },
  {
    key: 'monthly',
    name: 'Mensal',
    price: 29.99,
    period: '/ month',
    icon: <Star className="w-6 h-6" />,
    color: 'text-green-400',
    gradient: 'from-green-500/15 to-green-900/5',
    border: 'border-green-500/30 hover:border-green-500/60',
    description: 'Most popular — best value',
    features: [
      'Full access for 30 days',
      'All content library',
      'Community forum & chat',
      'Exclusive drops',
      'Priority support',
      'Level progression',
    ],
    highlight: true,
  },
  {
    key: 'lifetime',
    name: 'Vitalício',
    price: 99.99,
    period: 'one-time',
    icon: <Crown className="w-6 h-6" />,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/10 to-yellow-900/5',
    border: 'border-yellow-500/20 hover:border-yellow-500/40',
    description: 'Pay once, access forever',
    features: [
      'Lifetime access',
      'All current & future content',
      'VIP community access',
      'All drops forever',
      'Elite support',
      'Early access to new features',
      'Exclusive Elite badge',
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
        `Checkout created! In production, you would be redirected to the payment page. (ID: ${data.data.subscription._id})`
      );
      setTimeout(() => setCheckoutSuccess(''), 8000);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(axiosErr.response?.data?.message || 'Failed to create checkout.');
    },
  });

  const subscription = subData?.subscription as Subscription | null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-100 mb-3">
          Choose your{' '}
          <span className="text-gradient-green">plan</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Get full access to the platform with exclusive content, active community and premium features.
        </p>

        {subscription && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Active plan: </span>
            <PlanBadge plan={subscription.plan} />
            <StatusBadge status={subscription.status} />
            {subscription.endDate && subscription.plan !== 'lifetime' && (
              <span className="text-xs text-gray-500">· expires {formatRelativeDate(subscription.endDate)}</span>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {checkoutError && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-400 text-sm">
          {checkoutError}
        </div>
      )}
      {checkoutSuccess && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-800/50 rounded-xl text-green-400 text-sm">
          {checkoutSuccess}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.key && subscription?.status === 'active';

          return (
            <div
              key={plan.key}
              className={`relative rounded-xl border bg-gradient-to-br ${plan.gradient} ${plan.border} transition-all duration-200 ${
                plan.highlight ? 'scale-105 shadow-lg shadow-green-500/10' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-gray-950 text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan header */}
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${plan.color} bg-gray-800/50`}>
                  {plan.icon}
                </div>

                <h3 className={`text-xl font-bold mb-1 ${plan.color}`}>{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-gray-100">{formatCurrency(plan.price)}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.color}`} />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-700 text-gray-500 cursor-default flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => checkout.mutate(plan.key)}
                    disabled={checkout.isPending}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? 'bg-green-500 hover:bg-green-400 text-gray-950 hover:shadow-green-glow'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {checkout.isPending && checkout.variables === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Subscribe
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 p-6 bg-gray-900/60 border border-gray-800/60 rounded-xl">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Weekly and monthly plans can be cancelled before renewal.' },
            { q: 'What payment methods are accepted?', a: 'We accept credit cards, debit cards and PIX via Stripe and MercadoPago.' },
            { q: 'Is the lifetime plan really forever?', a: 'Yes! Pay once and get access to all content on the platform forever.' },
            { q: 'What happens if my plan expires?', a: 'You lose access to content but keep your community account.' },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-medium text-gray-300">{item.q}</p>
              <p className="text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
