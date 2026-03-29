'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  MessageSquare, Pin, Trash2, Plus, Eye, ThumbsUp,
  Send, Hash, Image, Video, X, Upload, Repeat2,
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, CornerDownRight,
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

// ─── PostCard ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onDelete, onPin, onRepost, onBookmark, currentUser }: {
  post: Post;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onRepost: (id: string) => void;
  onBookmark: (id: string) => void;
  currentUser: User | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
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
      setReplyTo(null);
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm<CommentForm>();
  const author = post.author as User;
  const likes = post.likes || [];
  const reposts = post.reposts || [];
  const bookmarks = post.bookmarks || [];
  const isLiked = currentUser ? likes.includes(currentUser._id) : false;
  const isReposted = currentUser ? reposts.includes(currentUser._id) : false;
  const isBookmarked = currentUser ? bookmarks.includes(currentUser._id) : false;
  const CONTENT_LIMIT = 320;

  const onCommentSubmit = async (data: CommentForm) => {
    await addComment.mutateAsync(data.content);
    reset();
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, name: authorName });
    setShowComments(true);
    setValue('content', `@${authorName} `);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #070f1c 0%, #060c18 100%)',
      border: post.isPinned ? '1px solid rgba(0,150,255,0.35)' : '1px solid rgba(0,100,200,0.15)',
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: post.isPinned ? '0 0 20px rgba(0,120,255,0.08)' : '0 2px 12px rgba(0,0,0,0.3)',
    }}
      onMouseOver={e => { if (!post.isPinned) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,130,255,0.28)'; }}
      onMouseOut={e => { if (!post.isPinned) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,100,200,0.15)'; }}>

      {/* Pinned bar */}
      {post.isPinned && (
        <div style={{ padding: '5px 16px', background: 'rgba(0,120,255,0.07)', borderBottom: '1px solid rgba(0,120,255,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pin style={{ width: 10, height: 10, color: '#0096ff' }} />
          <span style={{ ...mono, fontSize: '0.52rem', color: '#0070cc', letterSpacing: '0.15em' }}>FIXADO</span>
        </div>
      )}

      <div style={{ padding: '16px 18px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: 'rgba(0,120,255,0.1)', border: '1px solid rgba(0,120,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...mono, fontSize: '0.62rem', fontWeight: 700, color: '#0096ff',
            }}>
              {author?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.avatar} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : getInitials(author?.name || 'U')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ ...mono, fontSize: '0.75rem', fontWeight: 600, color: '#b8d8f8' }}>{author?.name}</span>
                {author?.level && <LevelBadge level={author.level} size="sm" />}
                {author?.role === 'admin' && (
                  <span style={{ ...mono, fontSize: '0.5rem', padding: '2px 6px', background: 'rgba(255,68,0,0.12)', color: '#ff7755', border: '1px solid rgba(255,68,0,0.2)', borderRadius: 3, letterSpacing: '0.08em' }}>ADMIN</span>
                )}
              </div>
              <span style={{ ...mono, fontSize: '0.58rem', color: '#2a4a6a' }}>{formatRelativeDate(post.createdAt)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 2 }}>
            {currentUser?.role === 'admin' && (
              <button onClick={() => onPin(post._id)} title="Fixar/Desafixar" style={{
                padding: 5, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4,
                color: post.isPinned ? '#0096ff' : '#1a3050',
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#0096ff')}
                onMouseOut={e => (e.currentTarget.style.color = post.isPinned ? '#0096ff' : '#1a3050')}>
                <Pin style={{ width: 13, height: 13 }} />
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?._id === author?._id) && (
              <button onClick={() => onDelete(post._id)} title="Excluir" style={{
                padding: 5, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, color: '#1a3050',
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4455')}
                onMouseOut={e => (e.currentTarget.style.color = '#1a3050')}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#e0f0ff', margin: '0 0 5px', lineHeight: 1.3 }}>
          {post.title}
        </h3>

        {/* Subtitle */}
        {post.subtitle && (
          <p style={{ ...mono, fontSize: '0.7rem', color: '#4a7aaa', margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.5 }}>
            {post.subtitle}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(0,120,255,0.15), transparent)', margin: '10px 0' }} />

        {/* Content */}
        <div style={{ ...mono, fontSize: '0.77rem', color: '#7aaac8', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          {expanded ? post.content : truncateText(post.content, CONTENT_LIMIT)}
        </div>
        {post.content.length > CONTENT_LIMIT && (
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0',
            ...mono, fontSize: '0.62rem', color: '#0070cc',
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
          }}
            onMouseOver={e => (e.currentTarget.style.color = '#0096ff')}
            onMouseOut={e => (e.currentTarget.style.color = '#0070cc')}>
            {expanded ? <><ChevronUp style={{ width: 12, height: 12 }} />VER MENOS</> : <><ChevronDown style={{ width: 12, height: 12 }} />VER MAIS</>}
          </button>
        )}

        {/* Media — always visible */}
        {post.mediaUrl && (
          <div style={{ marginTop: 14, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,120,255,0.15)', background: '#040810' }}>
            {post.mediaType === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrl}
                alt={post.mediaFileName || 'imagem'}
                style={{ width: '100%', maxHeight: 480, objectFit: 'contain', display: 'block' }}
              />
            ) : post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                controls
                style={{ width: '100%', maxHeight: 480, display: 'block' }}
              />
            ) : null}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,100,200,0.1)', flexWrap: 'wrap' }}>

          {/* Like */}
          <ActionBtn
            icon={<ThumbsUp style={{ width: 14, height: 14 }} />}
            count={likes.length}
            active={isLiked}
            activeColor="#0096ff"
            label="Curtir"
            onClick={() => onLike(post._id)}
          />

          {/* Comment */}
          <ActionBtn
            icon={<MessageSquare style={{ width: 14, height: 14 }} />}
            count={post.commentCount}
            active={showComments}
            activeColor="#00c8ff"
            label="Comentar"
            onClick={() => { setShowComments(!showComments); if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 150); }}
          />

          {/* Repost */}
          <ActionBtn
            icon={<Repeat2 style={{ width: 14, height: 14 }} />}
            count={reposts.length}
            active={isReposted}
            activeColor="#00d4aa"
            label="Republicar"
            onClick={() => onRepost(post._id)}
          />

          {/* Bookmark */}
          <ActionBtn
            icon={isBookmarked ? <BookmarkCheck style={{ width: 14, height: 14 }} /> : <Bookmark style={{ width: 14, height: 14 }} />}
            count={bookmarks.length}
            active={isBookmarked}
            activeColor="#a060ff"
            label="Favoritar"
            onClick={() => onBookmark(post._id)}
          />

          {/* Views */}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, ...mono, fontSize: '0.6rem', color: '#1a3050' }}>
            <Eye style={{ width: 11, height: 11 }} />{post.views}
          </span>
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,100,200,0.08)' }}>
            {/* Reply indicator */}
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(0,120,255,0.06)', borderRadius: 4, marginBottom: 8, border: '1px solid rgba(0,120,255,0.12)' }}>
                <CornerDownRight style={{ width: 11, height: 11, color: '#0070cc' }} />
                <span style={{ ...mono, fontSize: '0.6rem', color: '#4a7aaa' }}>Respondendo a <strong style={{ color: '#0096ff' }}>@{replyTo.name}</strong></span>
                <button onClick={() => { setReplyTo(null); setValue('content', ''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#1a3050', padding: 0 }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </div>
            )}

            {/* Comment list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {commentsData?.comments?.length === 0 && (
                <p style={{ ...mono, fontSize: '0.65rem', color: '#1a3050', textAlign: 'center', padding: '8px 0' }}>Nenhum comentário ainda. Seja o primeiro!</p>
              )}
              {commentsData?.comments?.map((comment: Comment) => {
                const ca = comment.author as User;
                return (
                  <div key={comment._id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: 'rgba(0,120,255,0.08)', border: '1px solid rgba(0,120,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...mono, fontSize: '0.55rem', color: '#0070cc',
                    }}>
                      {ca?.avatar
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={ca.avatar} alt={ca.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials(ca?.name || 'U')}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,80,160,0.06)', border: '1px solid rgba(0,100,200,0.1)', borderRadius: 6, padding: '7px 11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ ...mono, fontSize: '0.67rem', fontWeight: 600, color: '#8ab8d8' }}>{ca?.name}</span>
                          <span style={{ ...mono, fontSize: '0.55rem', color: '#1a3050' }}>{formatRelativeDate(comment.createdAt)}</span>
                        </div>
                        <button onClick={() => handleReply(comment._id, ca?.name || 'usuário')} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
                          ...mono, fontSize: '0.55rem', color: '#2a5080', borderRadius: 3,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}
                          onMouseOver={e => (e.currentTarget.style.color = '#0096ff')}
                          onMouseOut={e => (e.currentTarget.style.color = '#2a5080')}>
                          <CornerDownRight style={{ width: 10, height: 10 }} />RESPONDER
                        </button>
                      </div>
                      <p style={{ ...mono, fontSize: '0.7rem', color: '#5a8ab0', margin: 0, lineHeight: 1.5 }}>{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment input */}
            <form onSubmit={handleSubmit(onCommentSubmit)} style={{ display: 'flex', gap: 7 }}>
              <input
                ref={commentInputRef}
                {...register('content', { required: true })}
                type="text"
                placeholder="Escreva um comentário..."
                style={{
                  flex: 1, background: 'rgba(0,80,160,0.06)', border: '1px solid rgba(0,100,200,0.15)',
                  borderRadius: 5, padding: '7px 11px', ...mono, fontSize: '0.7rem',
                  color: '#8ab8d8', outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,150,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,100,200,0.15)')}
              />
              <button type="submit" disabled={addComment.isPending} style={{
                padding: '7px 11px', background: 'rgba(0,120,255,0.1)', border: '1px solid rgba(0,120,255,0.25)',
                borderRadius: 5, cursor: 'pointer', color: '#0096ff', display: 'flex', alignItems: 'center',
                transition: 'background 0.15s',
              }}>
                <Send style={{ width: 14, height: 14 }} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ActionBtn helper ─────────────────────────────────────────────────────────
function ActionBtn({ icon, count, active, activeColor, label, onClick }: {
  icon: React.ReactNode;
  count: number;
  active: boolean;
  activeColor: string;
  label: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 5,
        background: active ? `${activeColor}14` : hover ? 'rgba(0,100,200,0.06)' : 'transparent',
        border: `1px solid ${active ? `${activeColor}30` : 'transparent'}`,
        cursor: 'pointer',
        color: active ? activeColor : hover ? '#5a88b0' : '#2a4a6a',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}>
      {icon}
      <span>{count}</span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

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
        const up = await communityApi.uploadPostMedia(mediaFile, mediaType);
        mediaUrl = up.data.url;
        mType = up.data.mediaType || mediaType;
        mFileName = up.data.fileName;
        setIsUploading(false);
      }
      return communityApi.createPost({
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        content: formData.content,
        mediaUrl, mediaType: mType, mediaFileName: mFileName,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts'] }); handleCloseModal(); },
    onError: () => setIsUploading(false),
  });

  const likePost = useMutation({ mutationFn: (id: string) => communityApi.likePost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const deletePost = useMutation({ mutationFn: (id: string) => communityApi.deletePost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const pinPost = useMutation({ mutationFn: (id: string) => communityApi.pinPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const repostPost = useMutation({ mutationFn: (id: string) => communityApi.repostPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });
  const bookmarkPost = useMutation({ mutationFn: (id: string) => communityApi.bookmarkPost(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePostForm>();

  const handleCloseModal = () => { setShowCreateModal(false); reset(); setMediaFile(null); setMediaPreview(null); setMediaType(null); };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeMedia = () => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); setMediaFile(null); setMediaPreview(null); setMediaType(null); };

  const posts: Post[] = data?.posts || [];
  const pagination = data?.pagination;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>

      {/* Ambient glow effects */}
      <div style={{ position: 'fixed', top: '15%', left: '5%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(0,80,200,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '5%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(0,150,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Banner */}
      <div style={{
        marginBottom: 24, borderRadius: 8, overflow: 'hidden', position: 'relative', height: 180,
        background: 'linear-gradient(135deg, #04080f 0%, #060d1a 50%, #04080f 100%)',
        border: '1px solid rgba(0,120,255,0.2)',
        boxShadow: '0 4px 30px rgba(0,60,150,0.15)',
      }}>
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,100,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,255,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Scanlines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)', pointerEvents: 'none' }} />
        {/* Glow top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,150,255,0.6), transparent)' }} />
        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0096ff', boxShadow: '0 0 8px #0096ff' }} />
              <span style={{ ...mono, fontSize: '0.55rem', color: '#0096ff', letterSpacing: '0.2em', opacity: 0.7 }}>ELITE TROJAN › COMUNIDADE</span>
            </div>
            <h2 style={{ ...mono, fontSize: '1.4rem', fontWeight: 700, color: '#e0f0ff', margin: '0 0 5px', textShadow: '0 0 30px rgba(0,150,255,0.4)' }}>COMUNIDADE</h2>
            <p style={{ ...mono, fontSize: '0.63rem', color: '#2a5080', margin: 0 }}>Compartilhe, discuta e conecte-se com outros membros</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/community/chat" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(0,80,200,0.1)', border: '1px solid rgba(0,120,255,0.25)', borderRadius: 6,
              ...mono, fontSize: '0.63rem', color: '#5aaaee', textDecoration: 'none', transition: 'all 0.15s',
            }}>
              <Hash style={{ width: 13, height: 13 }} />CHAT
            </Link>
            <button onClick={() => setShowCreateModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(0,120,255,0.12)', border: '1px solid rgba(0,150,255,0.35)', borderRadius: 6,
              ...mono, fontSize: '0.63rem', fontWeight: 700, color: '#60b8ff', cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0,120,255,0.1)',
            }}>
              <Plus style={{ width: 13, height: 13 }} />NOVO POST
            </button>
          </div>
        </div>
      </div>

      {/* Posts feed */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 140, background: 'rgba(6,13,24,0.8)', borderRadius: 8, border: '1px solid rgba(0,100,200,0.08)', opacity: 0.7 }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 20px', border: '1px solid rgba(0,100,200,0.1)', borderRadius: 8, background: 'rgba(6,13,24,0.8)' }}>
          <MessageSquare style={{ width: 40, height: 40, color: '#1a3050', margin: '0 auto 14px' }} />
          <p style={{ ...mono, fontSize: '0.78rem', color: '#2a4a70', margin: '0 0 6px' }}>Nenhum post ainda</p>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#1a3050', margin: '0 0 18px' }}>Seja o primeiro a iniciar uma discussão</p>
          <button onClick={() => setShowCreateModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            background: 'rgba(0,120,255,0.1)', border: '1px solid rgba(0,150,255,0.3)', borderRadius: 6,
            ...mono, fontSize: '0.65rem', color: '#60b8ff', cursor: 'pointer',
          }}>
            <Plus style={{ width: 13, height: 13 }} />CRIAR POST
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={(id) => likePost.mutate(id)}
              onDelete={(id) => deletePost.mutate(id)}
              onPin={(id) => pinPost.mutate(id)}
              onRepost={(id) => repostPost.mutate(id)}
              onBookmark={(id) => bookmarkPost.mutate(id)}
            />
          ))}

          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{
                padding: '7px 14px', ...mono, fontSize: '0.65rem', cursor: page === 1 ? 'default' : 'pointer',
                background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,100,200,0.15)', borderRadius: 5,
                color: page === 1 ? '#1a3050' : '#4a88c0',
              }}>← ANTERIOR</button>
              <span style={{ ...mono, fontSize: '0.65rem', color: '#2a4a6a' }}>{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{
                padding: '7px 14px', ...mono, fontSize: '0.65rem', cursor: page === pagination.pages ? 'default' : 'pointer',
                background: 'rgba(0,80,200,0.06)', border: '1px solid rgba(0,100,200,0.15)', borderRadius: 5,
                color: page === pagination.pages ? '#1a3050' : '#4a88c0',
              }}>PRÓXIMA →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Create Post Modal ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,5,12,0.88)', padding: 16, backdropFilter: 'blur(4px)',
        }} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div style={{
            width: '100%', maxWidth: 620,
            background: 'linear-gradient(145deg, #060d1a 0%, #040810 100%)',
            border: '1px solid rgba(0,120,255,0.25)', borderRadius: 8,
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,40,120,0.3)',
          }}>
            {/* Grid bg on modal */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 8, backgroundImage: 'linear-gradient(rgba(0,100,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,255,0.025) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,120,255,0.12)', position: 'relative' }}>
              <div>
                <p style={{ ...mono, fontSize: '0.55rem', color: '#0096ff', letterSpacing: '0.15em', margin: '0 0 3px', opacity: 0.7 }}>COMUNIDADE › CRIAR</p>
                <h3 style={{ ...mono, fontSize: '0.9rem', fontWeight: 700, color: '#d0e8ff', margin: 0 }}>NOVO POST</h3>
              </div>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a3050', padding: 5, borderRadius: 4 }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4455')}
                onMouseOut={e => (e.currentTarget.style.color = '#1a3050')}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => createPost.mutate(d))} style={{ padding: '20px', position: 'relative' }}>

              {/* Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#4a7aaa', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  TÍTULO <span style={{ color: '#ff4455' }}>*</span>
                </label>
                <input
                  {...register('title', { required: 'Título obrigatório', maxLength: { value: 200, message: 'Máximo 200 caracteres' } })}
                  type="text"
                  placeholder="Título do post..."
                  style={{
                    width: '100%', background: 'rgba(0,80,180,0.06)', border: '1px solid rgba(0,100,200,0.18)',
                    borderRadius: 5, padding: '10px 13px', ...mono, fontSize: '0.8rem',
                    color: '#c0dcf8', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,150,255,0.45)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,100,200,0.18)')}
                />
                {errors.title && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6070', margin: '4px 0 0' }}>{errors.title.message}</p>}
              </div>

              {/* Subtitle */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#4a7aaa', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  SUBTÍTULO <span style={{ color: '#1a3a5a' }}>(opcional)</span>
                </label>
                <input
                  {...register('subtitle', { maxLength: { value: 300, message: 'Máximo 300 caracteres' } })}
                  type="text"
                  placeholder="Uma breve descrição ou contexto adicional..."
                  style={{
                    width: '100%', background: 'rgba(0,80,180,0.04)', border: '1px solid rgba(0,100,200,0.12)',
                    borderRadius: 5, padding: '10px 13px', ...mono, fontSize: '0.75rem',
                    color: '#8ab0d0', outline: 'none', boxSizing: 'border-box', fontStyle: 'italic',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,150,255,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,100,200,0.12)')}
                />
                {errors.subtitle && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6070', margin: '4px 0 0' }}>{errors.subtitle.message}</p>}
              </div>

              {/* Content */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#4a7aaa', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  CONTEÚDO <span style={{ color: '#ff4455' }}>*</span>
                </label>
                <textarea
                  {...register('content', { required: 'Conteúdo obrigatório', maxLength: { value: 10000, message: 'Máximo 10000 caracteres' } })}
                  rows={6}
                  placeholder="Compartilhe seus pensamentos, dúvidas, insights..."
                  style={{
                    width: '100%', background: 'rgba(0,80,180,0.06)', border: '1px solid rgba(0,100,200,0.18)',
                    borderRadius: 5, padding: '10px 13px', ...mono, fontSize: '0.75rem',
                    color: '#8ab0d0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.65,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,150,255,0.45)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,100,200,0.18)')}
                />
                {errors.content && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff6070', margin: '4px 0 0' }}>{errors.content.message}</p>}
              </div>

              {/* Media */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ ...mono, fontSize: '0.6rem', color: '#4a7aaa', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                  MÍDIA <span style={{ color: '#1a3a5a' }}>(opcional)</span>
                </label>
                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleMediaSelect(e, 'image')} />
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleMediaSelect(e, 'video')} />

                {!mediaFile ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: 'IMAGEM', icon: <Image style={{ width: 13, height: 13 }} />, action: () => imageInputRef.current?.click() },
                      { label: 'VÍDEO', icon: <Video style={{ width: 13, height: 13 }} />, action: () => videoInputRef.current?.click() },
                    ].map(btn => (
                      <button key={btn.label} type="button" onClick={btn.action} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
                        background: 'rgba(0,80,180,0.06)', border: '1px dashed rgba(0,100,200,0.2)',
                        borderRadius: 5, cursor: 'pointer', ...mono, fontSize: '0.63rem', color: '#3a6080',
                        transition: 'all 0.15s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,100,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,150,255,0.4)'; e.currentTarget.style.color = '#60b8ff'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,80,180,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,100,200,0.2)'; e.currentTarget.style.color = '#3a6080'; }}>
                        {btn.icon}{btn.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ border: '1px solid rgba(0,120,255,0.2)', borderRadius: 6, overflow: 'hidden', background: '#040810' }}>
                    {mediaType === 'image' && mediaPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaPreview} alt="preview" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }} />
                    )}
                    {mediaType === 'video' && mediaPreview && (
                      <video src={mediaPreview} controls style={{ width: '100%', maxHeight: 280, display: 'block' }} />
                    )}
                    <div style={{ padding: '7px 11px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ ...mono, fontSize: '0.6rem', color: '#3a6080' }}>{mediaFile.name}</span>
                      <button type="button" onClick={removeMedia} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a4060', padding: 2 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#ff4455')}
                        onMouseOut={e => (e.currentTarget.style.color = '#2a4060')}>
                        <X style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} style={{
                  padding: '9px 16px', ...mono, fontSize: '0.65rem', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(0,100,200,0.15)', borderRadius: 5, color: '#2a4a6a',
                }}>
                  CANCELAR
                </button>
                <button type="submit" disabled={createPost.isPending || isUploading} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px',
                  ...mono, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(0,120,255,0.12)', border: '1px solid rgba(0,150,255,0.35)', borderRadius: 5,
                  color: '#60b8ff', boxShadow: '0 0 14px rgba(0,100,255,0.1)',
                  opacity: createPost.isPending || isUploading ? 0.6 : 1,
                }}>
                  {createPost.isPending || isUploading ? (
                    <><div className="animate-spin" style={{ width: 13, height: 13, border: '2px solid #60b8ff', borderTopColor: 'transparent', borderRadius: '50%' }} />{isUploading ? 'ENVIANDO MÍDIA...' : 'PUBLICANDO...'}</>
                  ) : (
                    <><Upload style={{ width: 13, height: 13 }} />PUBLICAR</>
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
