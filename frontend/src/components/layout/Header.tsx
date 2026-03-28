'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Menu, Terminal, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { searchApi } from '@/lib/api';
import { getInitials, truncateText } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import type { Content } from '@/types';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    clearTimeout(searchTimer.current);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchApi.search({ q: query, limit: 5 });
        setSearchResults(response.data.results?.content?.items || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/content?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header style={{
      height: 52,
      background: 'rgba(8,18,8,0.95)',
      borderBottom: '1px solid rgba(0,255,65,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Mobile menu */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{
          padding: 6,
          color: '#2a4d30',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
          borderRadius: 4,
        }}
        onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
        onMouseOut={e => (e.currentTarget.style.color = '#2a4d30')}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative' }}>
            <Search className="w-3.5 h-3.5"
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: '#2a4d30', pointerEvents: 'none',
              }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="// buscar conteúdo..."
              style={{
                width: '100%',
                background: 'rgba(5,10,5,0.6)',
                border: '1px solid rgba(0,255,65,0.15)',
                borderRadius: 4,
                padding: '7px 80px 7px 34px',
                fontSize: '0.78rem',
                color: '#a0c8a8',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#00ff41';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,255,65,0.07)';
                if (searchQuery.length >= 2) setShowResults(true);
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Ctrl+K hint */}
            <div style={{
              position: 'absolute', right: searchQuery ? 30 : 10, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 2,
              opacity: 0.4, pointerEvents: 'none',
            }}>
              <Command style={{ width: 10, height: 10, color: '#2a4d30' }} />
              <span style={{ fontSize: '0.58rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>K</span>
            </div>
            {searchQuery && (
              <button type="button" onClick={clearSearch}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#2a4d30', background: 'none', border: 'none',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                onMouseOut={e => (e.currentTarget.style.color = '#2a4d30')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </form>

        {/* Dropdown */}
        {showResults && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0, right: 0,
            background: '#0a120a',
            border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: 6,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            zIndex: 50,
          }}>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#2a4d30', fontSize: '0.75rem' }}>
                <div style={{
                  width: 14, height: 14,
                  border: '1.5px solid #00ff41',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 8px',
                }} />
                Buscando...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((item) => (
                  <button key={item._id}
                    onClick={() => { router.push(`/content?id=${item._id}`); setShowResults(false); clearSearch(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', textAlign: 'left',
                      borderBottom: '1px solid rgba(0,255,65,0.06)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,255,65,0.04)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{
                      width: 30, height: 30,
                      background: 'rgba(0,255,65,0.06)',
                      border: '1px solid rgba(0,255,65,0.15)',
                      borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', flexShrink: 0,
                    }}>
                      {item.type === 'programa' ? '💻' : item.type === 'video' ? '🎥' : item.type === 'database' ? '🗄️' : '📄'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', color: '#a0c8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: '#2a4d30' }}>{truncateText(item.description, 55)}</p>
                    </div>
                  </button>
                ))}
                <button onClick={handleSearchSubmit}
                  style={{
                    width: '100%', padding: '8px 14px',
                    fontSize: '0.7rem', color: '#00a828',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'center', transition: 'color 0.15s',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                  onMouseOut={e => (e.currentTarget.style.color = '#00a828')}
                >
                  Ver todos resultados para &ldquo;{searchQuery}&rdquo; →
                </button>
              </div>
            ) : (
              <div style={{ padding: 14, textAlign: 'center', color: '#2a4d30', fontSize: '0.72rem' }}>
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {/* Terminal indicator */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'rgba(0,255,65,0.04)',
          border: '1px solid rgba(0,255,65,0.1)',
          borderRadius: 4,
        }} className="sm:flex">
          <Terminal className="w-3 h-3" style={{ color: '#2a4d30' }} />
          <span style={{ fontSize: '0.6rem', color: '#1a3020', letterSpacing: '0.1em' }}>ONLINE</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 5px #00ff41' }} />
        </div>

        {/* NotificationBell */}
        <NotificationBell />

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: 10,
          borderLeft: '1px solid rgba(0,255,65,0.1)',
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'rgba(0,255,65,0.08)',
            border: '1px solid rgba(0,255,65,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.62rem', fontWeight: 700,
            color: '#00ff41',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}>
            <span style={{ position: 'absolute' }}>{getInitials(user?.name || 'U')}</span>
            {user?.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
          <div className="hidden sm:block">
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a0c8a8', lineHeight: 1.2 }}>{user?.name}</p>
            <p style={{ fontSize: '0.58rem', color: '#2a4d30', letterSpacing: '0.08em', textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
