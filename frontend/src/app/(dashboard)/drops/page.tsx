'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Zap, Clock, Download, ExternalLink, AlertTriangle, Package } from 'lucide-react';
import { dropsApi, contentApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { getContentTypeIcon, getContentTypeLabel, getCountdown, formatRelativeDate, formatBytes } from '@/lib/utils';
import type { Content, Category } from '@/types';

const mono = { fontFamily: 'JetBrains Mono, monospace' } as const;

function DropCountdown({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState(getCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (countdown.expired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle style={{ width: 13, height: 13, color: '#ff4455' }} />
        <span style={{ ...mono, fontSize: '0.72rem', color: '#ff4455' }}>EXPIRADO</span>
      </div>
    );
  }

  const urgent = countdown.hours === 0 && countdown.minutes < 60;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Clock style={{ width: 12, height: 12, color: urgent ? '#ff6633' : '#ffcc00', flexShrink: 0 }} />
      <span style={{
        ...mono, fontWeight: 700,
        fontSize: '0.85rem',
        color: urgent ? '#ff6633' : '#ffcc00',
        textShadow: urgent ? '0 0 8px rgba(255,100,50,0.5)' : '0 0 8px rgba(255,204,0,0.4)',
        animation: urgent ? 'pulse 1s infinite' : 'none',
      }}>
        {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

function DropCard({ drop }: { drop: Content }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(drop.downloads);
  const category = typeof drop.category === 'object' ? drop.category as Category : null;
  const countdown = getCountdown(drop.dropExpiresAt!);
  const isExpired = countdown.expired;
  const isUrgent = !isExpired && countdown.hours === 0 && countdown.minutes < 60;

  const handleDownload = async () => {
    if (isDownloading || isExpired) return;
    setIsDownloading(true);
    try {
      const response = await contentApi.download(drop._id);
      const { fileUrl, externalLink } = response.data;
      setDownloads(d => d + 1);
      if (externalLink) window.open(externalLink, '_blank', 'noopener,noreferrer');
      else if (fileUrl && !fileUrl.includes('localhost')) window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const accentColor = isExpired ? '#555' : isUrgent ? '#ff6633' : '#ffcc00';

  return (
    <div style={{
      background: '#060d18',
      border: `1px solid ${accentColor}28`,
      borderRadius: 10, overflow: 'hidden',
      position: 'relative',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isUrgent ? `0 0 16px rgba(255,100,50,0.08)` : 'none',
      opacity: isExpired ? 0.55 : 1,
    }}
      onMouseOver={e => { if (!isExpired) (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}55`; }}
      onMouseOut={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}28`}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`, zIndex: 1 }} />

      {/* Urgency banner */}
      {isUrgent && (
        <div style={{ background: 'rgba(255,100,50,0.1)', borderBottom: '1px solid rgba(255,100,50,0.2)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle style={{ width: 11, height: 11, color: '#ff6633' }} />
          <span style={{ ...mono, fontSize: '0.58rem', color: '#ff6633', letterSpacing: '0.1em' }}>EXPIRA EM BREVE!</span>
        </div>
      )}

      {/* Thumbnail */}
      {drop.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={drop.thumbnail}
          alt={drop.title}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: 120,
          background: `linear-gradient(135deg, ${accentColor}12 0%, rgba(0,0,0,0) 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '3rem', opacity: 0.4 }}>{getContentTypeIcon(drop.type)}</span>
        </div>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <span style={{
            ...mono, fontSize: '0.58rem', fontWeight: 700,
            color: accentColor, background: `${accentColor}12`,
            border: `1px solid ${accentColor}35`,
            borderRadius: 4, padding: '2px 7px',
          }}>
            ⚡ DROP
          </span>
          <LevelBadge level={drop.minLevel} size="sm" />
          {category && (
            <span style={{
              ...mono, fontSize: '0.58rem', fontWeight: 600,
              color: category.color, background: `${category.color}15`,
              border: `1px solid ${category.color}35`,
              borderRadius: 4, padding: '2px 7px',
            }}>
              {category.icon && `${category.icon} `}{category.name}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ ...mono, fontSize: '0.85rem', fontWeight: 700, color: '#d0e8f8', margin: '0 0 4px', lineHeight: 1.3 }}>
          {drop.title}
        </h3>
        <p style={{ ...mono, fontSize: '0.6rem', color: '#6a8898', margin: '0 0 8px' }}>
          {getContentTypeLabel(drop.type)}
          {drop.fileSize > 0 ? ` · ${formatBytes(drop.fileSize)}` : ''}
          {` · ${downloads} downloads`}
        </p>

        {drop.description && (
          <p style={{ fontSize: '0.72rem', color: '#7a9aaa', margin: '0 0 12px', lineHeight: 1.5 }}>
            {drop.description}
          </p>
        )}

        {/* Countdown */}
        {drop.dropExpiresAt && (
          <div style={{
            padding: '8px 12px', marginBottom: 12,
            background: isUrgent ? 'rgba(255,100,50,0.07)' : 'rgba(255,204,0,0.05)',
            border: `1px solid ${isUrgent ? 'rgba(255,100,50,0.2)' : 'rgba(255,204,0,0.15)'}`,
            borderRadius: 6,
          }}>
            <DropCountdown expiresAt={drop.dropExpiresAt} />
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || isExpired}
          style={{
            width: '100%', padding: '9px 14px',
            background: isExpired ? 'rgba(255,255,255,0.04)' : `${accentColor}14`,
            border: `1px solid ${isExpired ? 'rgba(255,255,255,0.08)' : accentColor + '35'}`,
            borderRadius: 8, cursor: isExpired ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            ...mono, fontSize: '0.68rem', fontWeight: 700,
            color: isExpired ? '#3a4a5a' : accentColor,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { if (!isExpired) (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}22`; }}
          onMouseOut={e => { if (!isExpired) (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}14`; }}
        >
          {isDownloading ? (
            <div style={{ width: 14, height: 14, border: `2px solid ${accentColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : isExpired ? (
            <><AlertTriangle style={{ width: 13, height: 13 }} /> DROP EXPIRADO</>
          ) : drop.externalLink ? (
            <><ExternalLink style={{ width: 13, height: 13 }} /> ABRIR LINK</>
          ) : (
            <><Download style={{ width: 13, height: 13 }} /> BAIXAR AGORA</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DropsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['drops'],
    queryFn: () => dropsApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });

  const drops: Content[] = data?.drops || [];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Banner */}
      <div style={{
        marginBottom: 22, borderRadius: 8, overflow: 'hidden', position: 'relative', height: 220,
        background: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(255,204,0,0.22)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,10,0,0.82) 0%, rgba(30,20,0,0.62) 55%, rgba(0,0,0,0.25) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,204,0,0.015) 3px, rgba(255,204,0,0.015) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,204,0,0.5), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap style={{ width: 22, height: 22, color: '#ffcc00' }} />
          </div>
          <div>
            <p style={{ ...mono, fontSize: '0.58rem', color: '#ffcc00', letterSpacing: '0.2em', margin: '0 0 5px', opacity: 0.7 }}>{'// ELITE TROJAN > DROPS > TEMPO LIMITADO'}</p>
            <h2 style={{ ...mono, fontSize: '1.3rem', fontWeight: 700, color: '#fff8e0', margin: '0 0 4px', textShadow: '0 0 20px rgba(255,204,0,0.4)' }}>DROPS EXCLUSIVOS</h2>
            <p style={{ ...mono, fontSize: '0.65rem', color: '#8a7a30', margin: 0 }}>
              {drops.length > 0 ? `> ${drops.length} drop${drops.length !== 1 ? 's' : ''} ativo${drops.length !== 1 ? 's' : ''} agora` : '> carregando drops...'}
            </p>
          </div>
        </div>
      </div>

      {/* Alert bar */}
      <div style={{
        marginBottom: 20, padding: '10px 16px',
        background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.15)',
        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertTriangle style={{ width: 14, height: 14, color: '#ffcc00', flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: '0.65rem', color: '#8a7a30' }}>
          Drops são conteúdos exclusivos disponíveis por tempo limitado — baixe antes que expire!
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 340, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid rgba(255,68,0,0.15)', borderRadius: 10 }}>
          <AlertTriangle style={{ width: 36, height: 36, color: '#ff4455', margin: '0 auto 10px' }} />
          <p style={{ ...mono, fontSize: '0.75rem', color: '#ff4455' }}>Falha ao carregar drops</p>
          <p style={{ ...mono, fontSize: '0.62rem', color: '#6a8898', marginTop: 4 }}>Você precisa de uma assinatura ativa</p>
        </div>
      ) : drops.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
          <Package style={{ width: 40, height: 40, color: '#1a3a55', margin: '0 auto 12px' }} />
          <p style={{ ...mono, fontSize: '0.85rem', fontWeight: 700, color: '#7a9aaa', marginBottom: 4 }}>Nenhum drop ativo</p>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#6a8898' }}>Volte em breve para conteúdos exclusivos por tempo limitado!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drops.map((drop) => (
            <DropCard key={drop._id} drop={drop} />
          ))}
        </div>
      )}
    </div>
  );
}
