'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MatrixRain from '@/components/ui/MatrixRain';
import Logo from '@/components/ui/Logo';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SkullIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 1.1)} viewBox="0 0 36 40" fill="none"
    style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.6))' }}>
    <path d="M18 2C9.163 2 2 9.163 2 18c0 5.4 2.56 10.2 6.56 13.28L9 32h18l.44-0.72C31.44 28.2 34 23.4 34 18 34 9.163 26.837 2 18 2z"
      fill="rgba(0,255,65,0.08)" stroke="#00ff41" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M9 32v2h2.5v3h3v-3h7v3h3v-3H27v-2H9z"
      fill="rgba(0,255,65,0.08)" stroke="#00ff41" strokeWidth="1.4"/>
    <rect x="6.5" y="13" width="8" height="7" rx="1.5" fill="#00ff41" opacity="0.92"/>
    <rect x="21.5" y="13" width="8" height="7" rx="1.5" fill="#00ff41" opacity="0.92"/>
    <path d="M15.5 23.5h5l-2.5 3.5-2.5-3.5z" fill="#00ff41" opacity="0.6"/>
  </svg>
);

const benefits = [
  'Acesso à biblioteca de conteúdo exclusivo',
  'Programas, ferramentas e materiais premium',
  'Comunidade e chat em tempo real',
  'Drops com conteúdo por tempo limitado',
  'Sistema de progressão por nível',
];

const terminalLines = [
  { prompt: '$', text: 'connect --server elite-trojan.io', delay: 0 },
  { prompt: '▶', text: 'Estabelecendo conexão segura...', delay: 1 },
  { prompt: '▶', text: 'Verificando credenciais...', delay: 2 },
  { prompt: '✓', text: 'Acesso concedido. Bem-vindo ao sistema.', delay: 3, success: true },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setIsLoading(true);
    try {
      await registerUser(data.name, data.email, data.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Falha no cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#050a05' }}>
      <MatrixRain opacity={0.1} />

      <div className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
        }} />
      <div className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,255,65,0.03) 0%, transparent 70%)',
        }} />

      {/* Corner decorations */}
      {[['top-4 left-4', 'borderTop borderLeft'], ['top-4 right-4', 'borderTop borderRight'],
        ['bottom-4 left-4', 'borderBottom borderLeft'], ['bottom-4 right-4', 'borderBottom borderRight']
      ].map(([pos]) => (
        <div key={pos} className={`fixed ${pos} pointer-events-none z-20`} style={{ opacity: 0.25 }}>
          <div style={{
            width: 20, height: 20,
            borderTop: pos.includes('top') ? '1px solid #00ff41' : undefined,
            borderBottom: pos.includes('bottom') ? '1px solid #00ff41' : undefined,
            borderLeft: pos.includes('left') ? '1px solid #00ff41' : undefined,
            borderRight: pos.includes('right') ? '1px solid #00ff41' : undefined,
          }} />
        </div>
      ))}

      <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-up">
        {/* Left: Info panel */}
        <div className="hidden md:flex flex-col">
          {/* Logo */}
          <div className="mb-6">
            <Logo size={190} />
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: '#e0ffe8', letterSpacing: '0.02em' }}>
            Junte-se à{' '}
            <span className="glow-text">elite</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: '#2a4d30', lineHeight: 1.7 }}>
            Acesso a conteúdo premium, ferramentas e uma comunidade de profissionais.
          </p>

          {/* Benefits */}
          <div className="space-y-2.5 mb-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff41' }} />
                <span className="text-xs" style={{ color: '#4d8c5a', letterSpacing: '0.02em' }}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* Terminal box */}
          <div className="terminal-box p-4 pt-8">
            <div className="space-y-1.5">
              {terminalLines.map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-xs"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <span style={{ color: line.success ? '#00ff41' : '#00a828', flexShrink: 0 }}>
                    {line.prompt}
                  </span>
                  <span style={{ color: line.success ? '#00ff41' : '#2a6630' }}>
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 md:hidden">
            <Logo size={160} />
          </div>

          <div className="glass-hacker-bright p-7"
            style={{ boxShadow: '0 0 30px rgba(0,255,65,0.06)' }}>

            <div className="flex items-center gap-2 mb-5 pb-4"
              style={{ borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
              <div className="text-xs" style={{ color: '#2a4d30' }}>
                <span style={{ color: '#00ff41' }}>$</span> auth.register
                <span className="cursor-blink ml-1" />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3"
                style={{
                  background: 'rgba(255,0,64,0.07)',
                  border: '1px solid rgba(255,0,64,0.28)',
                  borderRadius: 4,
                  color: '#ff6080',
                  fontSize: '0.75rem',
                }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-hack">
                  <span style={{ color: '#00ff41' }}>&gt;</span> NOME COMPLETO
                </label>
                <input
                  {...register('name', {
                    required: 'Nome obrigatório',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                  })}
                  type="text"
                  placeholder="Seu nome"
                  className="input-hack"
                  autoComplete="name"
                />
                {errors.name && <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.name.message}</p>}
              </div>

              <div>
                <label className="label-hack">
                  <span style={{ color: '#00ff41' }}>&gt;</span> EMAIL
                </label>
                <input
                  {...register('email', {
                    required: 'Email obrigatório',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                  })}
                  type="email"
                  placeholder="usuario@exemplo.com"
                  className="input-hack"
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.email.message}</p>}
              </div>

              <div>
                <label className="label-hack">
                  <span style={{ color: '#00ff41' }}>&gt;</span> SENHA
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Senha obrigatória',
                      minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="input-hack"
                    style={{ paddingRight: 40 }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#2a4d30' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                    onMouseOut={e => (e.currentTarget.style.color = '#2a4d30')}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.password.message}</p>}
              </div>

              <div>
                <label className="label-hack">
                  <span style={{ color: '#00ff41' }}>&gt;</span> CONFIRMAR SENHA
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Confirme sua senha',
                    validate: (v) => v === password || 'As senhas não coincidem',
                  })}
                  type="password"
                  placeholder="••••••••••••"
                  className="input-hack"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-hack w-full flex items-center justify-center gap-2"
                style={{ padding: '12px', marginTop: 4 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                    CRIANDO CONTA...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    CRIAR CONTA
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 text-center"
              style={{ borderTop: '1px solid rgba(0,255,65,0.08)' }}>
              <p className="text-xs" style={{ color: '#2a4d30' }}>
                Já tem acesso?{' '}
                <Link href="/login" className="transition-colors" style={{ color: '#00a828' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                  onMouseOut={e => (e.currentTarget.style.color = '#00a828')}>
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
