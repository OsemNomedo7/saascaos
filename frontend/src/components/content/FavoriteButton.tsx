'use client';

import { CSSProperties, useState } from 'react';
import { Heart } from 'lucide-react';
import { favoritesApi } from '@/lib/api';

interface FavoriteButtonProps {
  contentId: string;
  initialFavorited?: boolean;
}

export function FavoriteButton({ contentId, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (loading) return;

    const prev = favorited;
    setFavorited(!prev);
    setLoading(true);

    try {
      if (prev) {
        await favoritesApi.remove(contentId);
      } else {
        await favoritesApi.add(contentId);
      }
    } catch {
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  }

  const buttonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: `1px solid ${favorited ? '#ff440055' : '#00ff4133'}`,
    background: favorited ? 'rgba(255,68,0,0.08)' : 'rgba(0,255,65,0.04)',
    cursor: loading ? 'wait' : 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: hovered
      ? favorited
        ? '0 0 10px #ff440066, 0 0 20px #ff440022'
        : '0 0 10px #00ff4166, 0 0 20px #00ff4122'
      : 'none',
    transform: hovered ? 'scale(1.1)' : 'scale(1)',
    outline: 'none',
    padding: 0,
    position: 'relative',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const spinnerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    background: 'rgba(5,10,5,0.7)',
  };

  const spinnerRingStyle: CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #00ff4133',
    borderTopColor: '#00ff41',
    animation: 'favSpinnerRotate 0.6s linear infinite',
  };

  return (
    <>
      <style>{`
        @keyframes favSpinnerRotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        style={buttonStyle}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        type="button"
      >
        <Heart
          size={16}
          fill={favorited ? '#ff4400' : 'none'}
          color={favorited ? '#ff4400' : hovered ? '#00ff41' : '#00ff4199'}
          strokeWidth={2}
          style={{ transition: 'all 0.2s ease', flexShrink: 0 }}
        />
        {loading && (
          <span style={spinnerStyle}>
            <span style={spinnerRingStyle} />
          </span>
        )}
      </button>
    </>
  );
}

export default FavoriteButton;
