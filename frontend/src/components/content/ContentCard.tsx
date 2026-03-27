'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Eye, ExternalLink, Lock, Clock, Tag, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { contentApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import {
  getContentTypeIcon,
  getContentTypeLabel,
  formatBytes,
  formatRelativeDate,
  cn,
} from '@/lib/utils';
import type { Content, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const LEVEL_ORDER: Record<string, number> = {
  iniciante: 0,
  intermediario: 1,
  avancado: 2,
  elite: 3,
};

const TYPE_COLORS: Record<string, string> = {
  programa: '#00d4ff',
  database: '#ffcc00',
  material: '#00ff41',
  esquema: '#cc66ff',
  video: '#ff6644',
  outro: '#4d8c5a',
};

interface ContentCardProps {
  content: Content;
  subscription?: Subscription | null;
  onDownload?: () => void;
}

export default function ContentCard({ content, subscription, onDownload }: ContentCardProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(content.downloads);
  const [imgIndex, setImgIndex] = useState(0);
  const [downloadError, setDownloadError] = useState('');

  const userLevelOrder = LEVEL_ORDER[user?.level || 'iniciante'] || 0;
  const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
  const isLevelLocked = userLevelOrder < contentLevelOrder && user?.role !== 'admin';
  const isSubLocked = !subscription && user?.role !== 'admin';
  const isLocked = isLevelLocked || isSubLocked;

  const category = typeof content.category === 'object' ? content.category : null;
  const typeColor = TYPE_COLORS[content.type] || '#4d8c5a';

  const allImages = [
    ...(content.thumbnail ? [content.thumbnail] : []),
    ...(content.images || []),
  ];

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked || isDownloading) return;
    setDownloadError('');

    setIsDownloading(true);
    try {
      const response = await contentApi.download(content._id);
      const { fileUrl, externalLink } = response.data;

      setDownloads((d) => d + 1);

      if (externalLink) {
        window.open(externalLink, '_blank', 'noopener,noreferrer');
      } else if (fileUrl) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = content.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onDownload?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDownloadError(e?.response?.data?.message || 'Erro ao baixar');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(10,18,10,0.9)',
      border: `1px solid rgba(${isLevelLocked ? '255,204,0' : isSubLocked ? '255,68,0' : '0,255,65'},0.18)`,
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s ease',
      overflow: 'hidden',
      position: 'relative',
    }}
      onMouseEnter={e => {
        const color = isLevelLocked ? '255,204,0' : isSubLocked ? '255,68,0' : '0,255,65';
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${color},0.4)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px rgba(${color},0.08)`;
      }}
      onMouseLeave={e => {
        const color = isLevelLocked ? '255,204,0' : isSubLocked ? '255,68,0' : '0,255,65';
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${color},0.18)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Image carousel */}
      {allImages.length > 0 && (
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#050a05' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[imgIndex]}
            alt={content.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isLocked ? 0.4 : 1 }}
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                style={{
                  position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,65,0.3)',
                  borderRadius: 3, color: '#00ff41', cursor: 'pointer', padding: '2px 4px', display: 'flex',
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <button
                onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,65,0.3)',
                  borderRadius: 3, color: '#00ff41', cursor: 'pointer', padding: '2px 4px', display: 'flex',
                }}
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    style={{
                      width: i === imgIndex ? 16 : 5, height: 5,
                      borderRadius: 3, border: 'none', cursor: 'pointer',
                      background: i === imgIndex ? '#00ff41' : 'rgba(0,255,65,0.3)',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {isLocked && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(5,10,5,0.5)',
            }}>
              <Lock style={{ width: 28, height: 28, color: isSubLocked ? '#ff4400' : '#ffcc00' }} />
            </div>
          )}
        </div>
      )}

      {/* Type badge top-left if no image */}
      {allImages.length === 0 && (
        <div style={{
          padding: '10px 14px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 4, flexShrink: 0,
            background: `${typeColor}14`,
            border: `1px solid ${typeColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            {getContentTypeIcon(content.type)}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: typeColor,
            background: `${typeColor}14`,
            border: `1px solid ${typeColor}30`,
            borderRadius: 3,
            padding: '2px 6px',
          }}>
            {getContentTypeLabel(content.type).toUpperCase()}
          </div>
        </div>
      )}

      {/* Content body */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <h3 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: isLocked ? '#3a4a3a' : '#c8e8c8',
            lineHeight: 1.4,
            margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {content.title}
          </h3>
          {isLevelLocked && <Lock style={{ width: 13, height: 13, color: '#ffcc00', flexShrink: 0 }} />}
          {isSubLocked && !isLevelLocked && <Lock style={{ width: 13, height: 13, color: '#ff4400', flexShrink: 0 }} />}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {allImages.length > 0 && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: typeColor,
              background: `${typeColor}14`,
              border: `1px solid ${typeColor}30`,
              borderRadius: 3,
              padding: '1px 5px',
            }}>
              {getContentTypeLabel(content.type).toUpperCase()}
            </span>
          )}
          <LevelBadge level={content.minLevel} size="sm" />
          {category && (
            <span style={{
              fontSize: '0.6rem',
              padding: '1px 5px',
              borderRadius: 3,
              border: `1px solid ${category.color}40`,
              backgroundColor: `${category.color}15`,
              color: category.color,
              fontWeight: 600,
            }}>
              {category.name}
            </span>
          )}
        </div>

        {content.description && (
          <p style={{
            fontSize: '0.7rem',
            color: '#3a5a3a',
            margin: '0 0 6px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
          }}>
            {content.description}
          </p>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
            {content.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={{
                display: 'flex', alignItems: 'center', gap: 2,
                fontSize: '0.6rem', color: '#2a4a2a',
                background: 'rgba(0,255,65,0.04)',
                border: '1px solid rgba(0,255,65,0.1)',
                borderRadius: 3, padding: '1px 5px',
              }}>
                <Tag style={{ width: 8, height: 8 }} />
                {tag}
              </span>
            ))}
            {content.tags.length > 3 && (
              <span style={{ fontSize: '0.6rem', color: '#2a4a2a' }}>+{content.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(0,255,65,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.62rem', color: '#2a4a2a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Eye style={{ width: 10, height: 10 }} /> {content.views}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Download style={{ width: 10, height: 10 }} /> {downloads}
          </span>
          {content.fileSize > 0 && (
            <span style={{ color: '#1a3020' }}>{formatBytes(content.fileSize)}</span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock style={{ width: 10, height: 10 }} />
            {formatRelativeDate(content.createdAt)}
          </span>
        </div>

        {isSubLocked ? (
          <Link href="/planos" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            color: '#ff4400',
            background: 'rgba(255,68,0,0.08)',
            border: '1px solid rgba(255,68,0,0.3)',
            borderRadius: 4,
            padding: '4px 8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            <CreditCard style={{ width: 10, height: 10 }} />
            ASSINAR
          </Link>
        ) : isLevelLocked ? (
          <Link href="/planos" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            color: '#ffcc00',
            background: 'rgba(255,204,0,0.08)',
            border: '1px solid rgba(255,204,0,0.3)',
            borderRadius: 4,
            padding: '4px 8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            <Lock style={{ width: 10, height: 10 }} />
            UPGRADE
          </Link>
        ) : (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.65rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              color: isDownloading ? '#2a4a2a' : '#00ff41',
              background: 'rgba(0,255,65,0.07)',
              border: `1px solid rgba(0,255,65,${isDownloading ? '0.1' : '0.3'})`,
              borderRadius: 4,
              padding: '4px 8px',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!isDownloading) {
                (e.currentTarget).style.background = 'rgba(0,255,65,0.14)';
                (e.currentTarget).style.boxShadow = '0 0 8px rgba(0,255,65,0.2)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.background = 'rgba(0,255,65,0.07)';
              (e.currentTarget).style.boxShadow = 'none';
            }}
          >
            {isDownloading ? (
              <div style={{
                width: 10, height: 10,
                border: '2px solid rgba(0,255,65,0.3)',
                borderTopColor: '#00ff41',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : content.externalLink ? (
              <ExternalLink style={{ width: 10, height: 10 }} />
            ) : (
              <Download style={{ width: 10, height: 10 }} />
            )}
            {content.externalLink ? 'ABRIR' : 'DOWNLOAD'}
          </button>
        )}
      </div>

      {downloadError && (
        <div style={{
          padding: '4px 14px',
          fontSize: '0.62rem',
          color: '#ff4400',
          background: 'rgba(255,68,0,0.05)',
          borderTop: '1px solid rgba(255,68,0,0.1)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          ⚠ {downloadError}
        </div>
      )}
    </div>
  );
}
