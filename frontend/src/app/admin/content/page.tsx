'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Search, Upload, ExternalLink } from 'lucide-react';
import { contentApi, categoriesApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { getContentTypeIcon, getContentTypeLabel, formatBytes, formatDate } from '@/lib/utils';
import type { Content, Category, ContentType, UserLevel } from '@/types';

interface ContentForm {
  title: string;
  description: string;
  category: string;
  type: ContentType;
  minLevel: UserLevel;
  externalLink: string;
  tags: string;
  isDrop: boolean;
  dropExpiresAt: string;
}

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; content: Content | null }>({ open: false, content: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', { search, page }],
    queryFn: () =>
      contentApi.list({ search: search || undefined, page, limit: 15, sort: '-createdAt' }).then((r) => r.data),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const createContent = useMutation({
    mutationFn: (data: object) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateContent = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => contentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setEditModal({ open: false, content: null });
    },
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => contentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setDeleteModal({ open: false, id: null });
    },
  });

  const { register, handleSubmit, reset: resetForm, setValue, formState: { errors } } = useForm<ContentForm>({
    defaultValues: { type: 'material', minLevel: 'iniciante' },
  });

  const contents: Content[] = data?.contents || [];
  const pagination = data?.pagination;
  const categories: Category[] = catData?.categories || [];

  const openEditModal = (content: Content) => {
    setEditModal({ open: true, content });
    const cat = typeof content.category === 'object' ? content.category._id : content.category;
    setValue('title', content.title);
    setValue('description', content.description);
    setValue('category', cat);
    setValue('type', content.type);
    setValue('minLevel', content.minLevel);
    setValue('externalLink', content.externalLink || '');
    setValue('tags', content.tags?.join(', ') || '');
    setValue('isDrop', content.isDrop);
    setValue('dropExpiresAt', content.dropExpiresAt?.slice(0, 16) || '');
  };

  const onSubmit = (data: ContentForm) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      dropExpiresAt: data.isDrop && data.dropExpiresAt ? new Date(data.dropExpiresAt).toISOString() : null,
    };

    if (editModal.content) {
      updateContent.mutate({ id: editModal.content._id, data: payload });
    } else {
      createContent.mutate(payload);
    }
  };

  const ContentFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label-text">Title *</label>
          <input {...register('title', { required: 'Required' })} type="text" className="input-field" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label-text">Description</label>
          <textarea {...register('description')} rows={3} className="input-field resize-none" />
        </div>
        <div>
          <label className="label-text">Category *</label>
          <select {...register('category', { required: 'Required' })} className="input-field">
            <option value="">Select...</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className="label-text">Type *</label>
          <select {...register('type')} className="input-field">
            {['programa', 'database', 'material', 'esquema', 'video', 'outro'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">Minimum Level</label>
          <select {...register('minLevel')} className="input-field">
            {['iniciante', 'intermediario', 'avancado', 'elite'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">External Link</label>
          <input {...register('externalLink')} type="url" placeholder="https://..." className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="label-text">Tags (comma-separated)</label>
          <input {...register('tags')} type="text" placeholder="tag1, tag2, tag3" className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('isDrop')} type="checkbox" className="w-4 h-4 accent-yellow-400" />
            <span className="label-text mb-0">This is a Drop (time-limited)</span>
          </label>
        </div>
        <div className="col-span-2">
          <label className="label-text">Drop Expiration Date</label>
          <input {...register('dropExpiresAt')} type="datetime-local" className="input-field" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Content Management</h1>
          <p className="text-gray-500 text-sm">{pagination?.total || 0} items</p>
        </div>
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Content
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search content..."
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Content</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Level</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Stats</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Date</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
                ))
              ) : contents.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 text-sm">No content found</td></tr>
              ) : (
                contents.map((item) => {
                  const cat = typeof item.category === 'object' ? item.category : null;
                  return (
                    <tr key={item._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getContentTypeIcon(item.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-200 max-w-xs truncate">{item.title}</p>
                            {cat && <p className="text-xs text-gray-500">{cat.name}</p>}
                            {item.isDrop && (
                              <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1.5 rounded">DROP</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{getContentTypeLabel(item.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <LevelBadge level={item.minLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500">
                          <span>👁 {item.views}</span>
                          <span className="ml-2">⬇ {item.downloads}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteModal({ open: true, id: item._id })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800/40 flex items-center justify-between">
            <p className="text-xs text-gray-500">{(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-xs">Previous</button>
              <span className="text-xs text-gray-500">{page}/{pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || editModal.open}
        onClose={() => { setIsCreating(false); setEditModal({ open: false, content: null }); resetForm(); }}
        title={editModal.content ? 'Edit Content' : 'New Content'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ContentFormFields />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setIsCreating(false); setEditModal({ open: false, content: null }); resetForm(); }} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createContent.isPending || updateContent.isPending} className="btn-primary flex items-center gap-2">
              {(createContent.isPending || updateContent.isPending) && (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              )}
              {editModal.content ? 'Save Changes' : 'Create Content'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteContent.mutate(deleteModal.id!)}
        title="Delete Content"
        description="Are you sure? This will deactivate the content."
        confirmText="Delete"
        isLoading={deleteContent.isPending}
      />
    </div>
  );
}
