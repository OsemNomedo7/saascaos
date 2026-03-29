'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pin, RotateCcw, MessageSquare, Eye, ThumbsUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

interface Post {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  author: { _id: string; name: string; email: string; level: string };
  isActive: boolean;
  isPinned: boolean;
  views: number;
  likes: string[];
  commentCount: number;
  mediaType?: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; email: string };
  post: { _id: string; title: string };
  isActive: boolean;
  likes: string[];
  createdAt: string;
}

export default function AdminCommunityPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'posts' | 'comments'>('posts');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['admin-community-posts', page, search, status],
    queryFn: () => api.get('/admin/community/posts', { params: { page, limit: LIMIT, search: search || undefined, status: status || undefined } }).then(r => r.data),
    enabled: tab === 'posts',
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-community-comments', page],
    queryFn: () => api.get('/admin/community/comments', { params: { page, limit: LIMIT } }).then(r => r.data),
    enabled: tab === 'comments',
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/community/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  });

  const pinPost = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/community/posts/${id}/pin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  });

  const restorePost = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/community/posts/${id}/restore`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-posts'] }),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/community/comments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-community-comments'] }),
  });

  const posts: Post[] = postsData?.posts || [];
  const comments: Comment[] = commentsData?.comments || [];
  const totalPages = tab === 'posts' ? (postsData?.pages || 1) : (commentsData?.pages || 1);
  const total = tab === 'posts' ? (postsData?.total || 0) : (commentsData?.total || 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', margin: '0 0 4px' }}>{'// COMUNIDADE'}</h1>
        <p style={{ ...mono, fontSize: '0.65rem', color: '#7a9aaa' }}>Controle total sobre posts e comentários</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[{ k: 'posts', l: 'POSTS' }, { k: 'comments', l: 'COMENTÁRIOS' }].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k as 'posts' | 'comments'); setPage(1); }} style={{
            padding: '7px 16px', borderRadius: 4, cursor: 'pointer',
            ...mono, fontSize: '0.65rem', fontWeight: 700,
            background: tab === t.k ? 'rgba(0,150,255,0.12)' : 'transparent',
            border: `1px solid ${tab === t.k ? 'rgba(0,150,255,0.35)' : 'rgba(0,150,255,0.1)'}`,
            color: tab === t.k ? '#00d4ff' : '#a8c4d4',
          }}>{t.l}</button>
        ))}
        <span style={{ ...mono, fontSize: '0.62rem', color: '#7a9aaa', marginLeft: 8, alignSelf: 'center' }}>
          {total} registro(s)
        </span>
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 200 }}>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar posts..."
                style={{ flex: 1, padding: '6px 10px', ...mono, fontSize: '0.65rem', background: '#040d18', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, color: '#70b0d0', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '6px 10px', background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,150,255,0.25)', borderRadius: 4, cursor: 'pointer', color: '#00d4ff' }}>
                <Search style={{ width: 13, height: 13 }} />
              </button>
            </form>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ padding: '6px 10px', ...mono, fontSize: '0.65rem', background: '#040d18', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, color: '#70b0d0', outline: 'none' }}>
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="deleted">Removidos</option>
            </select>
          </div>

          {/* Posts table */}
          <div style={{ background: '#040d18', border: '1px solid rgba(0,150,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,150,255,0.12)' }}>
                    {['TÍTULO / AUTOR', 'STATUS', 'STATS', 'DATA', 'AÇÕES'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#a8c4d4', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {postsLoading ? (
                    <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#6a8a9a' }}>Carregando...</td></tr>
                  ) : posts.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#6a8a9a' }}>Nenhum post encontrado</td></tr>
                  ) : posts.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(0,150,255,0.06)', background: !p.isActive ? 'rgba(255,0,0,0.03)' : p.isPinned ? 'rgba(0,150,255,0.03)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', maxWidth: 280 }}>
                        <p style={{ ...mono, fontSize: '0.7rem', color: p.isActive ? '#b8d0e0' : '#7a9aaa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.isPinned && <span style={{ color: '#0096ff', marginRight: 4 }}>📌</span>}
                          {p.title}
                        </p>
                        <p style={{ ...mono, fontSize: '0.58rem', color: '#7a9aaa', margin: '2px 0 0' }}>{p.author?.name} · {p.author?.email}</p>
                        {p.mediaType && <span style={{ ...mono, fontSize: '0.5rem', color: '#6a8a9a', background: 'rgba(0,150,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>{p.mediaType}</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ ...mono, fontSize: '0.58rem', padding: '2px 7px', borderRadius: 3, background: p.isActive ? 'rgba(0,255,65,0.08)' : 'rgba(255,0,0,0.1)', color: p.isActive ? '#00cc44' : '#ff4455', border: `1px solid ${p.isActive ? 'rgba(0,255,65,0.2)' : 'rgba(255,0,0,0.2)'}` }}>
                          {p.isActive ? 'ATIVO' : 'REMOVIDO'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, ...mono, fontSize: '0.62rem', color: '#7a9aaa' }}><Eye style={{ width: 10, height: 10 }} />{p.views}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, ...mono, fontSize: '0.62rem', color: '#7a9aaa' }}><ThumbsUp style={{ width: 10, height: 10 }} />{p.likes?.length || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, ...mono, fontSize: '0.62rem', color: '#7a9aaa' }}><MessageSquare style={{ width: 10, height: 10 }} />{p.commentCount}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', ...mono, fontSize: '0.62rem', color: '#7a9aaa', whiteSpace: 'nowrap' }}>
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => pinPost.mutate(p._id)} title={p.isPinned ? 'Desafixar' : 'Fixar'} style={{ padding: '4px 6px', background: p.isPinned ? 'rgba(0,120,255,0.12)' : 'rgba(0,150,255,0.06)', border: `1px solid ${p.isPinned ? 'rgba(0,120,255,0.25)' : 'rgba(0,150,255,0.15)'}`, borderRadius: 3, cursor: 'pointer', color: p.isPinned ? '#0096ff' : '#a8c4d4' }}>
                            <Pin style={{ width: 12, height: 12 }} />
                          </button>
                          {!p.isActive ? (
                            <button onClick={() => restorePost.mutate(p._id)} title="Restaurar" style={{ padding: '4px 6px', background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)', borderRadius: 3, cursor: 'pointer', color: '#00cc66' }}>
                              <RotateCcw style={{ width: 12, height: 12 }} />
                            </button>
                          ) : (
                            <button onClick={() => { if (confirm('Deletar post e todos os comentários?')) deletePost.mutate(p._id); }} title="Deletar" style={{ padding: '4px 6px', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 3, cursor: 'pointer', color: '#ff4455' }}>
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Comments tab */}
      {tab === 'comments' && (
        <div style={{ background: '#040d18', border: '1px solid rgba(0,150,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,150,255,0.12)' }}>
                  {['CONTEÚDO', 'AUTOR', 'POST', 'DATA', 'AÇÃO'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#a8c4d4', letterSpacing: '0.12em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commentsLoading ? (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#6a8a9a' }}>Carregando...</td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#6a8a9a' }}>Nenhum comentário</td></tr>
                ) : comments.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid rgba(0,150,255,0.06)' }}>
                    <td style={{ padding: '10px 12px', maxWidth: 280 }}>
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#b8d0e0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <p style={{ ...mono, fontSize: '0.65rem', color: '#b8d0e0', margin: 0 }}>{c.author?.name}</p>
                      <p style={{ ...mono, fontSize: '0.55rem', color: '#7a9aaa', margin: 0 }}>{c.author?.email}</p>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                      <p style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.post?.title}</p>
                    </td>
                    <td style={{ padding: '10px 12px', ...mono, fontSize: '0.62rem', color: '#7a9aaa', whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => { if (confirm('Deletar comentário?')) deleteComment.mutate(c._id); }} style={{ padding: '4px 6px', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 3, cursor: 'pointer', color: '#ff4455' }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 10px', background: 'rgba(0,150,255,0.06)', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', color: page === 1 ? '#6a8a9a' : '#00d4ff' }}>
            <ChevronLeft style={{ width: 13, height: 13 }} />
          </button>
          <span style={{ ...mono, fontSize: '0.65rem', color: '#a8c4d4' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 10px', background: 'rgba(0,150,255,0.06)', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', color: page === totalPages ? '#6a8a9a' : '#00d4ff' }}>
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}
    </div>
  );
}
