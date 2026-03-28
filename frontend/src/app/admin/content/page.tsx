'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Plus, Edit2, Trash2, Search, Upload, X, File,
  FileText, Film, Database, Package, Code, AlertCircle, CheckCircle2,
  Eye, Download, Image as ImageIcon
} from 'lucide-react';
import { contentApi, categoriesApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { getContentTypeIcon, getContentTypeLabel, formatDate, formatBytes } from '@/lib/utils';
import type { Content, Category, ContentType, UserLevel } from '@/types';

interface ContentForm {
  title: string;
  description: string;
  category: string;
  type: ContentType;
  minLevel: UserLevel;
  externalLink: string;
  tags: string;
  isFree: boolean;
  isDrop: boolean;
  dropExpiresAt: string;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['exe', 'msi', 'app', 'dmg', 'deb', 'rpm'].includes(ext)) return <Package className="w-5 h-5" style={{ color: '#00d4ff' }} />;
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5" style={{ color: '#ff6644' }} />;
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return <Film className="w-5 h-5" style={{ color: '#cc66ff' }} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Database className="w-5 h-5" style={{ color: '#ffcc00' }} />;
  if (['py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go'].includes(ext)) return <Code className="w-5 h-5" style={{ color: '#00ff41' }} />;
  return <File className="w-5 h-5" style={{ color: '#4d8c5a' }} />;
}

function FileUploadZone({
  selectedFile,
  existingFileUrl,
  existingFileName,
  isUploading,
  uploadProgress,
  uploadError,
  onFileSelect,
  onClear,
}: {
  selectedFile: File | null;
  existingFileUrl?: string | null;
  existingFileName?: string | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div>
      <label className="label-text" style={{ marginBottom: 8, display: 'block' }}>
        ARQUIVO PARA DOWNLOAD
      </label>

      {/* Existing file */}
      {existingFileUrl && !selectedFile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 8,
          background: 'rgba(0,212,255,0.06)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 4,
        }}>
          <File className="w-4 h-4" style={{ color: '#00d4ff', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Arquivo atual
            </p>
            <a href={existingFileUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.62rem', color: '#2a6890', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <Download className="w-2.5 h-2.5" /> Ver arquivo
            </a>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: '0.62rem', color: '#00a828', background: 'rgba(0,255,65,0.08)',
              border: '1px solid rgba(0,255,65,0.2)', borderRadius: 3,
              padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.06em',
            }}>
            SUBSTITUIR
          </button>
        </div>
      )}

      {/* Selected new file */}
      {selectedFile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 8,
          background: 'rgba(0,255,65,0.06)',
          border: '1px solid rgba(0,255,65,0.25)',
          borderRadius: 4,
        }}>
          {getFileIcon(selectedFile.name)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.75rem', color: '#a0c8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: '0.62rem', color: '#2a4d30', marginTop: 1 }}>
              {formatBytes(selectedFile.size)}
            </p>
          </div>
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 80 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12,
                  border: '1.5px solid #00ff41',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                <span style={{ fontSize: '0.62rem', color: '#00a828' }}>{uploadProgress}%</span>
              </div>
              <div style={{ width: 80, height: 3, background: 'rgba(0,255,65,0.1)', borderRadius: 2 }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#00ff41', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </div>
          ) : (
            <button type="button" onClick={onClear}
              style={{ color: '#2a4d30', background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'color 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.color = '#ff0040')}
              onMouseOut={e => (e.currentTarget.style.color = '#2a4d30')}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
      {!selectedFile && (
        <div
          style={{
            border: `2px dashed ${isDragging ? 'rgba(0,255,65,0.5)' : 'rgba(0,255,65,0.15)'}`,
            borderRadius: 5,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
            background: isDragging ? 'rgba(0,255,65,0.05)' : 'transparent',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.3)')}
          onMouseOut={e => !isDragging && (e.currentTarget.style.borderColor = 'rgba(0,255,65,0.15)')}
        >
          <Upload className="w-7 h-7" style={{ color: '#2a4d30', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.78rem', color: '#4d8c5a', marginBottom: 4 }}>
            Clique ou arraste um arquivo aqui
          </p>
          <p style={{ fontSize: '0.65rem', color: '#1a3020', lineHeight: 1.5 }}>
            Programas (.exe, .msi), PDFs, ZIPs, Vídeos, Scripts, qualquer formato — máx. 5GB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])}
      />

      {uploadError && (
        <div style={{
          marginTop: 6, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.7rem', color: '#ff6080',
        }}>
          <AlertCircle className="w-3.5 h-3.5" />
          {uploadError}
        </div>
      )}
    </div>
  );
}

export default function AdminContentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editModal, setEditModal] = useState<{ open: boolean; content: Content | null }>({ open: false, content: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isCreating, setIsCreating] = useState(false);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedFile(null);
      setUploadError('');
      setSelectedImages([]);
      setUploadedImageUrls([]);
      setImageUploadError('');
    },
  });

  const updateContent = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => contentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setEditModal({ open: false, content: null });
      setSelectedFile(null);
      setUploadError('');
      setSelectedImages([]);
      setUploadedImageUrls([]);
      setImageUploadError('');
    },
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => contentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      setDeleteModal({ open: false, id: null });
    },
  });

  const { register, handleSubmit, reset: resetForm, setValue, watch, formState: { errors } } = useForm<ContentForm>({
    defaultValues: { type: 'material', minLevel: 'iniciante', isFree: false },
  });
  const isDrop = watch('isDrop');

  const contents: Content[] = data?.contents || [];
  const pagination = data?.pagination;
  const categories: Category[] = catData?.categories || [];

  const openEditModal = (content: Content) => {
    setEditModal({ open: true, content });
    setSelectedFile(null);
    setUploadError('');
    setSelectedImages([]);
    setUploadedImageUrls(content.images || []);
    setImageUploadError('');
    const cat = typeof content.category === 'object' ? content.category._id : content.category;
    setValue('title', content.title);
    setValue('description', content.description);
    setValue('category', cat);
    setValue('type', content.type);
    setValue('minLevel', content.minLevel);
    setValue('externalLink', content.externalLink || '');
    setValue('tags', content.tags?.join(', ') || '');
    setValue('isFree', content.isFree || false);
    setValue('isDrop', content.isDrop);
    setValue('dropExpiresAt', content.dropExpiresAt?.slice(0, 16) || '');
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditModal({ open: false, content: null });
    setSelectedFile(null);
    setUploadError('');
    setSelectedImages([]);
    setUploadedImageUrls([]);
    setImageUploadError('');
    resetForm();
  };

  const onSubmit = async (data: ContentForm) => {
    setUploadError('');
    setImageUploadError('');
    let filePayload: Record<string, unknown> = {};
    let newImageUrls: string[] = [...uploadedImageUrls];

    // Upload file first if selected
    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        // Tenta upload direto no R2 via presigned URL (sem passar pelo servidor)
        let presignOk = false;
        try {
          const presignRes = await contentApi.presignUpload(
            selectedFile.name,
            selectedFile.type || 'application/octet-stream'
          );
          const { uploadUrl, fileKey, publicUrl } = presignRes.data;

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (e) => {
              if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`R2 retornou ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error('Erro de rede'));
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', selectedFile.type || 'application/octet-stream');
            xhr.send(selectedFile);
          });

          filePayload = { fileUrl: publicUrl, fileKey, fileSize: selectedFile.size, mimeType: selectedFile.type };
          presignOk = true;
        } catch (presignErr) {
          console.warn('[upload] Presign falhou, tentando via servidor:', presignErr);
        }

        // Fallback: upload via servidor (para quando R2 não está configurado)
        if (!presignOk) {
          setUploadProgress(0);
          const formData = new FormData();
          formData.append('file', selectedFile);
          const uploadRes = await contentApi.upload(formData, setUploadProgress);
          filePayload = {
            fileUrl: uploadRes.data.fileUrl,
            fileKey: uploadRes.data.fileKey,
            fileSize: uploadRes.data.fileSize,
            mimeType: uploadRes.data.mimeType,
          };
        }
      } catch {
        setUploadError('Falha no upload. Verifique se o R2 está configurado ou tente um arquivo menor.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Upload new images if any
    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        const uploadedUrls: string[] = [];
        for (const img of selectedImages) {
          const formData = new FormData();
          formData.append('image', img);
          const res = await contentApi.uploadImage(formData);
          uploadedUrls.push(res.data.imageUrl);
        }
        newImageUrls = [...newImageUrls, ...uploadedUrls];
      } catch {
        setImageUploadError('Falha no upload de imagens. Tente novamente.');
        setIsUploadingImages(false);
        return;
      }
      setIsUploadingImages(false);
    }

    const payload = {
      ...data,
      ...filePayload,
      images: newImageUrls,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      dropExpiresAt: data.isDrop && data.dropExpiresAt ? new Date(data.dropExpiresAt).toISOString() : null,
    };

    if (editModal.content) {
      updateContent.mutate({ id: editModal.content._id, data: payload });
    } else {
      createContent.mutate(payload);
    }
  };

  const isSubmitting = isUploading || isUploadingImages || createContent.isPending || updateContent.isPending;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-5">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c08060', letterSpacing: '0.08em' }}>
            GERENCIAR CONTEÚDO
          </h1>
          <p style={{ fontSize: '0.7rem', color: '#3a1800', marginTop: 2 }}>
            {pagination?.total || 0} arquivos no sistema
          </p>
        </div>
        <button
          onClick={() => { setIsCreating(true); resetForm(); setSelectedFile(null); setUploadError(''); setSelectedImages([]); setUploadedImageUrls([]); setImageUploadError(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'rgba(255,68,0,0.1)',
            border: '1px solid rgba(255,68,0,0.35)',
            borderRadius: 4,
            color: '#ff4400',
            fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,68,0,0.18)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,68,0,0.1)')}
        >
          <Plus className="w-3.5 h-3.5" /> NOVO CONTEÚDO
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#3a1800', pointerEvents: 'none' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="// buscar conteúdo..."
          className="input-field"
          style={{ paddingLeft: 34, fontSize: '0.78rem' }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(8,8,8,0.9)',
        border: '1px solid rgba(255,68,0,0.12)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-hack" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>CONTEÚDO</th>
                <th>TIPO</th>
                <th>NÍVEL</th>
                <th>ARQUIVO</th>
                <th>STATS</th>
                <th>DATA</th>
                <th style={{ textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div className="skeleton" style={{ height: 18, borderRadius: 3 }} />
                    </td>
                  </tr>
                ))
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#3a1800', fontSize: '0.8rem' }}>
                    Nenhum conteúdo encontrado
                  </td>
                </tr>
              ) : (
                contents.map((item) => {
                  const cat = typeof item.category === 'object' ? item.category : null;
                  return (
                    <tr key={item._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.1rem' }}>{getContentTypeIcon(item.type)}</span>
                          <div>
                            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c0a890', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                              {cat && <span style={{ fontSize: '0.6rem', color: '#5a3a2a' }}>{cat.name}</span>}
                              {item.isFree && (
                                <span style={{
                                  fontSize: '0.58rem', color: '#00ff41',
                                  background: 'rgba(0,255,65,0.08)',
                                  border: '1px solid rgba(0,255,65,0.2)',
                                  borderRadius: 2, padding: '1px 5px', letterSpacing: '0.08em',
                                }}>FREE</span>
                              )}
                              {item.isDrop && (
                                <span style={{
                                  fontSize: '0.58rem', color: '#ffcc00',
                                  background: 'rgba(255,204,0,0.1)',
                                  border: '1px solid rgba(255,204,0,0.2)',
                                  borderRadius: 2, padding: '1px 5px', letterSpacing: '0.08em',
                                }}>DROP</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', color: '#5a3a2a' }}>{getContentTypeLabel(item.type)}</span>
                      </td>
                      <td><LevelBadge level={item.minLevel} /></td>
                      <td>
                        {item.fileUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#00a828' }} />
                            <span style={{ fontSize: '0.62rem', color: '#2a4d30' }}>
                              {item.fileSize > 0 ? formatBytes(item.fileSize) : 'Arquivo'}
                            </span>
                          </div>
                        ) : item.externalLink ? (
                          <span style={{ fontSize: '0.62rem', color: '#2a6890' }}>Link externo</span>
                        ) : (
                          <span style={{ fontSize: '0.62rem', color: '#3a3a3a' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.65rem', color: '#3a3a3a', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Eye className="w-3 h-3" /> {item.views}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Download className="w-3 h-3" /> {item.downloads}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.65rem', color: '#3a3a3a' }}>{formatDate(item.createdAt)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            onClick={() => openEditModal(item)}
                            style={{ padding: 6, color: '#3a3a3a', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3, transition: 'all 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: item._id })}
                            style={{ padding: 6, color: '#3a3a3a', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3, transition: 'all 0.15s' }}
                            onMouseOver={e => { e.currentTarget.style.color = '#ff0040'; e.currentTarget.style.background = 'rgba(255,0,64,0.08)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.background = 'none'; }}
                          >
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
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,68,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: '0.65rem', color: '#3a1800' }}>
              {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} de {pagination.total}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                Anterior
              </button>
              <span style={{ fontSize: '0.7rem', color: '#3a1800' }}>{page}/{pagination.pages}</span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || editModal.open}
        onClose={closeModal}
        title={editModal.content ? 'Editar Conteúdo' : 'Novo Conteúdo'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label-text">TÍTULO *</label>
              <input {...register('title', { required: 'Obrigatório' })} type="text" className="input-field" placeholder="Nome do conteúdo" />
              {errors.title && <p style={{ color: '#ff6080', fontSize: '0.7rem', marginTop: 4 }}>{errors.title.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="label-text">DESCRIÇÃO</label>
              <textarea {...register('description')} rows={3} className="input-field" style={{ resize: 'none' }} placeholder="Descreva o conteúdo..." />
            </div>

            <div>
              <label className="label-text">CATEGORIA *</label>
              <select {...register('category', { required: 'Obrigatório' })} className="input-field">
                <option value="">Selecionar...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p style={{ color: '#ff6080', fontSize: '0.7rem', marginTop: 4 }}>{errors.category.message}</p>}
            </div>

            <div>
              <label className="label-text">TIPO *</label>
              <select {...register('type')} className="input-field">
                {['programa', 'database', 'material', 'esquema', 'video', 'outro'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">NÍVEL MÍNIMO</label>
              <select {...register('minLevel')} className="input-field">
                {['iniciante', 'intermediario', 'avancado', 'elite'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">LINK EXTERNO</label>
              <input {...register('externalLink')} type="url" placeholder="https://..." className="input-field" />
            </div>

            <div className="col-span-2">
              <label className="label-text">TAGS (separadas por vírgula)</label>
              <input {...register('tags')} type="text" placeholder="tag1, tag2, tag3" className="input-field" />
            </div>

            {/* File Upload Zone */}
            <div className="col-span-2">
              <FileUploadZone
                selectedFile={selectedFile}
                existingFileUrl={editModal.content?.fileUrl}
                existingFileName={editModal.content?.fileKey}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                onFileSelect={(file) => { setSelectedFile(file); setUploadError(''); }}
                onClear={() => { setSelectedFile(null); setUploadError(''); }}
              />
            </div>

            {/* Image Upload Section */}
            <div className="col-span-2">
              <label className="label-text" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon className="w-3.5 h-3.5" style={{ color: '#cc66ff' }} />
                IMAGENS DO CONTEÚDO (carrossel)
              </label>

              {/* Existing uploaded images */}
              {uploadedImageUrls.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {uploadedImageUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 60 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(204,102,255,0.2)' }} />
                      <button
                        type="button"
                        onClick={() => setUploadedImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{
                          position: 'absolute', top: -6, right: -6, width: 16, height: 16,
                          background: '#ff0040', border: 'none', borderRadius: '50%',
                          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New images to upload */}
              {selectedImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {selectedImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 60 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(img)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(0,255,65,0.25)' }} />
                      {!isUploadingImages && (
                        <button
                          type="button"
                          onClick={() => setSelectedImages((prev) => prev.filter((_, idx) => idx !== i))}
                          style={{
                            position: 'absolute', top: -6, right: -6, width: 16, height: 16,
                            background: '#ff0040', border: 'none', borderRadius: '50%',
                            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                          }}
                        >
                          <X style={{ width: 10, height: 10 }} />
                        </button>
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 3,
                        background: 'rgba(0,255,65,0.1)',
                        border: '1px dashed rgba(0,255,65,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.5rem', color: '#00ff41', fontFamily: 'JetBrains Mono, monospace' }}>NOVO</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImages}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 4, cursor: isUploadingImages ? 'not-allowed' : 'pointer',
                  background: 'rgba(204,102,255,0.06)', border: '1px dashed rgba(204,102,255,0.25)',
                  color: '#cc66ff', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                  opacity: isUploadingImages ? 0.6 : 1,
                }}
              >
                {isUploadingImages ? (
                  <>
                    <div style={{ width: 12, height: 12, border: '1.5px solid #cc66ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    ENVIANDO IMAGENS...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    ADICIONAR IMAGENS
                  </>
                )}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedImages((prev) => [...prev, ...Array.from(e.target.files!)]);
                    setImageUploadError('');
                  }
                }}
              />

              {imageUploadError && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#ff6080' }}>
                  <AlertCircle className="w-3.5 h-3.5" /> {imageUploadError}
                </div>
              )}
              <p style={{ fontSize: '0.6rem', color: '#1a3020', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                Aceita JPG, PNG, GIF, WebP — primeira imagem será o thumbnail principal
              </p>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input {...register('isFree')} type="checkbox"
                  style={{ width: 14, height: 14, accentColor: '#00ff41', cursor: 'pointer' }} />
                <span className="label-text" style={{ marginBottom: 0 }}>
                  Conteúdo Gratuito (plano free)
                </span>
              </label>
              <p style={{ fontSize: '0.6rem', color: '#1a3020', fontFamily: 'JetBrains Mono, monospace', margin: '3px 0 0 22px' }}>
                Qualquer usuário pode baixar sem assinatura
              </p>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input {...register('isDrop')} type="checkbox"
                  style={{ width: 14, height: 14, accentColor: '#ffcc00', cursor: 'pointer' }} />
                <span className="label-text" style={{ marginBottom: 0 }}>
                  É um Drop (conteúdo por tempo limitado)
                </span>
              </label>
            </div>

            {isDrop && (
              <div className="col-span-2">
                <label className="label-text">DATA DE EXPIRAÇÃO DO DROP</label>
                <input {...register('dropExpiresAt')} type="datetime-local" className="input-field" />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(0,255,65,0.1)' }}>
            <button type="button" onClick={closeModal} className="btn-secondary">
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px',
                background: isSubmitting ? 'rgba(255,68,0,0.05)' : 'rgba(255,68,0,0.1)',
                border: '1px solid rgba(255,68,0,0.35)',
                borderRadius: 4,
                color: '#ff4400',
                fontSize: '0.75rem', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              {isSubmitting && (
                <div style={{
                  width: 13, height: 13,
                  border: '1.5px solid #ff4400',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              {isUploading ? 'ENVIANDO ARQUIVO...' : isUploadingImages ? 'ENVIANDO IMAGENS...' : editModal.content ? 'SALVAR' : 'CRIAR'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteContent.mutate(deleteModal.id!)}
        title="Deletar Conteúdo"
        description="Tem certeza? O conteúdo será desativado do sistema."
        confirmText="Deletar"
        isLoading={deleteContent.isPending}
      />
    </div>
  );
}
