'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { categoriesApi, contentApi } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';
import { useState } from 'react';
import type { Content } from '@/types';

const mono = { fontFamily: 'JetBrains Mono, monospace' } as const;

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState(1);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug).then((r) => r.data),
  });

  const category = catData?.category;

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['category-content', category?._id, page],
    queryFn: () =>
      contentApi.list({ category: category!._id, page, limit: 18 }).then((r) => r.data),
    enabled: !!category?._id,
  });

  const contents: Content[] = contentData?.contents || [];
  const pagination = contentData?.pagination;

  if (catLoading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ height: 160, background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 20 }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 192, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
        <p style={{ ...mono, color: '#6a8898', marginBottom: 16 }}>Categoria não encontrada</p>
        <Link href="/content" style={{ ...mono, fontSize: '0.72rem', color: '#00d4ff', textDecoration: 'none' }}>
          ← Voltar à biblioteca
        </Link>
      </div>
    );
  }

  const color = category.color || '#00d4ff';

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Back link */}
      <Link
        href="/content"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...mono, fontSize: '0.65rem', color: '#6a8898', textDecoration: 'none', marginBottom: 16, transition: 'color 0.15s' }}
        onMouseOver={e => (e.currentTarget.style.color = '#00d4ff')}
        onMouseOut={e => (e.currentTarget.style.color = '#6a8898')}
      >
        <ArrowLeft style={{ width: 13, height: 13 }} /> voltar à biblioteca
      </Link>

      {/* Category header */}
      <div style={{
        padding: '28px 32px',
        background: `linear-gradient(135deg, ${color}10 0%, rgba(0,0,0,0) 60%)`,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 12, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: `0 0 20px ${color}22`,
          }}>
            {category.icon || '📁'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ ...mono, fontSize: '0.55rem', color, letterSpacing: '0.2em', margin: 0, opacity: 0.7 }}>
                // CATEGORIA
              </p>
            </div>
            <h1 style={{ ...mono, fontSize: '1.4rem', fontWeight: 700, color: '#e0f0ff', margin: '0 0 6px', textShadow: `0 0 20px ${color}44` }}>
              {category.name}
            </h1>
            {category.description && (
              <p style={{ ...mono, fontSize: '0.7rem', color: '#8ab0c8', margin: '0 0 10px', lineHeight: 1.6, maxWidth: 600 }}>
                {category.description}
              </p>
            )}
            {pagination && (
              <span style={{ ...mono, fontSize: '0.6rem', color: '#6a8898' }}>
                {pagination.total} arquivo{pagination.total !== 1 ? 's' : ''} disponíve{pagination.total !== 1 ? 'is' : 'l'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content grid */}
      {contentLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 192, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }} />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <Library style={{ width: 36, height: 36, color: '#2a4a5a', margin: '0 auto 10px' }} />
          <p style={{ ...mono, fontSize: '0.72rem', color: '#6a8898' }}>Nenhum conteúdo nesta categoria ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((item) => (
            <ContentCard key={item._id} content={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: '#00d4ff', ...mono, fontSize: '0.65rem' }}
          >
            <ChevronLeft style={{ width: 13, height: 13 }} /> ANTERIOR
          </button>
          <span style={{ ...mono, fontSize: '0.65rem', color: '#6a8898' }}>{page} / {pagination.pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 4, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', opacity: page === pagination.pages ? 0.4 : 1, color: '#00d4ff', ...mono, fontSize: '0.65rem' }}
          >
            PRÓXIMA <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}
    </div>
  );
}
