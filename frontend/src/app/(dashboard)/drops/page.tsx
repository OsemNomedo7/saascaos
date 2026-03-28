'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Zap, Clock, Download, ExternalLink, AlertTriangle, Package } from 'lucide-react';
import { dropsApi, contentApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getContentTypeIcon, getContentTypeLabel, getCountdown, formatRelativeDate, formatBytes } from '@/lib/utils';
import type { Content } from '@/types';

function DropCountdown({ expiresAt }: { expiresAt: string }) {
  const [countdown, setCountdown] = useState(getCountdown(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (countdown.expired) {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-sm font-mono">
        <AlertTriangle className="w-4 h-4" />
        <span>Expired</span>
      </div>
    );
  }

  const urgency = countdown.hours === 0 && countdown.minutes < 30;

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-bold ${urgency ? 'text-red-400' : 'text-green-400'}`}>
      <div className="flex items-center gap-1 text-gray-500 text-sm font-sans font-normal">
        <Clock className="w-3.5 h-3.5" />
        <span>Expires in</span>
      </div>
      <span className={`${urgency ? 'animate-pulse' : ''}`}>
        {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

function DropCard({ drop }: { drop: Content }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(drop.downloads);
  const category = typeof drop.category === 'object' ? drop.category : null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await contentApi.download(drop._id);
      const { fileUrl, externalLink } = response.data;
      setDownloads((d) => d + 1);

      if (externalLink) {
        window.open(externalLink, '_blank', 'noopener,noreferrer');
      } else if (fileUrl) {
        if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) return;
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const countdown = getCountdown(drop.dropExpiresAt!);
  const isUrgent = !countdown.expired && countdown.hours === 0 && countdown.minutes < 60;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      isUrgent
        ? 'border-red-500/20 bg-red-500/3'
        : 'border-yellow-500/15 bg-yellow-500/3'
    } hover:shadow-lg`}>
      {/* Urgency banner */}
      {isUrgent && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-400">Expires soon!</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gray-800/60 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-gray-700/40">
            {getContentTypeIcon(drop.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                🔥 DROP
              </span>
              <LevelBadge level={drop.minLevel} size="sm" />
              {category && (
                <span
                  className="text-xs px-2 py-0.5 rounded border font-medium"
                  style={{ color: category.color, borderColor: `${category.color}40`, backgroundColor: `${category.color}15` }}
                >
                  {category.name}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-100">{drop.title}</h3>
            <span className="text-xs text-gray-500">{getContentTypeLabel(drop.type)}</span>
          </div>
        </div>

        {drop.description && (
          <p className="text-sm text-gray-400 mb-4">{drop.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
          <span>{downloads} downloads</span>
          {drop.fileSize > 0 && <span>{formatBytes(drop.fileSize)}</span>}
          <span>Added {formatRelativeDate(drop.createdAt)}</span>
        </div>

        {/* Countdown */}
        {drop.dropExpiresAt && (
          <div className="mb-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
            <DropCountdown expiresAt={drop.dropExpiresAt} />
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || countdown.expired}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            countdown.expired
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40'
          }`}
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          ) : countdown.expired ? (
            <>
              <AlertTriangle className="w-4 h-4" /> Drop Expired
            </>
          ) : drop.externalLink ? (
            <>
              <ExternalLink className="w-4 h-4" /> Open Link
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Now
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

export default function DropsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['drops'],
    queryFn: () => dropsApi.list().then((r) => r.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const drops: Content[] = data?.drops || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Visual Banner */}
      <div style={{
        marginBottom: 22, borderRadius: 8, overflow: 'hidden', position: 'relative', height: 220,
        background: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(255,204,0,0.22)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,10,0,0.80) 0%, rgba(30,20,0,0.60) 55%, rgba(0,0,0,0.25) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,204,0,0.015) 3px, rgba(255,204,0,0.015) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,204,0,0.5), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap style={{ width: 20, height: 20, color: '#ffcc00' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#ffcc00', letterSpacing: '0.2em', margin: '0 0 5px', opacity: 0.7 }}>{'// ELITE TROJAN > DROPS > TEMPO LIMITADO'}</p>
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700, color: '#fff8e0', margin: '0 0 4px', textShadow: '0 0 20px rgba(255,204,0,0.4)' }}>DROPS EXCLUSIVOS</h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#8a7a30', margin: 0 }}>{'> Conteúdo exclusivo por tempo limitado — não perca!'}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Active Drops</h1>
            <p className="text-gray-500 text-sm">Time-limited exclusive content</p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-sm text-yellow-600/80 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          Drops are exclusive content available for a limited time. Don&apos;t miss them!
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Failed to load drops</p>
          <p className="text-gray-600 text-sm mt-1">Make sure you have an active subscription</p>
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-20 border border-gray-800 rounded-xl bg-gray-900/50">
          <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-lg font-semibold">No active drops</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon for exclusive time-limited content!</p>
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
