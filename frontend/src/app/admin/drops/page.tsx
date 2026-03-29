'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Plus, Edit2, Trash2, Search, Upload, X, File,
  FileText, Film, Database, Package, Code, AlertCircle,
  Eye, Download, Image as ImageIcon, Zap, Clock,
} from 'lucide-react';
import { contentApi, categoriesApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { getContentTypeIcon, getContentTypeLabel, formatDate, formatBytes, getCountdown } from '@/lib/utils';
import type { Content, Category, ContentType, UserLevel } from '@/types';

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

interface DropForm {
  title: string;
  description: string;
  category: string;
  type: ContentType;
  minLevel: UserLevel;
  externalLink: string;
  tags: string;
  isFree: boolean;
  dropExpiresAt: string;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['exe','msi','app','dmg','deb','rpm'].includes(ext)) return <Package className="w-5 h-5" style={{ color: '#00d4ff' }} />;
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5" style={{ color: '#ff6644' }} />;
  if (['mp4','mkv','avi','mov','webm'].includes(ext)) return <Film className="w-5 h-5" style={{ color: '#cc66ff' }} />;
  if (['zip','rar','7z','tar','gz'].includes(ext)) return <Database className="w-5 h-5" style={{ color: '#ffcc00' }} />;
  if (['py','js','ts','java','cpp','c','cs','php','rb','go'].includes(ext)) return <Code className="w-5 h-5" style={{ color: '#00ff41' }} />;
  return <File className="w-5 h-5" style={{ color: '#4d8c5a' }} />;
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <span style={{ ...mono, fontSize: '0.6rem', color: '#6a8898' }}>—</span>;
  const cd = getCountdown(expiresAt);
  if (cd.expired) return (
    <span style={{ ...mono, fontSize: '0.6rem', color: '#ff4455', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 3, padding: '1px 6px' }}>
      EXPIRADO
    </span>
  );
  const urgent = cd.hours === 0 && cd.minutes < 60;
  return (
    <span style={{ ...mono, fontSize: '0.6rem', color: urgent ? '#ff8833' : '#ffcc00', background: urgent ? 'rgba(255,136,50,0.08)' : 'rgba(255,204,0,0.06)', border: `1px solid ${urgent ? 'rgba(255,136,50,0.25)' : 'rgba(255,204,0,0.2)'}`, borderRadius: 3, padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <Clock style={{ width: 9, height: 9 }} />
      {String(cd.hours).padStart(2,'0')}:{String(cd.minutes).padStart(2,'0')}h
    </span>
  );
}

function FileUploadZone({ selectedFile, existingFileUrl, isUploading, uploadProgress, uploadError, onFileSelect, onClear }: {
  selectedFile: File | null; existingFileUrl?: string | null; existingFileName?: string | null;
  isUploading: boolean; uploadProgress: number; uploadError: string;
  onFileSelect: (f: File) => void; onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div>
      <label className="label-text" style={{ marginBottom: 8, display: 'block' }}>ARQUIVO PARA DOWNLOAD</label>
      {existingFileUrl && !selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4 }}>
          <File className="w-4 h-4" style={{ color: '#00d4ff', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', color: '#00d4ff' }}>Arquivo atual</p>
            <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.62rem', color: '#2a6890', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <Download className="w-2.5 h-2.5" /> Ver arquivo
            </a>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.62rem', color: '#00a828', background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}>SUBSTITUIR</button>
        </div>
      )}
      {selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.25)', borderRadius: 4 }}>
          {getFileIcon(selectedFile.name)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.75rem', color: '#a0c8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
            <p style={{ fontSize: '0.62rem', color: '#7aaa8a', marginTop: 1 }}>{formatBytes(selectedFile.size)}</p>
          </div>
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 80 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, border: '1.5px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.62rem', color: '#00a828' }}>{uploadProgress}%</span>
              </div>
              <div style={{ width: 80, height: 3, background: 'rgba(0,255,65,0.1)', borderRadius: 2 }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#00ff41', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </div>
          ) : (
            <button type="button" onClick={onClear} style={{ color: '#7aaa8a', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onMouseOver={e => (e.currentTarget.style.color = '#ff0040')} onMouseOut={e => (e.currentTarget.style.color = '#7aaa8a')}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {!selectedFile && (
        <div
          style={{ border: `2px dashed ${isDragging ? 'rgba(255,204,0,0.5)' : 'rgba(255,204,0,0.2)'}`, borderRadius: 5, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s', background: isDragging ? 'rgba(255,204,0,0.04)' : 'transparent' }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,204,0,0.4)')}
          onMouseOut={e => !isDragging && (e.currentTarget.style.borderColor = 'rgba(255,204,0,0.2)')}
        >
          <Upload className="w-7 h-7" style={{ color: '#8a7a30', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.78rem', color: '#7a6820', marginBottom: 4 }}>Clique ou arraste um arquivo aqui</p>
          <p style={{ fontSize: '0.65rem', color: '#5a5020', lineHeight: 1.5 }}>Qualquer formato — máx. 5GB</p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
      {uploadError && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#ff6080' }}>
          <AlertCircle className="w-3.5 h-3.5" />{uploadError}
        </div>
      )}
    </div>
  );
}

export default function AdminDropsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; content: Content | null }>({ open: false, content: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drops', { search, page }],
    queryFn: () => contentApi.list({ search: search || undefined, page, limit: 15, sort: '-createdAt', isDrop: true }).then(r => r.data),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  });

  const createDrop = useMutation({
    mutationFn: (data: object) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      queryClient.invalidateQueries({ queryKey: ['drops'] });
      setIsCreating(false); resetForm(); setSelectedFile(null); setUploadError('');
      setSelectedImages([]); setUploadedImageUrls([]); setImageUploadError('');
    },
  });

  const updateDrop = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => contentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      queryClient.invalidateQueries({ queryKey: ['drops'] });
      setEditModal({ open: false, content: null });
      setSelectedFile(null); setUploadError('');
      setSelectedImages([]); setUploadedImageUrls([]); setImageUploadError('');
    },
  });

  const deleteDrop = useMutation({
    mutationFn: (id: string) => contentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drops'] });
      queryClient.invalidateQueries({ queryKey: ['drops'] });
      setDeleteModal({ open: false, id: null });
    },
  });

  const { register, handleSubmit, reset: resetForm, setValue, formState: { errors } } = useForm<DropForm>({
    defaultValues: { type: 'outro', minLevel: 'iniciante', isFree: false },
  });

  const drops: Content[] = data?.contents || [];
  const pagination = data?.pagination;
  const categories: Category[] = catData?.categories || [];

  const openEdit = (item: Content) => {
    setEditModal({ open: true, content: item });
    setValue('title', item.title);
    setValue('description', item.description);
    setValue('category', typeof item.category === 'object' ? item.category._id : (item.category || ''));
    setValue('type', item.type);
    setValue('minLevel', item.minLevel);
    setValue('externalLink', item.externalLink || '');
    setValue('tags', item.tags?.join(', ') || '');
    setValue('isFree', item.isFree);
    setValue('dropExpiresAt', item.dropExpiresAt?.slice(0, 16) || '');
    setUploadedImageUrls(item.images || []);
    setSelectedImages([]);
  };

  const onSubmit = async (data: DropForm) => {
    let filePayload = {};
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await contentApi.upload(formData, (p: number) => setUploadProgress(p));
        filePayload = { fileUrl: res.data.fileUrl, fileKey: res.data.fileKey, fileSize: res.data.fileSize, mimeType: res.data.mimeType };
      } catch {
        setUploadError('Falha no upload do arquivo.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const newImageUrls = [...uploadedImageUrls];
    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        for (const img of selectedImages) {
          const formData = new FormData();
          formData.append('image', img);
          const res = await contentApi.uploadImage(formData);
          newImageUrls.push(res.data.imageUrl);
        }
      } catch {
        setImageUploadError('Falha no upload de imagens.');
        setIsUploadingImages(false);
        return;
      }
      setIsUploadingImages(false);
    }

    const payload = {
      ...data,
      ...filePayload,
      isDrop: true,
      images: newImageUrls,
      thumbnail: newImageUrls[0] || editModal.content?.thumbnail || null,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      dropExpiresAt: data.dropExpiresAt ? new Date(data.dropExpiresAt).toISOString() : null,
    };

    if (editModal.content) {
      updateDrop.mutate({ id: editModal.content._id, data: payload });
    } else {
      createDrop.mutate(payload);
    }
  };

  const isSubmitting = isUploading || isUploadingImages || createDrop.isPending || updateDrop.isPending;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-5">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Zap style={{ width: 16, height: 16, color: '#ffcc00' }} />
            <h1 style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#ffcc00', letterSpacing: '0.1em' }}>
              GERENCIAR DROPS
            </h1>
          </div>
          <p style={{ ...mono, fontSize: '0.65rem', color: '#6a8898', marginLeft: 24 }}>
            {pagination?.total || 0} drops no sistema (incluindo expirados)
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); resetForm(); setSelectedFile(null); setUploadError(''); setSelectedImages([]); setUploadedImageUrls([]); setImageUploadError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.35)', borderRadius: 4, color: '#ffcc00', ...mono, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,204,0,0.18)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,204,0,0.1)')}
        >
          <Plus className="w-3.5 h-3.5" /> NOVO DROP
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#6a8898', pointerEvents: 'none' }} />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="// buscar drops..." className="input-field" style={{ paddingLeft: 34, fontSize: '0.78rem' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,204,0,0.12)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-hack" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>CONTEÚDO</th>
                <th>TIPO</th>
                <th>NÍVEL</th>
                <th>EXPIRA EM</th>
                <th>STATS</th>
                <th>DATA</th>
                <th style={{ textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 18, borderRadius: 3 }} /></td></tr>
                ))
              ) : drops.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', ...mono, fontSize: '0.8rem', color: '#6a8898' }}>Nenhum drop encontrado</td></tr>
              ) : drops.map(item => {
                const cat = typeof item.category === 'object' ? item.category as Category : null;
                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail} alt="" style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(255,204,0,0.2)', flexShrink: 0 }} />
                        ) : (
                          <span style={{ fontSize: '1.1rem' }}>{getContentTypeIcon(item.type)}</span>
                        )}
                        <div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#b8d8e8', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                            {cat && <span style={{ fontSize: '0.6rem', color: '#7a9aaa' }}>{cat.name}</span>}
                            {item.isFree && <span style={{ fontSize: '0.58rem', color: '#00ff41', background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 2, padding: '1px 5px' }}>FREE</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><LevelBadge level={item.type as unknown as 'iniciante'} size="sm" /></td>
                    <td><LevelBadge level={item.minLevel} size="sm" /></td>
                    <td><ExpiryBadge expiresAt={item.dropExpiresAt || null} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...mono, fontSize: '0.65rem', color: '#7a9aaa' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye style={{ width: 10, height: 10 }} />{item.views}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Download style={{ width: 10, height: 10 }} />{item.downloads}</span>
                      </div>
                    </td>
                    <td style={{ ...mono, fontSize: '0.65rem', color: '#7a9aaa', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(item)} style={{ padding: '5px 6px', background: 'rgba(0,150,255,0.08)', border: '1px solid rgba(0,150,255,0.15)', borderRadius: 4, cursor: 'pointer', color: '#6a8898' }} onMouseOver={e => (e.currentTarget.style.color = '#00d4ff')} onMouseOut={e => (e.currentTarget.style.color = '#6a8898')}><Edit2 style={{ width: 13, height: 13 }} /></button>
                        <button onClick={() => setDeleteModal({ open: true, id: item._id })} style={{ padding: '5px 6px', background: 'rgba(255,0,0,0.06)', border: '1px solid rgba(255,0,0,0.15)', borderRadius: 4, cursor: 'pointer', color: '#6a8898' }} onMouseOver={e => (e.currentTarget.style.color = '#ff4455')} onMouseOut={e => (e.currentTarget.style.color = '#6a8898')}><Trash2 style={{ width: 13, height: 13 }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '5px 10px', ...mono, fontSize: '0.62rem', background: page === p ? 'rgba(255,204,0,0.15)' : 'rgba(255,204,0,0.05)', border: `1px solid ${page === p ? 'rgba(255,204,0,0.35)' : 'rgba(255,204,0,0.1)'}`, borderRadius: 4, cursor: 'pointer', color: page === p ? '#ffcc00' : '#7a9aaa' }}>{p}</button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || editModal.open}
        onClose={() => { setIsCreating(false); setEditModal({ open: false, content: null }); resetForm(); setSelectedFile(null); setSelectedImages([]); setUploadedImageUrls([]); }}
        title={editModal.content ? '⚡ Editar Drop' : '⚡ Novo Drop'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2">
              <label className="label-text">TÍTULO *</label>
              <input {...register('title', { required: 'Obrigatório' })} type="text" className="input-field" placeholder="Título do drop" />
              {errors.title && <p style={{ color: '#ff6080', fontSize: '0.7rem', marginTop: 4 }}>{errors.title.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="label-text">DESCRIÇÃO</label>
              <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Descrição do drop..." />
            </div>

            <div>
              <label className="label-text">CATEGORIA</label>
              <select {...register('category')} className="input-field">
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">TIPO *</label>
              <select {...register('type')} className="input-field">
                {['programa','database','material','esquema','video','outro'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">NÍVEL MÍNIMO</label>
              <select {...register('minLevel')} className="input-field">
                {['iniciante','intermediario','avancado','elite'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">EXPIRA EM *</label>
              <input {...register('dropExpiresAt', { required: 'Obrigatório para drops' })} type="datetime-local" className="input-field" />
              {errors.dropExpiresAt && <p style={{ color: '#ff6080', fontSize: '0.7rem', marginTop: 4 }}>{errors.dropExpiresAt.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="label-text">LINK EXTERNO</label>
              <input {...register('externalLink')} type="url" placeholder="https://..." className="input-field" />
            </div>

            <div className="col-span-2">
              <label className="label-text">TAGS (separadas por vírgula)</label>
              <input {...register('tags')} type="text" placeholder="tag1, tag2, tag3" className="input-field" />
            </div>

            {/* File upload */}
            <div className="col-span-2">
              <FileUploadZone
                selectedFile={selectedFile}
                existingFileUrl={editModal.content?.fileUrl}
                existingFileName={editModal.content?.fileKey}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                onFileSelect={f => { setSelectedFile(f); setUploadError(''); }}
                onClear={() => { setSelectedFile(null); setUploadError(''); }}
              />
            </div>

            {/* Image upload */}
            <div className="col-span-2">
              <label className="label-text" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon className="w-3.5 h-3.5" style={{ color: '#ffcc00' }} />
                THUMBNAIL / IMAGENS DO DROP
              </label>
              {uploadedImageUrls.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {uploadedImageUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 60 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(255,204,0,0.2)' }} />
                      <button type="button" onClick={() => setUploadedImageUrls(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, background: '#ff0040', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {selectedImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 60 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(img)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, border: '1px dashed rgba(255,204,0,0.4)' }} />
                      {!isUploadingImages && (
                        <button type="button" onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, background: '#ff0040', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X style={{ width: 10, height: 10 }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImages} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 4, cursor: isUploadingImages ? 'not-allowed' : 'pointer', background: 'rgba(255,204,0,0.06)', border: '1px dashed rgba(255,204,0,0.3)', color: '#ffcc00', fontSize: '0.68rem', ...mono, fontWeight: 700, opacity: isUploadingImages ? 0.6 : 1 }}>
                {isUploadingImages ? <><div style={{ width: 12, height: 12, border: '1.5px solid #ffcc00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />ENVIANDO...</> : <><Upload className="w-3.5 h-3.5" />ADICIONAR IMAGEM</>}
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) { setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]); setImageUploadError(''); }}} />
              {imageUploadError && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#ff6080' }}><AlertCircle className="w-3.5 h-3.5" />{imageUploadError}</div>}
              <p style={{ fontSize: '0.6rem', color: '#7a7a30', marginTop: 4, ...mono }}>A primeira imagem será usada como thumbnail no card do drop</p>
            </div>

            {/* isFree toggle */}
            <div className="col-span-2">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input {...register('isFree')} type="checkbox" style={{ width: 14, height: 14, accentColor: '#00ff41', cursor: 'pointer' }} />
                <span className="label-text" style={{ marginBottom: 0 }}>Drop Gratuito (disponível para todos os usuários, sem assinatura)</span>
              </label>
              <p style={{ fontSize: '0.6rem', color: '#7aaa8a', ...mono, margin: '3px 0 0 22px' }}>
                Se marcado, qualquer usuário logado pode baixar este drop sem precisar de assinatura ativa
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={() => { setIsCreating(false); setEditModal({ open: false, content: null }); resetForm(); setSelectedFile(null); setSelectedImages([]); setUploadedImageUrls([]); }} className="btn-secondary">CANCELAR</button>
            <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'rgba(255,204,0,0.15)', border: '1px solid rgba(255,204,0,0.4)', borderRadius: 4, cursor: isSubmitting ? 'not-allowed' : 'pointer', color: '#ffcc00', ...mono, fontSize: '0.72rem', fontWeight: 700, opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting && <div style={{ width: 12, height: 12, border: '1.5px solid #ffcc00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {editModal.content ? 'SALVAR DROP' : 'CRIAR DROP'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteDrop.mutate(deleteModal.id!)}
        title="Deletar Drop"
        description="Tem certeza? O drop será removido permanentemente."
        confirmText="Deletar"
        isLoading={deleteDrop.isPending}
      />
    </div>
  );
}
