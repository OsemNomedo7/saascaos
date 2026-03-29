'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, FolderOpen, X } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { Category } from '@/types';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

// Emoji groups for the icon picker
const EMOJI_GROUPS = [
  {
    label: 'Tech & Segurança',
    emojis: ['💻','🖥️','📱','⌨️','🖱️','🔒','🔓','🛡️','⚔️','🗡️','💀','☠️','👾','🤖','🧠','⚡','🔐','🕵️','🦠','💣'],
  },
  {
    label: 'Dados & Arquivos',
    emojis: ['💾','📀','🗄️','📁','📂','🗃️','📊','📈','📉','🔬','🔭','📡','🌐','🕸️','💡','⚗️','🧬','🔧','🔩','⚙️'],
  },
  {
    label: 'Mídia & Conteúdo',
    emojis: ['🎬','🎥','📹','📷','🎵','🎙️','📻','📺','🎮','🕹️','📖','📝','📄','📋','🗒️','📰','🏴','🚀','🎯','💯'],
  },
  {
    label: 'Pessoas & Ação',
    emojis: ['👤','👥','🧑‍💻','👨‍🔬','🥷','🦹','🧑‍🎓','🏆','🥇','🎖️','🔑','🗝️','🔎','👁️','👀','✅','❌','⚠️','🚫','💥'],
  },
];

function EmojiPickerField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Preview + open button */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            width: 48, height: 48, borderRadius: 8, flexShrink: 0,
            background: open ? 'rgba(0,150,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${open ? 'rgba(0,150,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            fontSize: '1.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          title="Escolher ícone"
        >
          {value || '📁'}
        </button>
        {/* Manual input for custom emoji */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Clique no botão ou cole um emoji"
            style={{
              width: '100%', padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: '#c0d8e8',
              ...mono, fontSize: '0.72rem', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ ...mono, fontSize: '0.55rem', color: '#6a8898', marginTop: 3 }}>
            Clique no botão para escolher ou cole diretamente um emoji
          </p>
        </div>
      </div>

      {/* Picker dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 50,
          background: '#060d18', border: '1px solid rgba(0,150,255,0.2)',
          borderRadius: 10, padding: 14, width: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ ...mono, fontSize: '0.6rem', color: '#00d4ff', letterSpacing: '0.15em' }}>ESCOLHER ÍCONE</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a8898', padding: 2 }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
          {EMOJI_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 12 }}>
              <p style={{ ...mono, fontSize: '0.55rem', color: '#6a8898', letterSpacing: '0.12em', marginBottom: 5 }}>
                {group.label.toUpperCase()}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {group.emojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { onChange(emoji); setOpen(false); }}
                    style={{
                      width: 34, height: 34, fontSize: '1.2rem',
                      background: value === emoji ? 'rgba(0,150,255,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${value === emoji ? 'rgba(0,150,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 6, cursor: 'pointer', transition: 'all 0.1s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,150,255,0.12)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = value === emoji ? 'rgba(0,150,255,0.2)' : 'rgba(255,255,255,0.03)'; }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isCreating, setIsCreating] = useState(false);
  const [iconValue, setIconValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const createCategory = useMutation({
    mutationFn: (data: object) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreating(false);
      reset();
      setIconValue('');
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => categoriesApi.update(id, data),
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryForm>({
    defaultValues: { color: '#00d4ff', order: 0 },
  });

  const watchedColor = watch('color', '#00d4ff');
  const categories: Category[] = data?.categories || [];

  const openEdit = (cat: Category) => {
    setEditModal({ open: true, category: cat });
    setValue('name', cat.name);
    setValue('description', cat.description);
    setValue('icon', cat.icon);
    setValue('color', cat.color);
    setValue('order', cat.order);
    setIconValue(cat.icon || '');
  };

  const onSubmit = (formData: CategoryForm) => {
    const payload = { ...formData, icon: iconValue || formData.icon };
    if (editModal.category) {
      updateCategory.mutate({ id: editModal.category._id, data: payload });
    } else {
      createCategory.mutate(payload);
    }
  };

  const isEmoji = (str: string) => {
    // rough check: if it's a single short string that looks like an emoji vs a word
    return str && str.length <= 4 && /\p{Emoji}/u.test(str);
  };

  const renderFormFields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', display: 'block', marginBottom: 5 }}>NOME *</label>
        <input
          {...register('name', { required: 'Obrigatório' })}
          type="text"
          placeholder="Nome da categoria"
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#c0d8e8', ...mono, fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
        />
        {errors.name && <p style={{ ...mono, fontSize: '0.6rem', color: '#ff4455', marginTop: 3 }}>{errors.name.message}</p>}
      </div>

      <div>
        <label style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', display: 'block', marginBottom: 5 }}>DESCRIÇÃO</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Descrição breve da categoria"
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#c0d8e8', ...mono, fontSize: '0.75rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', display: 'block', marginBottom: 5 }}>ÍCONE</label>
        <EmojiPickerField value={iconValue} onChange={v => { setIconValue(v); setValue('icon', v); }} />
      </div>

      <div>
        <label style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', display: 'block', marginBottom: 5 }}>COR</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            {...register('color')}
            type="color"
            style={{ width: 40, height: 40, borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: 3, boxSizing: 'border-box' }}
          />
          <input
            {...register('color')}
            type="text"
            placeholder="#00d4ff"
            style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: watchedColor, ...mono, fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ width: 36, height: 36, borderRadius: 6, background: watchedColor, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
        </div>
      </div>

      <div>
        <label style={{ ...mono, fontSize: '0.62rem', color: '#a8c4d4', display: 'block', marginBottom: 5 }}>ORDEM DE EXIBIÇÃO</label>
        <input
          {...register('order', { valueAsNumber: true })}
          type="number"
          style={{ width: 80, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#c0d8e8', ...mono, fontSize: '0.75rem', outline: 'none' }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', margin: '0 0 4px' }}>{'// CATEGORIAS'}</h1>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#6a8898' }}>{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); reset(); setIconValue(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,150,255,0.3)', borderRadius: 6, cursor: 'pointer', ...mono, fontSize: '0.65rem', color: '#00d4ff', fontWeight: 700 }}
        >
          <Plus style={{ width: 13, height: 13 }} /> NOVA CATEGORIA
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 130, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
          <FolderOpen style={{ width: 36, height: 36, color: '#1a3a55', margin: '0 auto 10px' }} />
          <p style={{ ...mono, fontSize: '0.72rem', color: '#6a8898' }}>Nenhuma categoria ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              style={{
                background: '#060d18',
                border: `1px solid ${cat.color}28`,
                borderRadius: 10, padding: '16px',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cat.color}66, transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isEmoji(cat.icon) ? '1.4rem' : '0.6rem',
                  color: cat.color,
                }}>
                  {isEmoji(cat.icon) ? cat.icon : (cat.icon ? '📁' : '📁')}
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button
                    onClick={() => openEdit(cat)}
                    style={{ padding: '5px 6px', background: 'rgba(0,150,255,0.08)', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', color: '#6a8898' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#00d4ff')}
                    onMouseOut={e => (e.currentTarget.style.color = '#6a8898')}
                  >
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, id: cat._id })}
                    style={{ padding: '5px 6px', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 4, cursor: 'pointer', color: '#6a8898' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#ff4455')}
                    onMouseOut={e => (e.currentTarget.style.color = '#6a8898')}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <p style={{ ...mono, fontSize: '0.78rem', fontWeight: 700, color: '#c0d8e8', margin: '0 0 4px' }}>{cat.name}</p>
              <p style={{ fontSize: '0.65rem', color: '#6a8898', margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {cat.description || 'Sem descrição'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, boxShadow: `0 0 6px ${cat.color}88` }} />
                <span style={{ ...mono, fontSize: '0.55rem', color: '#6a8898' }}>{cat.color}</span>
                <span style={{ ...mono, fontSize: '0.55rem', color: '#6a8898', marginLeft: 'auto' }}>/{cat.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || editModal.open}
        onClose={() => { setIsCreating(false); setEditModal({ open: false, category: null }); reset(); setIconValue(''); }}
        title={editModal.category ? 'Editar Categoria' : 'Nova Categoria'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderFormFields()}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditModal({ open: false, category: null }); reset(); setIconValue(''); }}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', ...mono, fontSize: '0.65rem', color: '#8aabbb' }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
              style={{ padding: '8px 18px', background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,150,255,0.35)', borderRadius: 6, cursor: 'pointer', ...mono, fontSize: '0.65rem', color: '#00d4ff', fontWeight: 700, opacity: (createCategory.isPending || updateCategory.isPending) ? 0.6 : 1 }}
            >
              {(createCategory.isPending || updateCategory.isPending) ? 'SALVANDO...' : (editModal.category ? 'SALVAR' : 'CRIAR')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteCategory.mutate(deleteModal.id!)}
        title="Deletar Categoria"
        description="Tem certeza? Isso irá desativar a categoria."
        confirmText="Deletar"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}
