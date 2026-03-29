'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle, MessageSquare, Image, FileText, Mic, BarChart2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

interface ChatMessage {
  _id: string;
  content: string;
  author: { _id: string; name: string; email: string; avatar?: string; role: string; level: string };
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  mediaUrl?: string;
  mediaFileName?: string;
  mediaSize?: number;
  isDeleted?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: string;
}

function typeIcon(type: string) {
  if (type === 'image') return <Image style={{ width: 12, height: 12, color: '#00d4ff' }} />;
  if (type === 'file') return <FileText style={{ width: 12, height: 12, color: '#ffcc00' }} />;
  if (type === 'audio') return <Mic style={{ width: 12, height: 12, color: '#a060ff' }} />;
  return <MessageSquare style={{ width: 12, height: 12, color: '#0096ff' }} />;
}

export default function AdminChatPage() {
  const qc = useQueryClient();
  const [room] = useState('global');
  const [page, setPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const LIMIT = 50;

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['admin-chat-stats', room],
    queryFn: () => api.get('/admin/chat/stats', { params: { room } }).then(r => r.data),
  });

  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-chat-messages', room, page],
    queryFn: () => api.get('/admin/chat/messages', { params: { room, page, limit: LIMIT } }).then(r => r.data),
  });

  const deleteMsg = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/chat/messages/${id}`, { params: { room } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-chat-messages'] }); qc.invalidateQueries({ queryKey: ['admin-chat-stats'] }); },
  });

  const clearChat = useMutation({
    mutationFn: () => api.delete('/admin/chat/clear', { data: { room } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-chat-messages'] }); qc.invalidateQueries({ queryKey: ['admin-chat-stats'] }); setShowClearConfirm(false); },
  });

  const messages: ChatMessage[] = messagesData?.messages || [];
  const totalPages = Math.ceil((messagesData?.total || 0) / LIMIT);

  const stats = statsData || { total: 0, todayCount: 0, deletedCount: 0, mediaCount: 0 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', margin: '0 0 4px' }}>{'// CHAT — #' + room.toUpperCase()}</h1>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#0d2a3a' }}>Controle total sobre mensagens do chat</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { refetch(); refetchStats(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(0,150,255,0.06)', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#1a4a6a' }}>
            <RefreshCw style={{ width: 12, height: 12 }} />ATUALIZAR
          </button>
          <button onClick={() => setShowClearConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#ff4455', fontWeight: 700 }}>
            <AlertTriangle style={{ width: 12, height: 12 }} />LIMPAR CHAT
          </button>
        </div>
      </div>

      {/* Clear confirm */}
      {showClearConfirm && (
        <div style={{ marginBottom: 16, padding: '14px 18px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 6 }}>
          <p style={{ ...mono, fontSize: '0.72rem', color: '#ff4455', margin: '0 0 10px' }}>⚠️ Isso irá deletar TODAS as {stats.total} mensagens do canal #{room}. Esta ação é irreversível!</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => clearChat.mutate()} disabled={clearChat.isPending} style={{ padding: '6px 14px', background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#ff4455', fontWeight: 700 }}>
              {clearChat.isPending ? 'LIMPANDO...' : 'CONFIRMAR LIMPEZA'}
            </button>
            <button onClick={() => setShowClearConfirm(false)} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#1a4a6a' }}>CANCELAR</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'TOTAL MSGS', value: stats.total, icon: <BarChart2 style={{ width: 14, height: 14 }} />, color: '#00d4ff' },
          { label: 'HOJE', value: stats.todayCount, icon: <MessageSquare style={{ width: 14, height: 14 }} />, color: '#00d4ff' },
          { label: 'MÍDIAS', value: stats.mediaCount, icon: <Image style={{ width: 14, height: 14 }} />, color: '#ffcc00' },
          { label: 'DELETADAS', value: stats.deletedCount, icon: <Trash2 style={{ width: 14, height: 14 }} />, color: '#ff4455' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', background: '#040d18', border: `1px solid ${s.color}22`, borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span style={{ ...mono, fontSize: '0.55rem', color: '#0d2a3a', letterSpacing: '0.15em' }}>{s.label}</span>
            </div>
            <p style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Messages table */}
      <div style={{ background: '#040d18', border: '1px solid rgba(0,150,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,150,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...mono, fontSize: '0.62rem', color: '#00d4ff' }}>MENSAGENS — página {page}</span>
          <span style={{ ...mono, fontSize: '0.58rem', color: '#0d2a3a' }}>{messagesData?.total || 0} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,150,255,0.1)' }}>
                {['TIPO', 'AUTOR', 'MENSAGEM', 'REAÇÕES', 'DATA', 'AÇÃO'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', ...mono, fontSize: '0.55rem', color: '#1a4a6a', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#0a1e2e' }}>Carregando...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', ...mono, fontSize: '0.65rem', color: '#0a1e2e' }}>Nenhuma mensagem</td></tr>
              ) : messages.map(m => (
                <tr key={m._id} style={{ borderBottom: '1px solid rgba(0,150,255,0.05)', background: m.isDeleted ? 'rgba(255,0,0,0.03)' : 'transparent', opacity: m.isDeleted ? 0.5 : 1 }}>
                  <td style={{ padding: '9px 12px' }}>{typeIcon(m.type)}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <p style={{ ...mono, fontSize: '0.65rem', color: m.author?.role === 'admin' ? '#40c8ff' : '#6090b0', margin: 0, whiteSpace: 'nowrap' }}>{m.author?.name}</p>
                    <p style={{ ...mono, fontSize: '0.55rem', color: '#0d2a3a', margin: 0 }}>{m.author?.email}</p>
                  </td>
                  <td style={{ padding: '9px 12px', maxWidth: 300 }}>
                    {m.isDeleted ? (
                      <span style={{ ...mono, fontSize: '0.6rem', color: '#0d2a3a', fontStyle: 'italic' }}>— mensagem deletada —</span>
                    ) : m.content ? (
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#70b0d0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</p>
                    ) : m.mediaFileName ? (
                      <p style={{ ...mono, fontSize: '0.62rem', color: '#5a8880', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {m.mediaFileName}</p>
                    ) : <span style={{ color: '#0a1e2e', ...mono, fontSize: '0.6rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    {m.reactions && m.reactions.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {m.reactions.map(r => (
                          <span key={r.emoji} style={{ ...mono, fontSize: '0.6rem', background: 'rgba(0,150,255,0.08)', padding: '1px 5px', borderRadius: 10, color: '#70b0d0' }}>
                            {r.emoji} {r.users.length}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ color: '#2a1800', ...mono, fontSize: '0.6rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 12px', ...mono, fontSize: '0.6rem', color: '#0d2a3a', whiteSpace: 'nowrap' }}>
                    {new Date(m.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    {!m.isDeleted && (
                      <button onClick={() => deleteMsg.mutate(m._id)} style={{ padding: '4px 6px', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 3, cursor: 'pointer', color: '#ff4455' }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)} style={{ padding: '5px 10px', background: page === p ? 'rgba(0,150,255,0.15)' : 'rgba(0,150,255,0.05)', border: `1px solid ${page === p ? 'rgba(0,150,255,0.35)' : 'rgba(0,150,255,0.1)'}`, borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: page === p ? '#00d4ff' : '#1a4a6a' }}>
                {p}
              </button>
            );
          })}
          {totalPages > 7 && <span style={{ ...mono, fontSize: '0.62rem', color: '#0d2a3a' }}>... {totalPages}</span>}
        </div>
      )}
    </div>
  );
}
