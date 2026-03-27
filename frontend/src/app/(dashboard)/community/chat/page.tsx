'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Hash, Users, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { LevelBadge } from '@/components/ui/Badge';
import { getInitials, formatRelativeDate } from '@/lib/utils';
import type { Message, User } from '@/types';

interface OnlineUser {
  _id: string;
  name: string;
  avatar: string | null;
  level: string;
  role: string;
  room: string;
}

export default function ChatPage() {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<{ name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket) return;

    // Get message history
    socket.emit('get_history', { room: 'global', limit: 50 });

    socket.on('message_history', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('system_message', (msg: { content: string; createdAt: string }) => {
      setMessages((prev) => [
        ...prev,
        { _id: Date.now().toString(), content: msg.content, author: null as unknown as string, room: 'global', type: 'system', createdAt: msg.createdAt },
      ]);
    });

    socket.on('user_typing', ({ name }: { name: string }) => {
      setIsTyping({ name });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(null), 3000);
    });

    socket.on('user_stopped_typing', () => {
      setIsTyping(null);
    });

    return () => {
      socket.off('message_history');
      socket.off('new_message');
      socket.off('system_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputValue.trim() || !isConnected) return;

    socket.emit('send_message', { content: inputValue.trim(), room: 'global' });
    socket.emit('typing_stop', { room: 'global' });
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (socket) {
      socket.emit('typing_start', { room: 'global' });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('typing_stop', { room: 'global' });
      }, 1500);
    }
  };

  const globalOnlineUsers = onlineUsers.filter((u) => u.room === 'global');

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-4">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-900/80 border border-gray-800/60 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-green-400" />
            <span className="font-semibold text-gray-200">global</span>
            <span className="text-xs text-gray-500">Real-time community chat</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <Wifi className="w-3.5 h-3.5" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <WifiOff className="w-3.5 h-3.5" />
                Disconnected
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Hash className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div key={msg._id} className="text-center">
                  <span className="text-xs text-gray-600 bg-gray-800/50 px-2 py-1 rounded">{msg.content}</span>
                </div>
              );
            }

            const author = msg.author as User;
            const isOwn = author?._id === user?._id;

            return (
              <div key={msg._id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0 mt-0.5">
                  {author?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.avatar} alt={author.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(author?.name || 'U')
                  )}
                </div>
                <div className={`max-w-xs md:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-gray-300">{author?.name}</span>
                    {author?.level && <LevelBadge level={author.level as 'iniciante' | 'intermediario' | 'avancado' | 'elite'} size="sm" />}
                    {author?.role === 'admin' && (
                      <span className="text-xs text-red-400 font-mono">ADMIN</span>
                    )}
                    <span className="text-xs text-gray-600">{formatRelativeDate(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 text-sm ${
                      isOwn
                        ? 'bg-green-500/15 text-gray-200 border border-green-500/20 rounded-tr-sm'
                        : 'bg-gray-800/80 text-gray-300 border border-gray-700/40 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{isTyping.name} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-800/60">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              maxLength={1000}
              className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || !inputValue.trim()}
              className="p-2.5 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-gray-950 disabled:text-gray-500 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-xs text-gray-600">{inputValue.length}/1000</span>
            {!isConnected && (
              <span className="text-xs text-red-400">Reconnecting...</span>
            )}
          </div>
        </div>
      </div>

      {/* Online users sidebar */}
      <div className="w-52 hidden lg:flex flex-col bg-gray-900/80 border border-gray-800/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-gray-200">Online</span>
            <span className="ml-auto text-xs font-mono text-green-400">{globalOnlineUsers.length}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {globalOnlineUsers.map((u) => (
            <div key={u._id} className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                  {getInitials(u.name)}
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-gray-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{u.name}</p>
                <LevelBadge level={u.level as 'iniciante' | 'intermediario' | 'avancado' | 'elite'} size="sm" />
              </div>
            </div>
          ))}
          {globalOnlineUsers.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4">No users online</p>
          )}
        </div>
      </div>
    </div>
  );
}
