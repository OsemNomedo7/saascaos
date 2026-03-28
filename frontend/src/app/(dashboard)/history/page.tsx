'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Clock, FileText, ExternalLink } from 'lucide-react';
import { downloadsApi } from '@/lib/api';
import { formatRelativeDate, formatBytes } from '@/lib/utils';

interface DownloadEntry {
  _id: string;
  action: string;
  resourceId: string | null;
  resourceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['download-history'],
    queryFn: () => downloadsApi.history().then((r) => r.data),
  });

  const downloads: DownloadEntry[] = data?.downloads || data?.logs || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Download style={{ width: 16, height: 16, color: '#00ff41' }} />
        <h1 style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.1rem', fontWeight: 700,
          color: '#00ff41', letterSpacing: '0.12em', margin: 0,
          textShadow: '0 0 12px rgba(0,255,65,0.4)',
        }}>{'// HISTÓRICO DE DOWNLOADS'}</h1>
        {downloads.length > 0 && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4a2a' }}>
            {`> ${downloads.length} registros`}
          </span>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 56, borderRadius: 5,
              background: 'rgba(10,18,10,0.6)', border: '1px solid rgba(0,255,65,0.06)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : downloads.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px solid rgba(0,255,65,0.1)',
          borderRadius: 6, background: 'rgba(10,18,10,0.6)',
        }}>
          <Download style={{ width: 36, height: 36, color: '#1a3020', margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#2a6a3a', marginBottom: 6 }}>
            {'> NENHUM DOWNLOAD REGISTRADO'}
          </p>
          <p style={{ fontSize: '0.7rem', color: '#1a3020' }}>Seus downloads aparecerão aqui</p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
          borderRadius: 6, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 100px',
            gap: 12, padding: '10px 16px',
            background: 'rgba(0,255,65,0.03)',
            borderBottom: '1px solid rgba(0,255,65,0.1)',
          }}>
            {['ARQUIVO', 'TIPO', 'DATA'].map((h) => (
              <span key={h} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.15em' }}>
                {h}
              </span>
            ))}
          </div>

          {downloads.map((entry, i) => {
            const title = (entry.metadata?.title as string) || (entry.metadata?.contentTitle as string) || entry.resourceId || 'Arquivo';
            const fileType = (entry.metadata?.type as string) || entry.resourceType || 'arquivo';
            return (
              <div key={entry._id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 100px',
                gap: 12, padding: '12px 16px',
                borderBottom: i < downloads.length - 1 ? '1px solid rgba(0,255,65,0.06)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,255,65,0.02)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                    background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                  }}>
                    📥
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#a0c8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {title}
                    </p>
                    {entry.metadata?.fileSize && (
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4d30', margin: '1px 0 0' }}>
                        {formatBytes(entry.metadata.fileSize as number)}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
                    padding: '2px 7px', borderRadius: 3,
                    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                    color: '#00d4ff', textTransform: 'uppercase',
                  }}>
                    {fileType}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#2a4d30' }}>
                    {formatRelativeDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
