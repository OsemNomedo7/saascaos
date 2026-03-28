'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, Library } from 'lucide-react';
import { favoritesApi } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';
import ContentModal from '@/components/content/ContentModal';
import { subscriptionsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Content, Subscription, Favorite } from '@/types';

export default function FavoritesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalContent, setModalContent] = useState<Content | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.list().then((r) => r.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const favorites: Favorite[] = data?.favorites || [];
  const subscription = subData?.subscription as Subscription | null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Heart style={{ width: 16, height: 16, color: '#ff4400' }} />
        <h1 style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.1rem', fontWeight: 700,
          color: '#00ff41', letterSpacing: '0.12em', margin: 0,
          textShadow: '0 0 12px rgba(0,255,65,0.4)',
        }}>{'// FAVORITOS'}</h1>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#2a4a2a' }}>
          {favorites.length > 0 ? `> ${favorites.length} itens salvos` : ''}
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 200, borderRadius: 6,
              background: 'rgba(10,18,10,0.6)', border: '1px solid rgba(0,255,65,0.06)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px solid rgba(0,255,65,0.1)',
          borderRadius: 6, background: 'rgba(10,18,10,0.6)',
        }}>
          <Heart style={{ width: 36, height: 36, color: '#1a3020', margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#2a6a3a', marginBottom: 6 }}>
            {'> NENHUM FAVORITO SALVO'}
          </p>
          <p style={{ fontSize: '0.7rem', color: '#1a3020' }}>
            Salve conteúdos para acessar rapidamente
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {favorites.map((fav) => (
            <ContentCard
              key={fav._id}
              content={fav.content}
              subscription={subscription}
              onOpenModal={setModalContent}
            />
          ))}
        </div>
      )}

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
