'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  MessageSquare, Pin, Trash2, Plus,
  Eye, ThumbsUp, Send, Hash
} from 'lucide-react';
import Link from 'next/link';
import { communityApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { LevelBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeDate, getInitials, truncateText } from '@/lib/utils';
import type { Post, Comment, User } from '@/types';

interface CreatePostForm {
  title: string;
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

  const onCommentSubmit = async (data: CommentForm) => {
    await addComment.mutateAsync(data.content);
    reset();
  };

  return (
    <Card className={`${post.isPinned ? 'border-green-500/20 bg-green-500/3' : ''}`}>
      <div className="p-4">
        {/* Post header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
            {author?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatar} alt={author.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(author?.name || 'U')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-200">{author?.name}</span>
                  {author?.level && <LevelBadge level={author.level} size="sm" />}
                  {author?.role === 'admin' && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-400 border border-red-800/50 rounded font-medium">ADMIN</span>
                  )}
                  {post.isPinned && (
                    <span className="flex items-center gap-0.5 text-xs text-green-400">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{formatRelativeDate(post.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => onPin(post._id)}
                      className="p-1.5 text-gray-600 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                      title="Pin/Unpin"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {(currentUser?.role === 'admin' || currentUser?._id === (author as User)?._id) && (
                  <button
                    onClick={() => onDelete(post._id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-100 mt-2">{post.title}</h3>

            <div className="mt-1.5 text-sm text-gray-400">
              {expanded ? (
                <div className="whitespace-pre-wrap">{post.content}</div>
              ) : (
                <div>{truncateText(post.content, 200)}</div>
              )}
              {post.content.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-green-400 hover:text-green-300 text-xs mt-1 transition-colors"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800/40">
          <button
            onClick={() => onLike(post._id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              isLiked ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {likes.length}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentCount} comments
          </button>
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Eye className="w-3 h-3" /> {post.views}
          </span>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-gray-800/40 space-y-3">
            {commentsData?.comments?.map((comment: Comment) => {
              const commentAuthor = comment.author as User;
              return (
                <div key={comment._id} className="flex gap-2.5">
                  <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    {getInitials(commentAuthor?.name || 'U')}
                  </div>
                  <div className="flex-1 bg-gray-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-300">{commentAuthor?.name}</span>
                      <span className="text-xs text-gray-600">{formatRelativeDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{comment.content}</p>
                  </div>
                </div>
              );
            })}

            {/* Comment form */}
            <form onSubmit={handleSubmit(onCommentSubmit)} className="flex gap-2">
              <input
                {...register('content', { required: true })}
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500/50"
              />
              <button
                type="submit"
                disabled={addComment.isPending}
                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => communityApi.posts({ page, limit: 15 }).then((r) => r.data),
  });

  const createPost = useMutation({
    mutationFn: (data: CreatePostForm) => communityApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowCreateModal(false);
      reset();
    },
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

  const posts: Post[] = data?.posts || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Visual Banner */}
      <div style={{
        marginBottom: 22, borderRadius: 8, overflow: 'hidden', position: 'relative', height: 220,
        background: 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85) center/cover no-repeat',
        border: '1px solid rgba(0,255,65,0.22)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,8,5,0.80) 0%, rgba(0,20,12,0.60) 55%, rgba(0,0,0,0.25) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,65,0.015) 3px, rgba(0,255,65,0.015) 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.5), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: 14 }}>
          <div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#00ff41', letterSpacing: '0.2em', margin: '0 0 5px', opacity: 0.7 }}>{'// ELITE TROJAN > COMUNIDADE'}</p>
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.3rem', fontWeight: 700, color: '#e0ffe8', margin: '0 0 4px', textShadow: '0 0 20px rgba(0,255,65,0.4)' }}>COMUNIDADE</h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#4a7a5a', margin: 0 }}>{'> Compartilhe, discuta e conecte-se com outros membros'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/community/chat" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 4,
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#00ff41', textDecoration: 'none',
            }}>
              <Hash style={{ width: 13, height: 13 }} /> CHAT
            </Link>
            <button onClick={() => setShowCreateModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.4)', borderRadius: 4,
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#00ff41',
              cursor: 'pointer',
            }}>
              <Plus style={{ width: 13, height: 13 }} /> NOVO POST
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Community</h1>
          <p className="text-gray-500 text-sm mt-0.5">Share, discuss and connect</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/community/chat" className="btn-secondary flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4" /> Live Chat
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50">
          <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No posts yet</p>
          <p className="text-gray-600 text-sm mt-1">Be the first to start a discussion!</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4 text-sm">
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">
                Previous
              </button>
              <span className="text-sm text-gray-500">{page} / {pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-sm">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); reset(); }}
        title="Create New Post"
        size="lg"
      >
        <form onSubmit={handleSubmit((data) => createPost.mutate(data))} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input
              {...register('title', { required: 'Title is required', maxLength: { value: 200, message: 'Max 200 chars' } })}
              type="text"
              placeholder="What do you want to discuss?"
              className="input-field"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label-text">Content</label>
            <textarea
              {...register('content', { required: 'Content is required', maxLength: { value: 10000, message: 'Max 10000 chars' } })}
              rows={6}
              placeholder="Share your thoughts, questions or insights..."
              className="input-field resize-none"
            />
            {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowCreateModal(false); reset(); }} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createPost.isPending} className="btn-primary flex items-center gap-2">
              {createPost.isPending ? (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
