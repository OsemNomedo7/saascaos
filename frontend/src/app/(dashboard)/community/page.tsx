'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  MessageSquare, Pin, Trash2, Plus,
  Eye, ThumbsUp, Send, Hash, Image, Video,
  X, Upload, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { communityApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LevelBadge } from '@/components/ui/Badge';
import { formatRelativeDate, getInitials, truncateText } from '@/lib/utils';
import type { Post, Comment, User } from '@/types';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

interface CreatePostForm {
  title: string;
  subtitle: string;
  content: string;
}

interface CommentForm {
  content: string;
}

function PostCard({ post, onLike, onDelete, onPin, currentUser }: {
  post: Post;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  currentUser: User | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const { data: commentsData } = useQuery({
    queryKey: ['comments', post._id],
    queryFn: () => communityApi.getComments(post._id).then((r) => r.data),
    enabled: showComments,
  });

  const addComment = useMutation({
    mutationFn: (content: string) => communityApi.addComment(post._id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post._id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const { register, handleSubmit, reset } = useForm<CommentForm>();
  const author = post.author as User;
  const likes = post.likes || [];
  const isLiked = currentUser ? likes.includes(currentUser._id) : false;
  const CONTENT_LIMIT = 280;

  const onCommentSubmit = async (data: CommentForm) => {
    await addComment.mutateAsync(data.content);
    reset();
  };

  return (
    <div style={{
      background: '#09100a',
      border: post.isPinned ? '1px solid rgba(0,255,65,0.25)' : '1px solid rgba(0,255,65,0.1)',
      borderRadius: 6,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Pinned bar */}
      {post.isPinned && (
        <div style={{ padding: '4px 14px', background: 'rgba(0,255,65,0.05)', borderBottom: '1px solid rgba(0,255,65,0.12)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Pin style={{ width: 10, height: 10, color: '#00ff41' }} />
          <span style={{ ...mono, fontSize: '0.52rem', color: '#00a828', letterSpacing: '0.15em' }}>FIXADO</span>
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...mono, fontSize: '0.6rem', fontWeight: 700, color: '#00ff41',
            }}>
              {author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : getInitials(author?.name || 'U')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ ...mono, fontSize: '0.72rem', fontWeight: 600, color: '#a0d0a8' }}>{author?.name}</span>
                {author?.level && <LevelBadge level={author.level} size="sm" />}
                {author?.role === 'admin' && (
                  <span style={{ ...mono, fontSize: '0.5rem', padding: '1px 5px', background: 'rgba(255,68,0,0.12)', color: '#ff6633', border: '1px solid rgba(255,68,0,0.25)', borderRadius: 3 }}>ADMIN</span>
                )}
              </div>
              <span style={{ ...mono, fontSize: '0.58rem', color: '#2a5030' }}>{formatRelativeDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Admin actions */}
          <div style={{ display: 'flex', gap: 2 }}>
            {currentUser?.role === 'admin' && (
              <button onClick={() => onPin(post._id)} title="Fixar/Desafixar" style={{
                padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
                color: post.isPinned ? '#00ff41' : '#1a3020', borderRadius: 3, transition: 'color 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
                onMouseOut={e => (e.currentTarget.style.color = post.isPinned ? '#00ff41' : '#1a3020')}>
                <Pin style={{ width: 13, height: 13 }} />
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?._id === author?._id) && (
              <button onClick={() => onDelete(post._id)} title="Excluir" style={{
                padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
                color: '#1a3020', borderRadius: 3, transition: 'color 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4444')}
                onMouseOut={e => (e.currentTarget.style.color = '#1a3020')}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ ...mono, fontSize: '0.9rem', fontWeight: 700, color: '#e0ffe8', margin: '0 0 4px', lineHeight: 1.3 }}>
          {post.title}
        </h3>

        {/* Subtitle */}
        {post.subtitle && (
          <p style={{ ...mono, fontSize: '0.68rem', color: '#4a8a58', margin: '0 0 8px', fontStyle: 'italic' }}>
            {post.subtitle}
          </p>
        )}

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(0,255,65,0.06)', margin: '8px 0' }} />

        {/* Content */}
        <div style={{ ...mono, fontSize: '0.75rem', color: '#6aaa78', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {expanded ? post.content : truncateText(post.content, CONTENT_LIMIT)}
        </div>
        {post.content.length > CONTENT_LIMIT && (
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            ...mono, fontSize: '0.62rem', color: '#00a828', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4,
          }}
            onMouseOver={e => (e.currentTarget.style.color = '#00ff41')}
            onMouseOut={e => (e.currentTarget.style.color = '#00a828')}>
            {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} /> VER MENOS</> : <><ChevronDown style={{ width: 12, height: 12 }} /> VER MAIS</>}
          </button>
        )}

        {/* Media */}
        {post.mediaUrl && (
          <div style={{ marginTop: 12, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,255,65,0.12)' }}>
            {post.mediaType === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt={post.mediaFileName || 'imagem'}
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain', background: '#050905', display: 'block' }}
              />
            ) : post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                controls
                style={{ width: '100%', maxHeight: 420, background: '#050905', display: 'block' }}
              />
            ) : null}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,255,65,0.06)' }}>
          <button onClick={() => onLike(post._id)} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer',
            ...mono, fontSize: '0.65rem', color: isLiked ? '#00ff41' : '#2a5030', transition: 'color 0.15s',
            padding: 0,
          }}
            onMouseOver={e => !isLiked && (e.currentTarget.style.color = '#6aaa78')}
            onMouseOut={e => !isLiked && (e.currentTarget.style.color = '#2a5030')}>
            <ThumbsUp style={{ width: 13, height: 13 }} />
            {likes.length}
          </button>

          <button onClick={() => setShowComments(!showComments)} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer',
            ...mono, fontSize: '0.65rem', color: showComments ? '#00a828' : '#2a5030', transition: 'color 0.15s', padding: 0,
          }}
            onMouseOver={e => (e.currentTarget.style.color = '#6aaa78')}
            onMouseOut={e => (e.currentTarget.style.color = showComments ? '#00a828' : '#2a5030')}>
            <MessageSquare style={{ width: 13, height: 13 }} />
            {post.commentCount}
          </button>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...mono, fontSize: '0.62rem', color: '#1a3020' }}>
            <Eye style={{ width: 11, height: 11 }} />{post.views}
          </span>
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,255,65,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {commentsData?.comments?.map((comment: Comment) => {
                const ca = comment.author as User;
                return (
                  <div key={comment._id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...mono, fontSize: '0.55rem', color: '#00a828',
                    }}>
                      {ca?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ca.avatar} alt={ca.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : getInitials(ca?.name || 'U')}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.07)', borderRadius: 4, padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ ...mono, fontSize: '0.65rem', fontWeight: 600, color: '#7aaa88' }}>{ca?.name}</span>
                        <span style={{ ...mono, fontSize: '0.55rem', color: '#1a4025' }}>{formatRelativeDate(comment.createdAt)}</span>
                      </div>
                      <p style={{ ...mono, fontSize: '0.68rem', color: '#5a8868', margin: 0 }}>{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit(onCommentSubmit)} style={{ display: 'flex', gap: 6 }}>
              <input
                {...register('content', { required: true })}
                type="text"
                placeholder="// escreva um comentário..."
                style={{
                  flex: 1, background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.12)',
                  borderRadius: 4, padding: '6px 10px', ...mono, fontSize: '0.68rem',
                  color: '#6aaa78', outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.3)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.12)')}
              />
              <button type="submit" disabled={addComment.isPending} style={{
                padding: '6px 10px', background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)',
                borderRadius: 4, cursor: 'pointer', color: '#00ff41', display: 'flex', alignItems: 'center',
              }}>
                <Send style={{ width: 13, height: 13 }} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

  // Create post state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => communityApi.posts({ page, limit: 15 }).then((r) => r.data),
  });

  const createPost = useMutation({
    mutationFn: async (formData: CreatePostForm) => {
      let mediaUrl: string | undefined;
      let mType: string | undefined;
      let mFileName: string | undefined;

      if (mediaFile && mediaType) {
        setIsUploading(true);
        const uploadRes = await communityApi.uploadPostMedia(mediaFile, mediaType);
        mediaUrl = uploadRes.data.url;
        mType = uploadRes.data.mediaType || mediaType;
        mFileName = uploadRes.data.fileName;
        setIsUploading(false);
      }

      return communityApi.createPost({
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        content: formData.content,
        mediaUrl,
        mediaType: mType,
        mediaFileName: mFileName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      handleCloseModal();
    },
    onError: () => setIsUploading(false),
  });

  const likePost = useMutation({
    mutationFn: (id: string) => communityApi.likePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => communityApi.deletePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const pinPost = useMutation({
    mutationFn: (id: string) => communityApi.pinPost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePostForm>();

  const handleCloseModal = () => {
    setShowCreateModal(false);
    reset();
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    e.target.value = '';
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const posts: Post[] = data?.posts || [];
  const pagination = data?.pagination;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Banner */}
      <div style={{
        marginBottom: 22, borderRadius: 6, overflow: 'hidden', position: 'relative', height: 180,
        background: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(0,255,65,0.18)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,8,5,0.88) 0%, rgba(0,20,12,0.65) 55%, rgba(0,0,0,0.2) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.015) 3px, rgba(0,255,65,0.015) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.4), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: 12 }}>
          <div>
            <p style={{ ...mono, fontSize: '0.55rem', color: '#00ff41', letterSpacing: '0.2em', margin: '0 0 4px', opacity: 0.6 }}>{'// ELITE TROJAN > COMUNIDADE'}</p>
            <h2 style={{ ...mono, fontSize: '1.2rem', fontWeight: 700, color: '#e0ffe8', margin: '0 0 4px', textShadow: '0 0 20px rgba(0,255,65,0.35)' }}>COMUNIDADE</h2>
            <p style={{ ...mono, fontSize: '0.62rem', color: '#3a6045', margin: 0 }}>{'> Compartilhe, discuta e conecte-se com outros membros'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/community/chat" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,65,0.25)', borderRadius: 4,
              ...mono, fontSize: '0.62rem', color: '#00c832', textDecoration: 'none',
            }}>
              <Hash style={{ width: 12, height: 12 }} /> CHAT
            </Link>
            <button onClick={() => setShowCreateModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px',
              background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.35)', borderRadius: 4,
              ...mono, fontSize: '0.62rem', fontWeight: 700, color: '#00ff41', cursor: 'pointer',
            }}>
              <Plus style={{ width: 12, height: 12 }} /> NOVO POST
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 120, background: '#09100a', borderRadius: 6, border: '1px solid rgba(0,255,65,0.06)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px solid rgba(0,255,65,0.08)', borderRadius: 6, background: '#09100a' }}>
          <MessageSquare style={{ width: 36, height: 36, color: '#1a3020', margin: '0 auto 12px' }} />
          <p style={{ ...mono, fontSize: '0.75rem', color: '#3a5040', margin: '0 0 4px' }}>Nenhum post ainda</p>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#1a3020', margin: '0 0 16px' }}>Seja o primeiro a iniciar uma discussão</p>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px',
            background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.25)', borderRadius: 4,
            ...mono, fontSize: '0.65rem', color: '#00ff41', cursor: 'pointer',
          }}>
            <Plus style={{ width: 12, height: 12 }} /> CRIAR POST
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={(id) => likePost.mutate(id)}
              onDelete={(id) => deletePost.mutate(id)}
              onPin={(id) => pinPost.mutate(id)}
            />
          ))}

          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{
                padding: '6px 12px', ...mono, fontSize: '0.65rem', cursor: 'pointer',
                background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 4,
                color: page === 1 ? '#1a3020' : '#00a828',
              }}>
                ← ANTERIOR
              </button>
              <span style={{ ...mono, fontSize: '0.65rem', color: '#2a5030' }}>{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{
                padding: '6px 12px', ...mono, fontSize: '0.65rem', cursor: 'pointer',
                background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 4,
                color: page === pagination.pages ? '#1a3020' : '#00a828',
              }}>
                PRÓXIMA →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', padding: 16,
        }} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div style={{
            width: '100%', maxWidth: 600, background: '#060d07',
            border: '1px solid rgba(0,255,65,0.2)', borderRadius: 6,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
              <div>
                <p style={{ ...mono, fontSize: '0.55rem', color: '#00ff41', letterSpacing: '0.15em', margin: '0 0 2px' }}>{'$ community.createPost'}</p>
                <h3 style={{ ...mono, fontSize: '0.85rem', fontWeight: 700, color: '#e0ffe8', margin: 0 }}>NOVO POST</h3>
              </div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a3020', padding: 4 }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4444')}
                onMouseOut={e => (e.currentTarget.style.color = '#1a3020')}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createPost.mutate(d))} style={{ padding: '18px' }}>
              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#5a8a68', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  <span style={{ color: '#00ff41' }}>&gt;</span> TÍTULO <span style={{ color: '#ff4444' }}>*</span>
                </label>
                <input
                  {...register('title', { required: 'Título obrigatório', maxLength: { value: 200, message: 'Máximo 200 caracteres' } })}
                  type="text"
                  placeholder="Título do post..."
                  style={{
                    width: '100%', background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.15)',
                    borderRadius: 4, padding: '9px 12px', ...mono, fontSize: '0.75rem',
                    color: '#c0e8c8', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)')}
                />
                {errors.title && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6060', margin: '4px 0 0' }}>{errors.title.message}</p>}
              </div>

              {/* Subtitle */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#5a8a68', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  <span style={{ color: '#00a828' }}>&gt;</span> SUBTÍTULO <span style={{ color: '#1a3020' }}>(opcional)</span>
                </label>
                <input
                  {...register('subtitle', { maxLength: { value: 300, message: 'Máximo 300 caracteres' } })}
                  type="text"
                  placeholder="Uma breve descrição ou subtítulo..."
                  style={{
                    width: '100%', background: 'rgba(0,255,65,0.02)', border: '1px solid rgba(0,255,65,0.1)',
                    borderRadius: 4, padding: '9px 12px', ...mono, fontSize: '0.72rem',
                    color: '#8ab898', outline: 'none', boxSizing: 'border-box',
                    fontStyle: 'italic',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.3)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.1)')}
                />
                {errors.subtitle && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6060', margin: '4px 0 0' }}>{errors.subtitle.message}</p>}
              </div>

              {/* Content */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#5a8a68', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  <span style={{ color: '#00ff41' }}>&gt;</span> CONTEÚDO <span style={{ color: '#ff4444' }}>*</span>
                </label>
                <textarea
                  {...register('content', { required: 'Conteúdo obrigatório', maxLength: { value: 10000, message: 'Máximo 10000 caracteres' } })}
                  rows={6}
                  placeholder="Compartilhe seus pensamentos, dúvidas ou insights..."
                  style={{
                    width: '100%', background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.15)',
                    borderRadius: 4, padding: '9px 12px', ...mono, fontSize: '0.72rem',
                    color: '#8ab898', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    lineHeight: 1.6,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)')}
                />
                {errors.content && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6060', margin: '4px 0 0' }}>{errors.content.message}</p>}
              </div>

              {/* Media */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#5a8a68', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                  <span style={{ color: '#00a828' }}>&gt;</span> MÍDIA <span style={{ color: '#1a3020' }}>(opcional)</span>
                </label>

                {!mediaFile ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleMediaSelect(e, 'image')} />
                    <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleMediaSelect(e, 'video')} />
                    <button type="button" onClick={() => imageInputRef.current?.click()} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      background: 'rgba(0,255,65,0.04)', border: '1px dashed rgba(0,255,65,0.2)',
                      borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#3a6045',
                      transition: 'all 0.15s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)'; e.currentTarget.style.color = '#00ff41'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.2)'; e.currentTarget.style.color = '#3a6045'; }}>
                      <Image style={{ width: 13, height: 13 }} /> IMAGEM
                    </button>
                    <button type="button" onClick={() => videoInputRef.current?.click()} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      background: 'rgba(0,255,65,0.04)', border: '1px dashed rgba(0,255,65,0.2)',
                      borderRadius: 4, cursor: 'pointer', ...mono, fontSize: '0.62rem', color: '#3a6045',
                      transition: 'all 0.15s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)'; e.currentTarget.style.color = '#00ff41'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.2)'; e.currentTarget.style.color = '#3a6045'; }}>
                      <Video style={{ width: 13, height: 13 }} /> VÍDEO
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    {mediaType === 'image' && mediaPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaPreview} alt="preview" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#050905', display: 'block' }} />
                    )}
                    {mediaType === 'video' && mediaPreview && (
                      <video src={mediaPreview} controls style={{ width: '100%', maxHeight: 260, background: '#050905', display: 'block' }} />
                    )}
                    <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ ...mono, fontSize: '0.6rem', color: '#3a6045' }}>{mediaFile.name}</span>
                      <button type="button" onClick={removeMedia} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a2020', padding: 2 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#ff4444')}
                        onMouseOut={e => (e.currentTarget.style.color = '#5a2020')}>
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} style={{
                  padding: '8px 16px', ...mono, fontSize: '0.65rem', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(0,255,65,0.12)', borderRadius: 4, color: '#2a5030',
                }}>
                  CANCELAR
                </button>
                <button type="submit" disabled={createPost.isPending || isUploading} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                  ...mono, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.35)', borderRadius: 4,
                  color: '#00ff41', opacity: createPost.isPending || isUploading ? 0.6 : 1,
                }}>
                  {createPost.isPending || isUploading ? (
                    <><div style={{ width: 12, height: 12, border: '2px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> {isUploading ? 'ENVIANDO MÍDIA...' : 'PUBLICANDO...'}</>
                  ) : (
                    <><Upload style={{ width: 13, height: 13 }} /> PUBLICAR POST</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
