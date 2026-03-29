'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Grid3X3, List, SlidersHorizontal, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import { contentApi, categoriesApi, subscriptionsApi } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';
import ContentFilter from '@/components/content/ContentFilter';
import ContentModal from '@/components/content/ContentModal';
import type { Content, Category, Subscription } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [modalContent, setModalContent] = useState<Content | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['content', { search, selectedCategory, selectedType, selectedLevel, sortBy, page }],
    queryFn: () =>
      contentApi.list({
        search: search || undefined,
        category: selectedCategory || undefined,
        type: selectedType || undefined,
        level: selectedLevel || undefined,
        sort: sortBy,
        page,
        limit: 18,
      }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const categories: Category[] = categoriesData?.categories || [];
  const contents: Content[] = data?.contents || [];
  const pagination = data?.pagination;
  const subscription = subData?.subscription as Subscription | null;
  const hasSubscription = !!subscription;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleReset = () => {
    setSearch('');
    setSearchInput('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedLevel('');
    setSortBy('-createdAt');
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Visual Banner */}
      <div style={{
        marginBottom: 22,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        height: 220,
        background: 'url(https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(0,212,255,0.22)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,8,20,0.82) 0%, rgba(0,20,35,0.6) 55%, rgba(0,0,0,0.25) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.015) 3px, rgba(0,212,255,0.015) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#00d4ff', letterSpacing: '0.2em', margin: '0 0 5px', opacity: 0.7 }}>
              {'// ELITE TROJAN > SISTEMA > BIBLIOTECA'}
            </p>
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700, color: '#e0f8ff', margin: '0 0 4px', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              BIBLIOTECA DE CONTEÚDO
            </h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4a8a9a', margin: 0 }}>
              {pagination ? `> ${pagination.total} arquivos disponíveis no sistema` : '> carregando arquivos...'}
            </p>
          </div>
          {!hasSubscription && (
            <div style={{ marginLeft: 'auto' }}>
              <a href="/planos" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 4, textDecoration: 'none',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.4)',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
                color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.4)',
              }}>
                💎 ASSINAR →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Library style={{ width: 16, height: 16, color: '#00ff41' }} />
              <h1 style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#00ff41',
                letterSpacing: '0.12em',
                margin: 0,
                textShadow: '0 0 12px rgba(0,255,65,0.4)',
              }}>
                {'// BIBLIOTECA DE CONTEÚDO'}
              </h1>
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4a2a', margin: 0 }}>
              {pagination
                ? `> ${pagination.total} arquivos disponíveis no sistema`
                : '> carregando arquivos...'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
                color: '#00ff41', background: 'rgba(0,255,65,0.06)',
                border: '1px solid rgba(0,255,65,0.2)',
              }}
            >
              <SlidersHorizontal style={{ width: 13, height: 13 }} />
              FILTROS
            </button>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(10,18,10,0.9)',
              border: '1px solid rgba(0,255,65,0.15)',
              borderRadius: 4, padding: 3, gap: 2,
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '4px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: viewMode === 'grid' ? 'rgba(0,255,65,0.12)' : 'transparent',
                  color: viewMode === 'grid' ? '#00ff41' : '#2a4a2a',
                  display: 'flex',
                }}
              >
                <Grid3X3 style={{ width: 14, height: 14 }} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: viewMode === 'list' ? 'rgba(0,255,65,0.12)' : 'transparent',
                  color: viewMode === 'list' ? '#00ff41' : '#2a4a2a',
                  display: 'flex',
                }}
              >
                <List style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Subscription warning */}
        {!hasSubscription && user?.role !== 'admin' && (
          <div style={{
            marginTop: 14,
            padding: '10px 16px',
            background: 'rgba(255,68,0,0.06)',
            border: '1px solid rgba(255,68,0,0.25)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#ff6633' }}>
              <span style={{ color: '#ff4400', fontWeight: 700 }}>⚠ ACESSO RESTRITO</span>
              {' — '}Você precisa de uma assinatura ativa para baixar conteúdo.
            </div>
            <Link href="/planos" style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#ff4400',
              background: 'rgba(255,68,0,0.1)',
              border: '1px solid rgba(255,68,0,0.4)',
              borderRadius: 4,
              padding: '4px 10px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              VER PLANOS →
            </Link>
          </div>
        )}
      </div>

      {/* Featured Banner */}
      <div style={{
        marginBottom: 20,
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,255,65,0.03) 60%, transparent 100%)',
        border: '1px solid rgba(0,212,255,0.15)',
        borderRadius: 6,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -10, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '1rem' }}>💎</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#00d4ff', letterSpacing: '0.15em', fontWeight: 700 }}>
              BIBLIOTECA EXCLUSIVA
            </span>
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#4a7a8a', margin: 0 }}>
            Programas, ferramentas, databases e materiais premium — tudo em um só lugar.
          </p>
        </div>
        {!hasSubscription && user?.role !== 'admin' && (
          <Link href="/planos" style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
            color: '#00d4ff', background: 'rgba(0,212,255,0.07)',
            border: '1px solid rgba(0,212,255,0.25)', borderRadius: 4,
            padding: '6px 14px', textDecoration: 'none', flexShrink: 0,
          }}>
            ASSINAR →
          </Link>
        )}
      </div>

      {/* Category cards strip */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#00d4ff', letterSpacing: '0.15em' }}>{'// CATEGORIAS'}</span>
            {selectedCategory && (
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#ff4400', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕ limpar filtro
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'thin' }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat._id;
              return (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(isSelected ? '' : cat._id); setPage(1); }}
                  style={{
                    flexShrink: 0, width: 160,
                    padding: '12px 14px',
                    background: isSelected ? `${cat.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? cat.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 12px ${cat.color}22` : 'none',
                  }}
                  onMouseOver={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${cat.color}33`;
                      (e.currentTarget as HTMLButtonElement).style.background = `${cat.color}0d`;
                    }
                  }}
                  onMouseOut={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: 6, lineHeight: 1 }}>
                    {cat.icon || '📁'}
                  </div>
                  <p style={{
                    margin: '0 0 3px', fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: isSelected ? cat.color : '#c0d8e8',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p style={{
                      margin: 0, fontSize: '0.6rem', color: '#6a8898',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', lineHeight: 1.4,
                    }}>
                      {cat.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, color: '#2a6a3a',
        }} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="// buscar por título, descrição ou tags..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 36px',
            background: 'rgba(10,18,10,0.8)',
            border: '1px solid rgba(0,255,65,0.15)',
            borderRadius: 4,
            color: '#a0c8a0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,65,0.08)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar filters - desktop */}
        <div className="hidden lg:block" style={{ width: 220, flexShrink: 0 }}>
          <ContentFilter
            categories={categories}
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            selectedLevel={selectedLevel}
            sortBy={sortBy}
            onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
            onTypeChange={(v) => { setSelectedType(v); setPage(1); }}
            onLevelChange={(v) => { setSelectedLevel(v); setPage(1); }}
            onSortChange={(v) => { setSortBy(v); setPage(1); }}
            onReset={handleReset}
          />
        </div>

        {/* Mobile filters */}
        {showFilters && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
              onClick={() => setShowFilters(false)}
            />
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 280,
              background: '#0a120a', borderLeft: '1px solid rgba(0,255,65,0.15)',
              padding: 16, overflowY: 'auto',
            }}>
              <ContentFilter
                categories={categories}
                selectedCategory={selectedCategory}
                selectedType={selectedType}
                selectedLevel={selectedLevel}
                sortBy={sortBy}
                onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
                onTypeChange={(v) => { setSelectedType(v); setPage(1); }}
                onLevelChange={(v) => { setSelectedLevel(v); setPage(1); }}
                onSortChange={(v) => { setSortBy(v); setPage(1); }}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* Content grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <div style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
            }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  height: 200, borderRadius: 6,
                  background: 'rgba(10,18,10,0.6)',
                  border: '1px solid rgba(0,255,65,0.06)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              border: '1px solid rgba(0,255,65,0.1)',
              borderRadius: 6, background: 'rgba(10,18,10,0.6)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>📭</div>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#2a6a3a', marginBottom: 6 }}>
                {'> NENHUM ARQUIVO ENCONTRADO'}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#1a3020', marginBottom: 16 }}>Tente ajustar os filtros de busca</p>
              <button
                onClick={handleReset}
                style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
                  color: '#00ff41', background: 'rgba(0,255,65,0.06)',
                  border: '1px solid rgba(0,255,65,0.2)', borderRadius: 4,
                  padding: '6px 14px', cursor: 'pointer',
                }}
              >
                LIMPAR FILTROS
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
              }}>
                {contents.map((item) => (
                  <ContentCard
                    key={item._id}
                    content={item}
                    subscription={subscription}
                    onOpenModal={setModalContent}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
                      color: page === 1 ? '#1a3020' : '#00ff41',
                      background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)',
                      opacity: page === 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronLeft style={{ width: 12, height: 12 }} /> PREV
                  </button>

                  {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          width: 32, height: 32, borderRadius: 4,
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700,
                          cursor: 'pointer', border: '1px solid',
                          background: page === p ? 'rgba(0,255,65,0.15)' : 'rgba(10,18,10,0.8)',
                          color: page === p ? '#00ff41' : '#2a4a2a',
                          borderColor: page === p ? 'rgba(0,255,65,0.4)' : 'rgba(0,255,65,0.1)',
                          boxShadow: page === p ? '0 0 8px rgba(0,255,65,0.15)' : 'none',
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 4,
                      cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700,
                      color: page === pagination.pages ? '#1a3020' : '#00ff41',
                      background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)',
                      opacity: page === pagination.pages ? 0.4 : 1,
                    }}
                  >
                    NEXT <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content detail modal */}
      {modalContent && (
        <ContentModal
          content={modalContent}
          subscription={subscription}
          onClose={() => setModalContent(null)}
        />
      )}
    </div>
  );
}
