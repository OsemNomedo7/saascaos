'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MatrixRain from '@/components/ui/MatrixRain';
import Logo from '@/components/ui/Logo';

interface LoginForm {
  email: string;
  password: string;
}

const SkullIcon = () => (
  <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.7))' }}>
    <path d="M18 2C9.163 2 2 9.163 2 18c0 5.4 2.56 10.2 6.56 13.28L9 32h18l.44-0.72C31.44 28.2 34 23.4 34 18 34 9.163 26.837 2 18 2z"
      fill="rgba(0,255,65,0.08)" stroke="#00ff41" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M9 32v2h2.5v3h3v-3h7v3h3v-3H27v-2H9z"
      fill="rgba(0,255,65,0.08)" stroke="#00ff41" strokeWidth="1.4"/>
    <rect x="6.5" y="13" width="8" height="7" rx="1.5" fill="#00ff41" opacity="0.92"/>
    <rect x="21.5" y="13" width="8" height="7" rx="1.5" fill="#00ff41" opacity="0.92"/>
    <path d="M15.5 23.5h5l-2.5 3.5-2.5-3.5z" fill="#00ff41" opacity="0.6"/>
    <line x1="18" y1="2" x2="18" y2="5" stroke="#00ff41" strokeWidth="0.8" opacity="0.4"/>
    <line x1="10" y1="4" x2="8" y2="2" stroke="#00ff41" strokeWidth="0.8" opacity="0.4"/>
    <line x1="26" y1="4" x2="28" y2="2" stroke="#00ff41" strokeWidth="0.8" opacity="0.4"/>
    <line x1="2" y1="18" x2="5" y2="18" stroke="#00ff41" strokeWidth="0.8" opacity="0.4"/>
    <line x1="31" y1="18" x2="34" y2="18" stroke="#00ff41" strokeWidth="0.8" opacity="0.4"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Falha na autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#050a05' }}>

      {/* Matrix rain background */}
      <MatrixRain opacity={0.12} />

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        }} />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,255,65,0.04) 0%, transparent 70%)',
        }} />

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 pointer-events-none z-20" style={{ opacity: 0.3 }}>
        <div style={{ width: 24, height: 24, borderTop: '1px solid #00ff41', borderLeft: '1px solid #00ff41' }} />
      </div>
      <div className="fixed top-4 right-4 pointer-events-none z-20" style={{ opacity: 0.3 }}>
        <div style={{ width: 24, height: 24, borderTop: '1px solid #00ff41', borderRight: '1px solid #00ff41' }} />
      </div>
      <div className="fixed bottom-4 left-4 pointer-events-none z-20" style={{ opacity: 0.3 }}>
        <div style={{ width: 24, height: 24, borderBottom: '1px solid #00ff41', borderLeft: '1px solid #00ff41' }} />
      </div>
      <div className="fixed bottom-4 right-4 pointer-events-none z-20" style={{ opacity: 0.3 }}>
        <div style={{ width: 24, height: 24, borderBottom: '1px solid #00ff41', borderRight: '1px solid #00ff41' }} />
      </div>

      <div className="relative z-20 w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={280} />
          <p className="text-xs mt-1 tracking-widest" style={{ color: '#2a4d30', letterSpacing: '0.3em' }}>
            [ AUTHORIZED ACCESS ONLY ]
          </p>
        </div>

        {/* Card */}
        <div className="glass-hacker-bright p-8"
          style={{ boxShadow: '0 0 40px rgba(0,255,65,0.08), 0 0 80px rgba(0,255,65,0.04)' }}>

          {/* Top bar decoration */}
          <div className="flex items-center gap-2 mb-6 pb-4"
            style={{ borderBottom: '1px solid rgba(0,255,65,0.12)' }}>
            <div className="text-xs" style={{ color: '#2a4d30' }}>
              <span style={{ color: '#00ff41' }}>$</span> auth.connect
              <span className="cursor-blink ml-1" />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff41' }} />
              <span className="text-xs" style={{ color: '#2a4d30', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                SECURE
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 flex items-start gap-2"
              style={{
                background: 'rgba(255,0,64,0.08)',
                border: '1px solid rgba(255,0,64,0.3)',
                borderRadius: 4,
              }}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#ff0040' }} />
              <p className="text-xs" style={{ color: '#ff6080', fontFamily: 'JetBrains Mono, monospace' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label-hack">
                <span style={{ color: '#00ff41' }}>&gt;</span> SENHA
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Senha obrigatória' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="input-hack"
                  style={{ paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#2a4d30' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                  onMouseOut={e => (e.currentTarget.style.color = '#2a4d30')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: '#ff6080' }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-hack w-full flex items-center justify-center gap-2 mt-2"
              style={{ padding: '12px 20px', fontSize: '0.8rem' }}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  AUTENTICANDO...
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  ACESSAR SISTEMA
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 text-center"
            style={{ borderTop: '1px solid rgba(0,255,65,0.08)' }}>
            <p className="text-xs" style={{ color: '#2a4d30' }}>
              Sem acesso?{' '}
              <Link href="/register"
                className="transition-colors"
                style={{ color: '#00a828' }}
                onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                onMouseOut={e => (e.currentTarget.style.color = '#00a828')}
              >
                Solicitar cadastro
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="mt-4 flex items-center justify-between px-2">
          <span className="text-xs" style={{ color: '#1a3020', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
            ELITE-TROJAN-v2.0
          </span>
          <span className="text-xs" style={{ color: '#1a3020', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
            256-BIT ENCRYPTED
          </span>
        </div>
      </div>
    </div>
  );
}
