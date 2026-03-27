'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const createCategory = useMutation({
    mutationFn: (data: Record<string, unknown>) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreating(false);
      reset();
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditModal({ open: false, category: null });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ open: false, id: null });
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryForm>({
    defaultValues: { color: '#22c55e', order: 0 },
  });

  const categories: Category[] = data?.categories || [];

  const openEdit = (cat: Category) => {
    setEditModal({ open: true, category: cat });
    setValue('name', cat.name);
    setValue('description', cat.description);
    setValue('icon', cat.icon);
    setValue('color', cat.color);
    setValue('order', cat.order);
  };

  const onSubmit = (formData: CategoryForm) => {
    if (editModal.category) {
      updateCategory.mutate({ id: editModal.category._id, data: formData });
    } else {
      createCategory.mutate(formData);
    }
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="label-text">Name *</label>
        <input {...register('name', { required: 'Required' })} type="text" className="input-field" placeholder="Category name" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label-text">Description</label>
        <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Brief description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text">Icon (emoji or text)</label>
          <input {...register('icon')} type="text" className="input-field" placeholder="📁 or folder" />
        </div>
        <div>
          <label className="label-text">Color (hex)</label>
          <div className="flex gap-2">
            <input {...register('color')} type="color" className="w-10 h-10 rounded cursor-pointer bg-gray-800 border border-gray-700 p-1" />
            <input {...register('color')} type="text" className="input-field flex-1" placeholder="#22c55e" />
          </div>
        </div>
      </div>
      <div>
        <label className="label-text">Display Order</label>
        <input {...register('order', { valueAsNumber: true })} type="number" className="input-field w-24" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Categories Management</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={() => { setIsCreating(true); reset(); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* Categories grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50">
          <FolderOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-gray-900/80 border rounded-xl p-4 transition-all"
              style={{ borderColor: `${cat.color}30` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                >
                  {cat.icon || '📁'}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, id: cat._id })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-200 mb-0.5">{cat.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{cat.description || 'No description'}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600">/{cat.slug}</span>
                <span className="ml-auto text-gray-600">Order: {cat.order}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || editModal.open}
        onClose={() => { setIsCreating(false); setEditModal({ open: false, category: null }); reset(); }}
        title={editModal.category ? 'Edit Category' : 'New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormFields />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setIsCreating(false); setEditModal({ open: false, category: null }); reset(); }} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className="btn-primary flex items-center gap-2">
              {(createCategory.isPending || updateCategory.isPending) && (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              )}
              {editModal.category ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteCategory.mutate(deleteModal.id!)}
        title="Delete Category"
        description="Are you sure? This will deactivate the category."
        confirmText="Delete"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
