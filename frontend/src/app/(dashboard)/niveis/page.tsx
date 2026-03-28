'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LevelBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Star, Zap, Download, MessageSquare, Edit3, Trophy, ChevronRight, Shield } from 'lucide-react';

const LEVELS = [
  {
    key: 'iniciante',
    label: 'INICIANTE',
    xpMin: 0,
    xpMax: 99,
    color: '#00ff41',
    glow: 'rgba(0,255,65,0.12)',
    border: 'rgba(0,255,65,0.25)',
    icon: '🌱',
    description: 'Nível de entrada. Acesso ao conteúdo básico da plataforma.',
    perks: [
      'Acesso a conteúdo nível Iniciante',
      'Participação na comunidade',
      'Drops de tempo limitado',
    ],
  },
  {
    key: 'intermediario',
    label: 'INTERMEDIÁRIO',
    xpMin: 100,
    xpMax: 499,
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.12)',
    border: 'rgba(0,212,255,0.25)',
    icon: '⚡',
    description: 'Nível intermediário. Desbloqueie ferramentas e materiais avançados.',
    perks: [
      'Acesso a conteúdo Iniciante + Intermediário',
      'Badge exclusivo no perfil',
      'Prioridade no suporte',
    ],
  },
  {
    key: 'avancado',
    label: 'AVANÇADO',
    xpMin: 500,
    xpMax: 1999,
    color: '#cc66ff',
    glow: 'rgba(200,100,255,0.12)',
    border: 'rgba(200,100,255,0.25)',
    icon: '🔥',
    description: 'Usuário experiente. Acesso a conteúdo premium e exclusivo.',
    perks: [
      'Acesso a todo conteúdo até nível Avançado',
      'Badge roxo no perfil',
      'Acesso antecipado a novos conteúdos',
    ],
  },
  {
    key: 'elite',
    label: 'ELITE',
    xpMin: 2000,
    xpMax: null,
    color: '#ff4400',
    glow: 'rgba(255,68,0,0.12)',
    border: 'rgba(255,68,0,0.3)',
    icon: '👑',
    description: 'O topo da hierarquia. Acesso irrestrito a toda a plataforma.',
    perks: [
      'Acesso a TODO o conteúdo da plataforma',
      'Badge Elite exclusivo',
      'Status VIP na comunidade',
      'Primeiros a receber novidades',
    ],
  },
];

const XP_ACTIONS = [
  { icon: <Zap style={{ width: 14, height: 14 }} />, action: 'Cadastro na plataforma', xp: 20, color: '#00ff41' },
  { icon: <Star style={{ width: 14, height: 14 }} />, action: 'Login diário', xp: 5, color: '#00d4ff' },
  { icon: <Download style={{ width: 14, height: 14 }} />, action: 'Download de conteúdo', xp: 10, color: '#cc66ff' },
  { icon: <Edit3 style={{ width: 14, height: 14 }} />, action: 'Criar post na comunidade', xp: 15, color: '#ffcc00' },
  { icon: <MessageSquare style={{ width: 14, height: 14 }} />, action: 'Comentar em post', xp: 5, color: '#00d4ff' },
  { icon: <Trophy style={{ width: 14, height: 14 }} />, action: 'Avaliar conteúdo (estrelas)', xp: 10, color: '#ff4400' },
];

export default function NiveisPage() {
  const { user } = useAuth();
  const currentXp = user?.xp || 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield style={{ width: 16, height: 16, color: '#00ff41' }} />
          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem', fontWeight: 700,
            color: '#00ff41', letterSpacing: '0.12em', margin: 0,
            textShadow: '0 0 12px rgba(0,255,65,0.4)',
          }}>{'// SISTEMA DE NÍVEIS'}</h1>
        </div>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4a2a', margin: 0 }}>
          {'> Evolua seu perfil ganhando XP e desbloqueie acesso a conteúdo exclusivo'}
        </p>
      </div>

      {/* Current status banner */}
      {user && (
        <div style={{
          marginBottom: 28,
          padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(0,255,65,0.05), rgba(0,212,255,0.03))',
          border: '1px solid rgba(0,255,65,0.2)',
          borderRadius: 8,
          position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #00ff41, transparent)' }} />
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a4a2a', letterSpacing: '0.15em', margin: '0 0 6px' }}>
              SEU NÍVEL ATUAL
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LevelBadge level={user.level} size="md" />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: '#00ff41', textShadow: '0 0 8px rgba(0,255,65,0.5)' }}>
                {currentXp.toLocaleString()} XP
              </span>
            </div>
          </div>

          {user.level !== 'elite' && (() => {
            const nextLevel = LEVELS.find(l => l.xpMin > currentXp);
            if (!nextLevel) return null;
            const currentLevelData = LEVELS.find(l => l.key === user.level);
            const prevMin = currentLevelData?.xpMin || 0;
            const range = nextLevel.xpMin - prevMin;
            const progress = currentXp - prevMin;
            const percent = Math.min(100, (progress / range) * 100);
            return (
              <div style={{ flex: 1, maxWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#2a4a2a' }}>
                    Próximo: {nextLevel.label}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#00ff41' }}>
                    {nextLevel.xpMin - currentXp} XP restantes
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${percent}%`,
                    background: `linear-gradient(90deg, #00ff41, ${nextLevel.color})`,
                    boxShadow: '0 0 8px rgba(0,255,65,0.5)',
                    borderRadius: 3, transition: 'width 1s ease',
                  }} />
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#1a3020', marginTop: 3 }}>
                  {progress} / {range} XP
                </p>
              </div>
            );
          })()}

          {user.level === 'elite' && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#ff4400', fontWeight: 700, margin: 0 }}>
                👑 NÍVEL MÁXIMO ATINGIDO
              </p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#4d1a00', margin: '3px 0 0' }}>
                Acesso total à plataforma
              </p>
            </div>
          )}
        </div>
      )}

      {/* Levels grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {LEVELS.map((lvl) => {
          const isCurrent = user?.level === lvl.key;
          const isUnlocked = user ? currentXp >= lvl.xpMin : false;
          return (
            <div key={lvl.key} style={{
              background: isCurrent ? `linear-gradient(135deg, ${lvl.glow}, rgba(10,18,10,0.95))` : 'rgba(10,18,10,0.8)',
              border: `1px solid ${isCurrent ? lvl.border : 'rgba(0,255,65,0.08)'}`,
              borderRadius: 8,
              padding: 20,
              position: 'relative', overflow: 'hidden',
              boxShadow: isCurrent ? `0 0 20px ${lvl.glow}` : 'none',
              opacity: !isUnlocked && !isCurrent ? 0.55 : 1,
            }}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${lvl.color}, transparent)` }} />
              )}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', fontWeight: 700,
                  padding: '2px 7px', borderRadius: 3,
                  background: `${lvl.glow}`, border: `1px solid ${lvl.border}`,
                  color: lvl.color, letterSpacing: '0.1em',
                }}>
                  ATUAL
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: '1.6rem', filter: isUnlocked || isCurrent ? 'none' : 'grayscale(1)' }}>{lvl.icon}</span>
                <div>
                  <h3 style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
                    fontWeight: 700, color: lvl.color, margin: '0 0 2px',
                    textShadow: isCurrent ? `0 0 10px ${lvl.color}66` : 'none',
                    letterSpacing: '0.1em',
                  }}>
                    {lvl.label}
                  </h3>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#2a4d30', margin: 0 }}>
                    {lvl.xpMin.toLocaleString()}{lvl.xpMax ? ` — ${lvl.xpMax.toLocaleString()} XP` : '+ XP'}
                  </p>
                </div>
              </div>

              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#6a9a6a', marginBottom: 12, lineHeight: 1.5 }}>
                {lvl.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {lvl.perks.map((perk, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <ChevronRight style={{ width: 11, height: 11, flexShrink: 0, marginTop: 1, color: lvl.color, opacity: 0.7 }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#5a8a5a', lineHeight: 1.4 }}>
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* XP Actions */}
      <div style={{
        background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
        borderRadius: 8, padding: 20,
      }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
            {'// COMO GANHAR XP'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {XP_ACTIONS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(0,255,65,0.02)', border: '1px solid rgba(0,255,65,0.08)',
              borderRadius: 5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#6a9a6a' }}>
                  {item.action}
                </span>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700,
                color: item.color, textShadow: `0 0 8px ${item.color}66`,
              }}>
                +{item.xp} XP
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'rgba(255,204,0,0.04)', border: '1px solid rgba(255,204,0,0.12)',
          borderRadius: 5,
        }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#6a6a30', margin: 0, lineHeight: 1.6 }}>
            💡 O XP é acumulativo e o nível sobe automaticamente ao atingir o threshold. Login diário conta apenas uma vez por dia.
          </p>
        </div>

        {!user && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link href="/login" style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
              color: '#00ff41', textDecoration: 'none',
              background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.25)',
              padding: '7px 16px', borderRadius: 4, display: 'inline-block',
            }}>
              CRIAR CONTA E COMEÇAR →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
