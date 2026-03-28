'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Hash, Users, Wifi, WifiOff, Mic, MicOff,
  Paperclip, Smile, X, Download, FileText, Image as ImageIcon,
  Volume2, ChevronDown,
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { LevelBadge } from '@/components/ui/Badge';
import { getInitials, formatRelativeDate, formatBytes } from '@/lib/utils';
import { communityApi } from '@/lib/api';
import type { Message, User } from '@/types';

// ── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_ROWS = [
  ['😀','😂','🤣','😊','😍','🥰','😎','🤔','😅','😭','😱','😡','🤯','🥳','😴','🫡'],
  ['👍','👎','❤️','🔥','💯','✅','❌','⭐','🎉','💪','🙏','👀','💀','🤙','✌️','👏'],
  ['⚡','💻','🛡️','⚔️','🎯','🚀','💣','🔒','🔓','🕵️','👾','🤖','🧠','💾','📡','🔐'],
  ['😈','💀','☠️','👻','🦾','🦿','🧬','⚗️','🔬','🔭','📱','💥','🌐','🕸️','🗡️','🏴‍☠️'],
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 50,
      background: '#050e1a', border: '1px solid rgba(0,150,255,0.25)',
      borderRadius: 8, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      width: 320,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#0096ff', letterSpacing: '0.15em' }}>EMOJIS</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3557', padding: 2 }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
      {EMOJI_ROWS.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
          {row.map(emoji => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', padding: '3px 4px', borderRadius: 4,
                transition: 'background 0.1s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,150,255,0.15)')}
              onMouseOut={e => (e.currentTarget.style.background = 'none')}
            >
              {emoji}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Avatar component ──────────────────────────────────────────────────────────
function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(0,150,255,0.1)',
      border: '1px solid rgba(0,150,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 700, color: '#0096ff',
      flexShrink: 0, overflow: 'hidden', position: 'relative',
    }}>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        {getInitials(name)}
      </span>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', zIndex: 2 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const author = msg.author as User;
  const accent = isOwn ? '#0096ff' : 'rgba(255,255,255,0.06)';
  const textColor = isOwn ? '#cce8ff' : '#b8cfe8';

  const renderMedia = () => {
    if (msg.type === 'image' && msg.mediaUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={msg.mediaUrl}
          alt={msg.mediaFileName || 'image'}
          style={{ maxWidth: 260, maxHeight: 200, borderRadius: 6, display: 'block', cursor: 'pointer', marginTop: msg.content ? 8 : 0 }}
          onClick={() => window.open(msg.mediaUrl!, '_blank')}
        />
      );
    }
    if (msg.type === 'audio' && msg.mediaUrl) {
      return (
        <div style={{ marginTop: msg.content ? 8 : 0, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Volume2 style={{ width: 12, height: 12, color: '#0096ff' }} />
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#2a5a80' }}>ÁUDIO</span>
            {msg.mediaSize ? <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#1a3050' }}>{formatBytes(msg.mediaSize)}</span> : null}
          </div>
          <audio controls src={msg.mediaUrl} style={{ width: '100%', height: 32, filter: 'invert(0.8) hue-rotate(180deg)' }} />
        </div>
      );
    }
    if (msg.type === 'file' && msg.mediaUrl) {
      const ext = (msg.mediaFileName || '').split('.').pop()?.toUpperCase() || 'FILE';
      return (
        <a
          href={msg.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: msg.content ? 8 : 0, padding: '8px 12px',
            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,150,255,0.15)',
            borderRadius: 6, textDecoration: 'none', maxWidth: 260,
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 4,
            background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,150,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileText style={{ width: 16, height: 16, color: '#0096ff' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '0.72rem', color: '#a0c8e8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {msg.mediaFileName || 'arquivo'}
            </p>
            <p style={{ fontSize: '0.6rem', color: '#2a5070', margin: '2px 0 0', fontFamily: 'JetBrains Mono,monospace' }}>
              {ext}{msg.mediaSize ? ` · ${formatBytes(msg.mediaSize)}` : ''}
            </p>
          </div>
          <Download style={{ width: 14, height: 14, color: '#0096ff', flexShrink: 0 }} />
        </a>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
      {!isOwn && <Avatar src={author?.avatar} name={author?.name || 'U'} size={30} />}
      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {!isOwn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8ab0d0' }}>{author?.name}</span>
            {author?.level && <LevelBadge level={author.level as 'iniciante' | 'intermediario' | 'avancado' | 'elite'} size="sm" />}
            {author?.role === 'admin' && (
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#ff4400', letterSpacing: '0.1em' }}>ADMIN</span>
            )}
          </div>
        )}
        <div style={{
          padding: (msg.content && !msg.mediaUrl) ? '8px 12px' : (msg.mediaUrl && !msg.content) ? '8px' : '8px 12px',
          background: isOwn ? 'rgba(0,96,200,0.2)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOwn ? 'rgba(0,150,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          boxShadow: isOwn ? '0 0 12px rgba(0,100,200,0.15)' : 'none',
        }}>
          {msg.content && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: textColor, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {msg.content}
            </p>
          )}
          {renderMedia()}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#1a3050', marginTop: 3 }}>
          {formatRelativeDate(msg.createdAt)}
        </span>
      </div>
      {isOwn && <Avatar src={undefined} name={''} size={0} />}
    </div>
  );
}

// ── Main chat component ───────────────────────────────────────────────────────
interface OnlineUser { _id: string; name: string; avatar: string | null; level: string; role: string; room: string; }

export default function ChatPage() {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<{ name: string } | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>();

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('get_history', { room: 'global', limit: 60 });

    socket.on('message_history', (history: Message[]) => setMessages(history));
    socket.on('new_message', (msg: Message) => setMessages(prev => [...prev, msg]));
    socket.on('system_message', (msg: { content: string; createdAt: string }) => {
      setMessages(prev => [...prev, {
        _id: Date.now().toString(), content: msg.content,
        author: null as unknown as string, room: 'global',
        type: 'system', createdAt: msg.createdAt,
      }]);
    });
    socket.on('user_typing', ({ name }: { name: string }) => {
      setIsTyping({ name });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(null), 3000);
    });
    socket.on('user_stopped_typing', () => setIsTyping(null));

    return () => {
      socket.off('message_history');
      socket.off('new_message');
      socket.off('system_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket]);

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  // ── Send text ─────────────────────────────────────────────────────────────
  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!socket || !inputValue.trim() || !isConnected) return;
    socket.emit('send_message', { content: inputValue.trim(), room: 'global', type: 'text' });
    socket.emit('typing_stop', { room: 'global' });
    setInputValue('');
    setShowEmoji(false);
  }, [socket, inputValue, isConnected]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (socket) {
      socket.emit('typing_start', { room: 'global' });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('typing_stop', { room: 'global' }), 1500);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // ── File / image upload ───────────────────────────────────────────────────
  const uploadAndSend = async (file: File, type: 'image' | 'file' | 'audio') => {
    if (!socket || !isConnected) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const res = await communityApi.uploadChatMedia(file, type);
      const { url, fileName, fileSize, mimeType } = res.data;
      socket.emit('send_message', {
        content: '',
        room: 'global',
        type,
        mediaUrl: url,
        mediaFileName: fileName,
        mediaSize: fileSize,
        mediaMime: mimeType,
      });
    } catch {
      setUploadError('Falha no upload. Tente um arquivo menor (máx 25 MB).');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndSend(file, 'image');
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAndSend(file, 'file');
    e.target.value = '';
  };

  // ── Audio recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
          await uploadAndSend(new File([blob], `audio.${ext}`, { type: mimeType }), 'audio');
        }
      };
      mr.start(200);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setUploadError('Permissão de microfone negada. Habilite o microfone nas configurações do browser.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      // Remove onstop handler to discard audio
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const globalOnlineUsers = (onlineUsers as OnlineUser[]).filter(u => u.room === 'global');
  const fmtRecTime = `${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', height: 'calc(100vh - 7rem)', display: 'flex', gap: 12 }}>

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#040b14', border: '1px solid rgba(0,100,200,0.15)',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 0 30px rgba(0,50,120,0.1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid rgba(0,100,200,0.12)',
          background: 'rgba(0,30,70,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,150,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hash style={{ width: 14, height: 14, color: '#0096ff' }} />
            </div>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: '#80b8e8', fontSize: '0.85rem' }}>
                GLOBAL
              </span>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#1a3557', letterSpacing: '0.1em' }}>
                ELITE TROJAN // CHAT EM TEMPO REAL
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isConnected ? '#0096ff' : '#3a3a3a',
              boxShadow: isConnected ? '0 0 8px #0096ff' : 'none',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: isConnected ? '#0060aa' : '#3a3a3a' }}>
              {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#1a3557', marginLeft: 6 }}>
              {globalOnlineUsers.length} online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}
          onScroll={() => {
            const el = messagesContainerRef.current;
            if (!el) return;
            setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Hash style={{ width: 36, height: 36, color: '#0d1f38', margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.72rem', color: '#0d1f38' }}>
                {'// nenhuma mensagem ainda. inicie a conversa!'}
              </p>
            </div>
          )}

          {messages.map(msg => {
            if (msg.type === 'system') {
              return (
                <div key={msg._id} style={{ textAlign: 'center', padding: '2px 0' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#1a3050',
                    background: 'rgba(0,50,100,0.2)', padding: '2px 10px', borderRadius: 10,
                  }}>
                    {'─── '}{msg.content}{' ───'}
                  </span>
                </div>
              );
            }
            const author = msg.author as User;
            const isOwn = author?._id === user?._id;
            return <MessageBubble key={msg._id} msg={msg} isOwn={isOwn} />;
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{ width: 5, height: 5, borderRadius: '50%', background: '#0d4080', display: 'block', animation: 'bounce 1.2s infinite', animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#0d3060' }}>
                {isTyping.name} está digitando...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            style={{
              position: 'absolute', bottom: 90, right: 280,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,100,200,0.8)', border: '1px solid rgba(0,150,255,0.4)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <ChevronDown style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Upload error */}
        {uploadError && (
          <div style={{
            margin: '0 16px', padding: '8px 12px',
            background: 'rgba(255,0,50,0.08)', border: '1px solid rgba(255,0,50,0.2)',
            borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.62rem', color: '#cc2244', flex: 1, whiteSpace: 'pre-wrap' }}>
              {uploadError}
            </span>
            <button onClick={() => setUploadError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#882233', padding: 0, flexShrink: 0 }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(0,100,200,0.1)', background: 'rgba(0,20,50,0.3)' }}>
          {/* Recording state */}
          {isRecording ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff0040', animation: 'pulse 1s infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.7rem', color: '#cc2244', flex: 1 }}>
                Gravando... {fmtRecTime}
              </span>
              <button
                onClick={cancelRecording}
                style={{ background: 'rgba(255,0,40,0.1)', border: '1px solid rgba(255,0,40,0.3)', color: '#ff4466', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.62rem' }}
              >
                CANCELAR
              </button>
              <button
                onClick={stopRecording}
                style={{ background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,150,255,0.35)', color: '#0096ff', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.62rem' }}
              >
                ENVIAR
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {/* Toolbar buttons */}
              <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-end', paddingBottom: 1, position: 'relative' }}>
                {/* Emoji */}
                <div style={{ position: 'relative' }}>
                  {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                  <button
                    type="button"
                    onClick={() => setShowEmoji(v => !v)}
                    title="Emojis"
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: showEmoji ? 'rgba(0,150,255,0.15)' : 'rgba(0,50,100,0.3)',
                      border: `1px solid ${showEmoji ? 'rgba(0,150,255,0.35)' : 'rgba(0,80,150,0.2)'}`,
                      color: '#0096ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Smile style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {/* Image */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading || !isConnected}
                  title="Enviar imagem"
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'rgba(0,50,100,0.3)', border: '1px solid rgba(0,80,150,0.2)',
                    color: '#0096ff', cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isUploading ? 0.5 : 1,
                  }}
                >
                  <ImageIcon style={{ width: 15, height: 15 }} />
                </button>

                {/* File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !isConnected}
                  title="Enviar arquivo"
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'rgba(0,50,100,0.3)', border: '1px solid rgba(0,80,150,0.2)',
                    color: '#0096ff', cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isUploading ? 0.5 : 1,
                  }}
                >
                  <Paperclip style={{ width: 15, height: 15 }} />
                </button>

                {/* Mic */}
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onTouchStart={startRecording}
                  disabled={isUploading || !isConnected}
                  title="Segurar para gravar áudio"
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: 'rgba(0,50,100,0.3)', border: '1px solid rgba(0,80,150,0.2)',
                    color: '#0096ff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isUploading ? 0.5 : 1,
                  }}
                >
                  <Mic style={{ width: 15, height: 15 }} />
                </button>
              </div>

              {/* Text input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isConnected ? '// mensagem...' : 'Conectando...'}
                  disabled={!isConnected || isUploading}
                  maxLength={1000}
                  rows={1}
                  style={{
                    width: '100%', resize: 'none', overflowY: 'hidden',
                    background: 'rgba(0,20,50,0.5)',
                    border: '1px solid rgba(0,100,200,0.2)',
                    borderRadius: 8, padding: '8px 12px',
                    color: '#b0d0f0', fontSize: '0.82rem',
                    fontFamily: 'inherit',
                    outline: 'none', lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,150,255,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,100,200,0.2)'; }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 100) + 'px';
                  }}
                />
              </div>

              {/* Send */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!isConnected || !inputValue.trim() || isUploading}
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: (isConnected && inputValue.trim()) ? 'rgba(0,100,200,0.3)' : 'rgba(0,30,60,0.3)',
                  border: `1px solid ${(isConnected && inputValue.trim()) ? 'rgba(0,150,255,0.4)' : 'rgba(0,50,100,0.2)'}`,
                  color: (isConnected && inputValue.trim()) ? '#0096ff' : '#0d2040',
                  cursor: (isConnected && inputValue.trim()) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {isUploading
                  ? <div style={{ width: 14, height: 14, border: '2px solid #0096ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <Send style={{ width: 15, height: 15 }} />
                }
              </button>
            </div>
          )}

          {/* Character count */}
          {!isRecording && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.55rem', color: '#0d2040' }}>
                {inputValue.length}/1000 · Enter para enviar · Shift+Enter nova linha
              </span>
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
      </div>

      {/* ── Online users panel ─────────────────────────────────────────────── */}
      <div style={{
        width: 200, display: 'flex', flexDirection: 'column',
        background: '#040b14', border: '1px solid rgba(0,100,200,0.15)',
        borderRadius: 10, overflow: 'hidden',
      }}
        className="hidden lg:flex"
      >
        <div style={{
          padding: '12px 14px', borderBottom: '1px solid rgba(0,100,200,0.1)',
          background: 'rgba(0,30,70,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Users style={{ width: 13, height: 13, color: '#0096ff' }} />
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.65rem', fontWeight: 700, color: '#4a80b0' }}>
            ONLINE
          </span>
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(0,100,200,0.15)', border: '1px solid rgba(0,150,255,0.2)',
            borderRadius: 8, padding: '1px 7px',
            fontFamily: 'JetBrains Mono,monospace', fontSize: '0.62rem', color: '#0096ff',
          }}>
            {globalOnlineUsers.length}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {globalOnlineUsers.map(u => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', borderRadius: 6, marginBottom: 2 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar src={u.avatar} name={u.name} size={28} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#0096ff', border: '1.5px solid #040b14',
                  boxShadow: '0 0 5px #0096ff',
                }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8ab0d0', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.name}
                </p>
                <LevelBadge level={u.level as 'iniciante' | 'intermediario' | 'avancado' | 'elite'} size="sm" />
              </div>
            </div>
          ))}
          {globalOnlineUsers.length === 0 && (
            <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.6rem', color: '#0d2040', textAlign: 'center', padding: '20px 0' }}>
              // nenhum usuário online
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
