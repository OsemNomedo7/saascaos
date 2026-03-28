'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Download, ExternalLink, Lock, Star, ChevronLeft, ChevronRight,
  Eye, Tag, Clock, CreditCard, Send, Trash2, Calendar,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import {
  getContentTypeIcon, getContentTypeLabel, formatBytes, formatRelativeDate, cn,
} from '@/lib/utils';
import type { Content, Review, ReviewStats, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const LEVEL_ORDER: Record<string, number> = {
  iniciante: 0, intermediario: 1, avancado: 2, elite: 3,
};

const TYPE_COLORS: Record<string, string> = {
  programa: '#00d4ff', database: '#ffcc00', material: '#00ff41',
  esquema: '#cc66ff', video: '#ff6644', outro: '#4d8c5a',
};

function StarRating({
  value, onChange, size = 20,
}: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default',
            padding: 1, display: 'flex', alignItems: 'center',
          }}
        >
          <Star
            style={{
              width: size, height: size,
              fill: display >= star ? '#ffcc00' : 'transparent',
              color: display >= star ? '#ffcc00' : '#2a4a2a',
              transition: 'all 0.1s',
            }}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  review, isOwn, onDelete, isDeleting,
}: { review: Review; isOwn: boolean; onDelete: () => void; isDeleting: boolean }) {
  const reviewer = typeof review.user === 'object' ? review.user : null;

  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(10,18,10,0.6)',
      border: '1px solid rgba(0,255,65,0.08)',
      borderRadius: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color: '#00ff41', flexShrink: 0,
          }}>
            {reviewer?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700, color: '#a0c8a0', margin: 0 }}>
              {reviewer?.name || 'Usuário'}
              {isOwn && (
                <span style={{ marginLeft: 6, fontSize: '0.55rem', color: '#00ff41', background: 'rgba(0,255,65,0.1)', padding: '1px 4px', borderRadius: 2, border: '1px solid rgba(0,255,65,0.2)' }}>
                  VOCÊ
                </span>
              )}
            </p>
            <StarRating value={review.rating} size={12} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020' }}>
            {formatRelativeDate(review.createdAt)}
          </span>
          {isOwn && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 3,
                color: '#2a2a2a', transition: 'color 0.15s', opacity: isDeleting ? 0.5 : 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff0040')}
              onMouseLeave={e => (e.currentTarget.style.color = '#2a2a2a')}
            >
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: '0.72rem', color: '#4d7a4d', lineHeight: 1.6, margin: 0 }}>
          {review.comment}
        </p>
      )}
    </div>
  );
}

interface ContentModalProps {
  content: Content | null;
  subscription?: Subscription | null;
  onClose: () => void;
}

export default function ContentModal({ content, subscription, onClose }: ContentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imgIndex, setImgIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(content?.downloads || 0);
  const [downloadError, setDownloadError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewTab, setReviewTab] = useState<'list' | 'write'>('list');

  const closeOnEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', closeOnEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEsc);
      document.body.style.overflow = '';
    };
  }, [closeOnEsc]);

  const { data: reviewData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', content?._id],
    queryFn: () => contentApi.getReviews(content!._id).then((r) => r.data),
    enabled: !!content?._id,
  });

  const reviews: Review[] = reviewData?.reviews || [];
  const stats: ReviewStats | null = reviewData?.stats || null;
  const myReview: Review | null = reviewData?.myReview || null;

  const submitReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      contentApi.createReview(content!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', content?._id] });
      setReviewTab('list');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => contentApi.deleteReview(content!._id, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', content?._id] });
    },
  });

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || '');
    }
  }, [myReview]);

  if (!content) return null;

  const userLevelOrder = LEVEL_ORDER[user?.level || 'iniciante'] || 0;
  const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
  const isLevelLocked = userLevelOrder < contentLevelOrder && user?.role !== 'admin';
  const isSubLocked = !content.isFree && !subscription && user?.role !== 'admin';
  const isLocked = isLevelLocked || isSubLocked;

  const typeColor = TYPE_COLORS[content.type] || '#4d8c5a';
  const category = typeof content.category === 'object' ? content.category : null;
  const allImages = [...(content.thumbnail ? [content.thumbnail] : []), ...(content.images || [])];

  const handleDownload = async () => {
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
        if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) {
          setDownloadError('Arquivo não disponível. O admin precisa fazer re-upload do arquivo.');
          return;
        }
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDownloadError(e?.response?.data?.message || 'Erro ao baixar');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    submitReviewMutation.mutate({ rating, comment });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,5,2,0.92)', backdropFilter: 'blur(8px)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 900,
        maxHeight: '90vh',
        background: '#080f08',
        border: `1px solid ${typeColor}30`,
        borderRadius: 8,
        boxShadow: `0 0 40px ${typeColor}15`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${typeColor}80, transparent)` }} />

        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: `1px solid ${typeColor}18`,
          background: 'rgba(5,10,5,0.6)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.1rem' }}>{getContentTypeIcon(content.type)}</span>
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
                color: typeColor, letterSpacing: '0.15em', marginBottom: 2,
              }}>
                {getContentTypeLabel(content.type).toUpperCase()}
                {content.isFree && (
                  <span style={{ marginLeft: 8, color: '#00ff41', background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 3, padding: '1px 5px', fontSize: '0.55rem' }}>
                    GRÁTIS
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {stats && stats.total > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star style={{ width: 11, height: 11, fill: '#ffcc00', color: '#ffcc00' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#ffcc00' }}>
                      {stats.avgRating.toFixed(1)}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4a2a' }}>
                      ({stats.total})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,0,64,0.08)', border: '1px solid rgba(255,0,64,0.2)',
              borderRadius: 4, color: '#ff0040', cursor: 'pointer', padding: 6,
              display: 'flex', transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,0,64,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,0,64,0.08)')}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body: scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 0, minHeight: 0 }}>

            {/* Left: image + info */}
            <div style={{ flex: 1, minWidth: 0, padding: '18px 20px', borderRight: `1px solid ${typeColor}12` }}>

              {/* Image carousel */}
              {allImages.length > 0 && (
                <div style={{
                  position: 'relative', borderRadius: 6, overflow: 'hidden',
                  marginBottom: 16, aspectRatio: '16/9',
                  background: '#050a05', border: `1px solid ${typeColor}20`,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={allImages[imgIndex]} alt={content.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                  {isLocked && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(5,10,5,0.6)', backdropFilter: 'blur(4px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Lock style={{ width: 36, height: 36, color: isSubLocked ? '#ff4400' : '#ffcc00' }} />
                    </div>
                  )}

                  {allImages.length > 1 && (
                    <>
                      <button onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                        style={{
                          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.7)', border: `1px solid ${typeColor}40`,
                          borderRadius: 4, color: typeColor, cursor: 'pointer', padding: '4px 6px', display: 'flex',
                        }}>
                        <ChevronLeft style={{ width: 16, height: 16 }} />
                      </button>
                      <button onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}
                        style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.7)', border: `1px solid ${typeColor}40`,
                          borderRadius: 4, color: typeColor, cursor: 'pointer', padding: '4px 6px', display: 'flex',
                        }}>
                        <ChevronRight style={{ width: 16, height: 16 }} />
                      </button>
                      <div style={{
                        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: 5,
                      }}>
                        {allImages.map((_, i) => (
                          <button key={i} onClick={() => setImgIndex(i)} style={{
                            width: i === imgIndex ? 18 : 6, height: 6, borderRadius: 3,
                            background: i === imgIndex ? typeColor : `${typeColor}40`,
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                          }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Title */}
              <h2 style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700,
                color: '#c8e8c8', lineHeight: 1.4, margin: '0 0 10px',
              }}>
                {content.title}
              </h2>

              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                <LevelBadge level={content.minLevel} />
                {category && (
                  <span style={{
                    fontSize: '0.62rem', padding: '2px 7px', borderRadius: 3, fontWeight: 600,
                    border: `1px solid ${category.color}40`, background: `${category.color}15`, color: category.color,
                  }}>
                    {category.name}
                  </span>
                )}
                {content.isDrop && (
                  <span style={{
                    fontSize: '0.62rem', padding: '2px 7px', borderRadius: 3, fontWeight: 700,
                    border: '1px solid rgba(255,204,0,0.4)', background: 'rgba(255,204,0,0.1)', color: '#ffcc00',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
                  }}>
                    ⚡ DROP
                  </span>
                )}
              </div>

              {/* Description */}
              {content.description && (
                <p style={{ fontSize: '0.78rem', color: '#4d7a4d', lineHeight: 1.7, marginBottom: 14 }}>
                  {content.description}
                </p>
              )}

              {/* Meta info */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                padding: '12px 14px',
                background: 'rgba(0,255,65,0.03)',
                border: '1px solid rgba(0,255,65,0.08)',
                borderRadius: 5, marginBottom: 14,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 2 }}>VISUALIZAÇÕES</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#4d8c5a' }}>
                    <Eye style={{ width: 12, height: 12 }} /> {content.views}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.55rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 2 }}>DOWNLOADS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#4d8c5a' }}>
                    <Download style={{ width: 12, height: 12 }} /> {downloads}
                  </div>
                </div>
                {content.fileSize > 0 && (
                  <div>
                    <div style={{ fontSize: '0.55rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 2 }}>TAMANHO</div>
                    <div style={{ fontSize: '0.75rem', color: '#4d8c5a' }}>{formatBytes(content.fileSize)}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.55rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 2 }}>ADICIONADO</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#4d8c5a' }}>
                    <Calendar style={{ width: 12, height: 12 }} /> {formatRelativeDate(content.createdAt)}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                  {content.tags.map((tag) => (
                    <span key={tag} style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '0.62rem', color: '#2a4a2a',
                      background: 'rgba(0,255,65,0.04)',
                      border: '1px solid rgba(0,255,65,0.1)',
                      borderRadius: 3, padding: '2px 6px',
                    }}>
                      <Tag style={{ width: 9, height: 9 }} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA / Download */}
              <div>
                {isSubLocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 5,
                      background: 'rgba(255,68,0,0.06)', border: '1px solid rgba(255,68,0,0.2)',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#ff6633',
                    }}>
                      ⚠ Assinatura necessária para acessar este conteúdo
                    </div>
                    <Link href="/planos" onClick={onClose} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 5,
                      background: 'rgba(255,68,0,0.1)', border: '1px solid rgba(255,68,0,0.4)',
                      color: '#ff4400', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', fontWeight: 700,
                      textDecoration: 'none', letterSpacing: '0.1em',
                      boxShadow: '0 0 12px rgba(255,68,0,0.1)',
                    }}>
                      <CreditCard style={{ width: 15, height: 15 }} />
                      VER PLANOS
                    </Link>
                  </div>
                ) : isLevelLocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 5,
                      background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.2)',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#ccaa00',
                    }}>
                      <Lock style={{ width: 12, height: 12, display: 'inline', marginRight: 6 }} />
                      Nível <strong>{content.minLevel.toUpperCase()}</strong> necessário para acessar
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '11px 20px', borderRadius: 5, cursor: isDownloading ? 'not-allowed' : 'pointer',
                        background: isDownloading ? 'rgba(0,255,65,0.05)' : 'rgba(0,255,65,0.1)',
                        border: `1px solid rgba(0,255,65,${isDownloading ? '0.15' : '0.4'})`,
                        color: isDownloading ? '#2a4a2a' : '#00ff41',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700,
                        letterSpacing: '0.1em',
                        boxShadow: isDownloading ? 'none' : '0 0 16px rgba(0,255,65,0.12)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isDownloading) { e.currentTarget.style.background = 'rgba(0,255,65,0.18)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,65,0.2)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.1)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,65,0.12)'; }}
                    >
                      {isDownloading ? (
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(0,255,65,0.3)', borderTopColor: '#00ff41', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      ) : content.externalLink ? (
                        <ExternalLink style={{ width: 15, height: 15 }} />
                      ) : (
                        <Download style={{ width: 15, height: 15 }} />
                      )}
                      {content.externalLink ? 'ABRIR LINK' : 'FAZER DOWNLOAD'}
                    </button>
                    {downloadError && (
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#ff4400', margin: 0 }}>
                        ⚠ {downloadError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Reviews panel */}
            <div style={{ width: 320, flexShrink: 0, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Rating summary */}
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700, color: '#2a4a2a', letterSpacing: '0.15em', marginBottom: 10 }}>
                  {'// AVALIAÇÕES'}
                </div>

                {stats && stats.total > 0 ? (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.2rem', fontWeight: 700, color: '#ffcc00', lineHeight: 1 }}>
                        {stats.avgRating.toFixed(1)}
                      </div>
                      <StarRating value={Math.round(stats.avgRating)} size={14} />
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020', marginTop: 2 }}>
                        {stats.total} avaliações
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const dist = stats.distribution.find((d) => d.star === star);
                        const pct = stats.total > 0 ? ((dist?.count || 0) / stats.total) * 100 : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4a2a', width: 8 }}>{star}</span>
                            <Star style={{ width: 9, height: 9, fill: '#ffcc00', color: '#ffcc00' }} />
                            <div style={{ flex: 1, height: 5, background: 'rgba(0,255,65,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#ffcc00', borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#1a3020', width: 14, textAlign: 'right' }}>
                              {dist?.count || 0}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '14px', textAlign: 'center',
                    background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.06)',
                    borderRadius: 5, marginBottom: 12,
                  }}>
                    <Star style={{ width: 22, height: 22, color: '#1a3020', margin: '0 auto 6px' }} />
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#1a3020', margin: 0 }}>
                      Sem avaliações ainda
                    </p>
                  </div>
                )}
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(0,255,65,0.08)', paddingBottom: 10 }}>
                {(['list', 'write'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReviewTab(tab)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '4px 10px', borderRadius: 3, border: '1px solid',
                      cursor: 'pointer',
                      background: reviewTab === tab ? 'rgba(0,255,65,0.1)' : 'transparent',
                      color: reviewTab === tab ? '#00ff41' : '#2a4a2a',
                      borderColor: reviewTab === tab ? 'rgba(0,255,65,0.3)' : 'transparent',
                    }}
                  >
                    {tab === 'list' ? 'VER TODAS' : myReview ? 'MINHA AVALIAÇÃO' : '+ AVALIAR'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviewTab === 'write' ? (
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 6 }}>
                        SUA NOTA
                      </div>
                      <StarRating value={rating} onChange={setRating} size={22} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#1a3020', letterSpacing: '0.15em', marginBottom: 6 }}>
                        COMENTÁRIO (opcional)
                      </div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Descreva sua experiência com este conteúdo..."
                        rows={4}
                        style={{
                          width: '100%', background: 'rgba(5,10,5,0.8)',
                          border: '1px solid rgba(0,255,65,0.15)', borderRadius: 4,
                          color: '#a0c8a0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
                          padding: '8px 10px', outline: 'none', resize: 'none', boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,65,0.35)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)'; }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!rating || submitReviewMutation.isPending}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 16px', borderRadius: 4, cursor: !rating || submitReviewMutation.isPending ? 'not-allowed' : 'pointer',
                        background: !rating ? 'rgba(0,255,65,0.03)' : 'rgba(0,255,65,0.1)',
                        border: `1px solid rgba(0,255,65,${!rating ? '0.1' : '0.35'})`,
                        color: !rating ? '#1a3020' : '#00ff41',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.1em', opacity: submitReviewMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {submitReviewMutation.isPending ? (
                        <div style={{ width: 12, height: 12, border: '2px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      ) : (
                        <Send style={{ width: 13, height: 13 }} />
                      )}
                      {myReview ? 'ATUALIZAR' : 'ENVIAR AVALIAÇÃO'}
                    </button>
                    {submitReviewMutation.isError && (
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#ff4400', margin: 0 }}>
                        Erro ao enviar avaliação
                      </p>
                    )}
                  </form>
                ) : (
                  <>
                    {reviewsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} style={{ height: 60, borderRadius: 5, background: 'rgba(10,18,10,0.6)', animation: 'pulse 1.5s infinite' }} />
                      ))
                    ) : reviews.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#1a3020' }}>
                        Nenhuma avaliação ainda
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <ReviewCard
                          key={review._id}
                          review={review}
                          isOwn={typeof review.user === 'object' ? review.user._id === user?._id : review.user === user?._id}
                          onDelete={() => deleteReviewMutation.mutate(review._id)}
                          isDeleting={deleteReviewMutation.isPending}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
