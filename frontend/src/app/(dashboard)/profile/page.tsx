'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User, Calendar, Shield, Activity, CreditCard,
  Clock, Edit2, Save, X, Check, Twitter, Github,
  Instagram, Globe, ChevronRight, Zap, Camera, Image as ImageIcon,
  Copy, Users, DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, subscriptionsApi, profileApi, affiliatesApi } from '@/lib/api';
import { LevelBadge, PlanBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatRelativeDate, getInitials } from '@/lib/utils';
import type { Subscription, Log } from '@/types';
import Link from 'next/link';

interface EditForm {
  name: string;
  bio: string;
  twitter: string;
  github: string;
  instagram: string;
  website: string;
}

const LEVEL_XP: Record<string, { max: number; label: string; color: string }> = {
  iniciante:    { max: 100, label: 'INICIANTE', color: '#00ff41' },
  intermediario:{ max: 500, label: 'INTERMEDIÁRIO', color: '#00d4ff' },
  avancado:     { max: 2000, label: 'AVANÇADO', color: '#cc66ff' },
  elite:        { max: 9999, label: 'ELITE', color: '#ff4400' },
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ pixKey: '', pixKeyType: 'cpf', name: '', cpf: '', amount: '', notes: '' });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [bannerUploadError, setBannerUploadError] = useState('');

  const { register, handleSubmit, reset, watch } = useForm<EditForm>({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      instagram: user?.socialLinks?.instagram || '',
      website: user?.socialLinks?.website || '',
    },
  });

  const bioValue = watch('bio', user?.bio || '');

  const { data: subData } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionsApi.my().then((r) => r.data),
    enabled: !!user,
  });

  const { data: activityData } = useQuery({
    queryKey: ['user-activity', user?._id],
    queryFn: () => usersApi.getActivity(user!._id).then((r) => r.data),
    enabled: !!user,
  });

  const { data: affiliateData } = useQuery({
    queryKey: ['affiliate-me'],
    queryFn: () => affiliatesApi.me().then((r) => r.data),
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: (data: EditForm) => profileApi.update({
      name: data.name,
      bio: data.bio,
      socialLinks: {
        twitter: data.twitter || undefined,
        github: data.github || undefined,
        instagram: data.instagram || undefined,
        website: data.website || undefined,
      },
    }),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const subscription = subData?.subscription as Subscription | null;
  const history = subData?.history as Subscription[] || [];
  const logs: Log[] = activityData?.logs || [];

  const referralCode = affiliateData?.referralCode || user?.referralCode || '';
  const referralLink = referralCode ? `${typeof window !== 'undefined' ? window.location.origin : 'https://elitetrojan.vercel.app'}/register?ref=${referralCode}` : '';
  const affStats = affiliateData?.stats || { totalReferrals: 0, totalSales: 0, totalEarned: 0, pendingAmount: 0, paidAmount: 0 };
  const affCommissions: { _id: string; plan: string; commissionAmount: number; status: string; createdAt: string; referredUser?: { name: string } }[] = affiliateData?.commissions || [];

  const handleCopyRef = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawMsg('');
    try {
      await affiliatesApi.requestWithdrawal({
        pixKey: withdrawForm.pixKey,
        pixKeyType: withdrawForm.pixKeyType,
        name: withdrawForm.name,
        cpf: withdrawForm.cpf,
        amount: parseFloat(withdrawForm.amount),
        notes: withdrawForm.notes,
      });
      setWithdrawMsg('✓ Solicitação enviada! Admin entrará em contato em até 48h.');
      setWithdrawForm({ pixKey: '', pixKeyType: 'cpf', name: '', cpf: '', amount: '', notes: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setWithdrawMsg(e.response?.data?.message || 'Erro ao solicitar saque.');
    } finally {
      setWithdrawing(false);
    }
  };

  const xp = user?.xp || 0;
  const levelInfo = LEVEL_XP[user?.level || 'iniciante'];
  const xpPercent = Math.min(100, (xp / levelInfo.max) * 100);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload immediately
    setAvatarUploadError('');
    setUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      await refreshUser();
      setAvatarPreview(null);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Falha ao enviar foto. Tente novamente.';
      setAvatarUploadError(msg);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload immediately
    setBannerUploadError('');
    setUploadingBanner(true);
    try {
      await profileApi.uploadBanner(file);
      await refreshUser();
      setBannerPreview(null);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Falha ao enviar banner. Tente novamente.';
      setBannerUploadError(msg);
      setBannerPreview(null);
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: EditForm) => {
    updateProfile.mutate(data);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset({
      name: user?.name || '',
      bio: user?.bio || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      instagram: user?.socialLinks?.instagram || '',
      website: user?.socialLinks?.website || '',
    });
    setAvatarPreview(null);
    setBannerPreview(null);
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <User style={{ width: 16, height: 16, color: '#00ff41' }} />
        <h1 style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '1.1rem', fontWeight: 700,
          color: '#00ff41', letterSpacing: '0.12em', margin: 0,
          textShadow: '0 0 12px rgba(0,255,65,0.4)',
        }}>{'// MEU PERFIL'}</h1>
        {saveSuccess && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#00ff41', fontFamily: 'JetBrains Mono, monospace' }}>
            <Check style={{ width: 12, height: 12 }} /> SALVO
          </span>
        )}
      </div>

      {/* Banner + Avatar */}
      <div style={{ marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,255,65,0.15)', position: 'relative' }}>
        {/* Banner */}
        <div style={{
          height: 200,
          background: bannerPreview
            ? `url(${bannerPreview}) center/cover no-repeat`
            : user.bannerUrl
              ? `url(${user.bannerUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, rgba(0,30,15,0.9) 0%, rgba(0,20,35,0.85) 50%, rgba(10,5,30,0.9) 100%), url(https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80) center/cover no-repeat',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanlines overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            pointerEvents: 'none',
          }} />
          {/* Banner upload button — sempre visível */}
          <label
            htmlFor="bannerFileInput"
            style={{
              position: 'absolute', bottom: 8, right: 8,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 4,
              cursor: uploadingBanner ? 'default' : 'pointer',
              background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,65,0.4)',
              color: '#00ff41', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              pointerEvents: uploadingBanner ? 'none' : 'auto',
              userSelect: 'none',
            }}
          >
            {uploadingBanner ? (
              <div style={{ width: 11, height: 11, border: '1.5px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <ImageIcon style={{ width: 11, height: 11 }} />
            )}
            {uploadingBanner ? 'ENVIANDO...' : 'TROCAR BANNER'}
          </label>
          <input
            id="bannerFileInput"
            type="file"
            accept="image/*,image/heic,image/heif,image/webp,image/avif"
            style={{ display: 'none' }}
            onChange={handleBannerChange}
          />
        </div>

        {/* Avatar row */}
        <div style={{
          background: '#0a120a',
          padding: '0 20px 16px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -28 }}>
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              {/* Avatar circle */}
              <div style={{
                width: 72, height: 72,
                background: 'rgba(0,255,65,0.08)',
                border: `2px solid ${levelInfo.color}`,
                boxShadow: `0 0 12px ${levelInfo.color}44`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, color: '#00ff41',
                overflow: 'hidden', position: 'relative',
              }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  {getInitials(user.name)}
                </span>
                {(avatarPreview || user.avatar) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={avatarPreview || user.avatar || ''}
                    src={avatarPreview || user.avatar || ''}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', zIndex: 2 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              {/* Avatar upload label — sempre clicável via label→input */}
              <label
                htmlFor="avatarFileInput"
                title="Trocar foto de perfil"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0)',
                  cursor: uploadingAvatar ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#00ff41', transition: 'background 0.2s',
                  zIndex: 10,
                  pointerEvents: uploadingAvatar ? 'none' : 'auto',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.background = 'rgba(0,0,0,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = 'rgba(0,0,0,0)'; }}
              >
                {uploadingAvatar && (
                  <div style={{ width: 18, height: 18, border: '2px solid #00ff41', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
              </label>
              {/* Ícone de câmera fixo no canto inferior direito */}
              {!uploadingAvatar && (
                <label
                  htmlFor="avatarFileInput"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#0a2a0a', border: `1.5px solid ${levelInfo.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 11,
                  }}
                >
                  <Camera style={{ width: 11, height: 11, color: '#00ff41' }} />
                </label>
              )}
              <input
                id="avatarFileInput"
                type="file"
                accept="image/*,image/heic,image/heif,image/webp,image/avif"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            <div style={{ paddingBottom: 4 }}>
              {avatarUploadError && (
                <div style={{
                  fontSize: '0.65rem', color: '#ff4060',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(255,40,60,0.1)',
                  border: '1px solid rgba(255,40,60,0.3)',
                  borderRadius: 4, padding: '4px 8px',
                  marginBottom: 4, maxWidth: 240,
                }}>
                  ✗ {avatarUploadError}
                </div>
              )}
              {isEditing ? (
                <input
                  {...register('name', { required: true, minLength: 2 })}
                  style={{
                    background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.3)',
                    borderRadius: 4, padding: '4px 10px',
                    color: '#e0ffe8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              ) : (
                <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 700, color: '#e0ffe8', margin: '0 0 4px' }}>
                  {user.name}
                  {user.role === 'admin' && (
                    <span style={{ marginLeft: 8, fontSize: '0.6rem', color: '#ff4400', fontWeight: 700, letterSpacing: '0.1em' }}>
                      [ADMIN]
                    </span>
                  )}
                </h2>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <LevelBadge level={user.level} size="md" />
                {user.role === 'admin' && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: '0.6rem', padding: '2px 7px',
                    background: 'rgba(255,68,0,0.08)', border: '1px solid rgba(255,68,0,0.3)',
                    borderRadius: 3, color: '#ff4400', fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    <Shield style={{ width: 9, height: 9 }} /> ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit toggle */}
          <div style={{ paddingBottom: 4 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 4,
                    background: 'transparent', border: '1px solid rgba(255,0,64,0.3)',
                    color: '#ff0040', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 11, height: 11 }} /> CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateProfile.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 4,
                    background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.3)',
                    color: '#00ff41', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                    cursor: updateProfile.isPending ? 'wait' : 'pointer',
                    opacity: updateProfile.isPending ? 0.6 : 1,
                  }}
                >
                  <Save style={{ width: 11, height: 11 }} /> SALVAR
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 4,
                  background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.2)',
                  color: '#2a6a3a', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                  cursor: 'pointer',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#00ff41'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#2a6a3a'; e.currentTarget.style.borderColor = 'rgba(0,255,65,0.2)'; }}
              >
                <Edit2 style={{ width: 11, height: 11 }} /> EDITAR PERFIL
              </button>
            )}
          </div>
        </div>
        {bannerUploadError && (
          <div style={{ padding: '6px 20px', background: 'rgba(255,40,60,0.08)', borderTop: '1px solid rgba(255,40,60,0.2)' }}>
            <p style={{ fontSize: '0.65rem', color: '#ff4060', fontFamily: 'JetBrains Mono, monospace' }}>{bannerUploadError}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Bio */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
            borderRadius: 6, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
                {'// BIO'}
              </span>
            </div>
            {isEditing ? (
              <div>
                <textarea
                  {...register('bio', { maxLength: 300 })}
                  rows={3}
                  maxLength={300}
                  placeholder="Fale um pouco sobre você..."
                  style={{
                    width: '100%', resize: 'none',
                    background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.2)',
                    borderRadius: 4, padding: '8px 10px',
                    color: '#a0c8a8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4d30', textAlign: 'right', marginTop: 2 }}>
                  {bioValue?.length || 0}/300
                </p>
              </div>
            ) : (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#6a9a6a', lineHeight: 1.6, margin: 0 }}>
                {user.bio || <span style={{ color: '#2a4a2a', fontStyle: 'italic' }}>Nenhuma bio definida</span>}
              </p>
            )}
          </div>

          {/* Social links */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
            borderRadius: 6, padding: 16,
          }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
                {'// SOCIAL LINKS'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isEditing ? (
                <>
                  {[
                    { icon: <Twitter style={{ width: 12, height: 12 }} />, name: 'twitter' as const, placeholder: 'Twitter username' },
                    { icon: <Github style={{ width: 12, height: 12 }} />, name: 'github' as const, placeholder: 'GitHub username' },
                    { icon: <Instagram style={{ width: 12, height: 12 }} />, name: 'instagram' as const, placeholder: 'Instagram username' },
                    { icon: <Globe style={{ width: 12, height: 12 }} />, name: 'website' as const, placeholder: 'https://seusite.com' },
                  ].map((field) => (
                    <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#2a6a3a', flexShrink: 0 }}>{field.icon}</span>
                      <input
                        {...register(field.name)}
                        placeholder={field.placeholder}
                        style={{
                          flex: 1, background: 'rgba(0,255,65,0.03)',
                          border: '1px solid rgba(0,255,65,0.15)', borderRadius: 4,
                          padding: '5px 8px', color: '#a0c8a8',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { icon: <Twitter style={{ width: 12, height: 12 }} />, value: user.socialLinks?.twitter, label: 'twitter' },
                    { icon: <Github style={{ width: 12, height: 12 }} />, value: user.socialLinks?.github, label: 'github' },
                    { icon: <Instagram style={{ width: 12, height: 12 }} />, value: user.socialLinks?.instagram, label: 'instagram' },
                    { icon: <Globe style={{ width: 12, height: 12 }} />, value: user.socialLinks?.website, label: 'website' },
                  ].filter(s => s.value).map((social) => (
                    <div key={social.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#2a6a3a' }}>{social.icon}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#00d4ff' }}>
                        {social.value}
                      </span>
                    </div>
                  ))}
                  {!user.socialLinks?.twitter && !user.socialLinks?.github && !user.socialLinks?.instagram && !user.socialLinks?.website && (
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#2a4a2a', fontStyle: 'italic' }}>
                      Nenhum link definido
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
            borderRadius: 6, padding: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>
                  <Calendar style={{ width: 11, height: 11 }} /> MEMBRO DESDE
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6a9a6a', fontFamily: 'JetBrains Mono, monospace' }}>{formatDate(user.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>
                  <Clock style={{ width: 11, height: 11 }} /> ÚLTIMO ACESSO
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6a9a6a', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.lastLogin ? formatRelativeDate(user.lastLogin) : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>
                  <User style={{ width: 11, height: 11 }} /> EMAIL
                </span>
                <span style={{ fontSize: '0.65rem', color: '#4a7a5a', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* XP / Level */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: `1px solid ${levelInfo.color}22`,
            borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${levelInfo.color}66, transparent)` }} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: levelInfo.color, letterSpacing: '0.12em', opacity: 0.7 }}>
                {'// XP & NÍVEL'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: levelInfo.color, textShadow: `0 0 12px ${levelInfo.color}66` }}>
                {xp.toLocaleString()} XP
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: `${levelInfo.color}88` }}>
                {levelInfo.label}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${xpPercent}%`,
                background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}aa)`,
                boxShadow: `0 0 8px ${levelInfo.color}66`,
                borderRadius: 3,
                transition: 'width 1s ease',
              }} />
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4d30', marginTop: 5 }}>
              {xp} / {levelInfo.max} XP para próximo nível
            </p>
          </div>

          {/* Achievements */}
          {user.achievements && user.achievements.length > 0 && (
            <div style={{
              background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: 6, padding: 16,
            }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.12em', opacity: 0.7 }}>
                  {'// CONQUISTAS'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {user.achievements.map((a, i) => (
                  <span key={i} style={{
                    padding: '3px 8px', borderRadius: 3,
                    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#00d4ff',
                  }}>
                    🏆 {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subscription */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.15)',
            borderRadius: 6, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CreditCard style={{ width: 13, height: 13, color: '#00ff41' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
                {'// ASSINATURA'}
              </span>
            </div>
            {subscription ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>PLANO</span>
                  <PlanBadge plan={subscription.plan} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>STATUS</span>
                  <StatusBadge status={subscription.status} />
                </div>
                {subscription.endDate && subscription.plan !== 'lifetime' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.65rem', color: '#2a4d30', fontFamily: 'JetBrains Mono, monospace' }}>EXPIRA</span>
                    <span style={{ fontSize: '0.7rem', color: '#6a9a6a', fontFamily: 'JetBrains Mono, monospace' }}>{formatRelativeDate(subscription.endDate)}</span>
                  </div>
                )}
                <Link href="/planos" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '6px', borderRadius: 4, marginTop: 4,
                  background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#2a6a3a',
                  textDecoration: 'none',
                }}>
                  Gerenciar plano <ChevronRight style={{ width: 10, height: 10 }} />
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#2a4d30', marginBottom: 10 }}>
                  Sem assinatura ativa
                </p>
                <Link href="/planos" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 4,
                  background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.3)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 700,
                  color: '#00ff41', textDecoration: 'none',
                }}>
                  <Zap style={{ width: 11, height: 11 }} /> ASSINAR AGORA
                </Link>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div style={{
            background: 'rgba(10,18,10,0.8)', border: '1px solid rgba(0,255,65,0.12)',
            borderRadius: 6, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Activity style={{ width: 13, height: 13, color: '#00ff41' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.12em' }}>
                {'// ATIVIDADE RECENTE'}
              </span>
            </div>
            {logs.length === 0 ? (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#2a4a2a', textAlign: 'center', padding: '12px 0' }}>
                Sem atividade registrada
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {logs.slice(0, 6).map((log) => (
                  <div key={log._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 3, flexShrink: 0,
                      background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem',
                    }}>
                      {log.action === 'login' ? '🔐' : log.action === 'download' ? '📥' : log.action === 'access' ? '👁️' : log.action === 'register' ? '✨' : '⚡'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#6a9a6a', margin: 0, textTransform: 'uppercase' }}>
                        {log.action}
                      </p>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020' }}>
                      {formatRelativeDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Seção Afiliados ─── */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Users className="w-4 h-4" style={{ color: '#00ff41' }} />
          <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 700, color: '#a0c8a8', letterSpacing: '0.1em', margin: 0 }}>
            PROGRAMA DE AFILIADOS
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
          {[
            { label: 'INDICAÇÕES', value: affStats.totalReferrals, color: '#00d4ff' },
            { label: 'VENDAS', value: affStats.totalSales, color: '#00ff41' },
            { label: 'A RECEBER', value: `R$ ${affStats.pendingAmount.toFixed(2)}`, color: '#ffcc00' },
            { label: 'JÁ PAGO', value: `R$ ${affStats.paidAmount.toFixed(2)}`, color: '#cc66ff' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '14px 16px', borderRadius: 6,
              background: 'rgba(5,10,5,0.8)',
              border: `1px solid ${s.color}22`,
            }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#2a4d30', letterSpacing: '0.15em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Link de indicação */}
        <div style={{
          padding: '14px 16px', borderRadius: 6, marginBottom: 16,
          background: 'rgba(0,255,65,0.03)', border: '1px solid rgba(0,255,65,0.15)',
        }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#2a4d30', letterSpacing: '0.12em', marginBottom: 8 }}>
            SEU LINK DE INDICAÇÃO
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{
              flex: 1, padding: '8px 12px', borderRadius: 4, minWidth: 0,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,65,0.1)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#4a8a5a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
            }}>
              {referralLink || 'Carregando...'}
            </code>
            <button onClick={handleCopyRef} style={{
              padding: '8px 14px', borderRadius: 4, flexShrink: 0,
              background: copiedRef ? 'rgba(0,255,65,0.15)' : 'rgba(0,255,65,0.06)',
              border: '1px solid rgba(0,255,65,0.25)',
              color: copiedRef ? '#00ff41' : '#4a8a5a',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
              {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedRef ? 'COPIADO' : 'COPIAR'}
            </button>
          </div>
        </div>

        {/* Histórico de comissões + botão saque */}
        <div style={{
          padding: '16px', borderRadius: 6,
          background: 'rgba(5,10,5,0.8)', border: '1px solid rgba(0,255,65,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#4a8a5a', letterSpacing: '0.1em' }}>
              HISTÓRICO DE COMISSÕES
            </span>
            {affStats.pendingAmount > 0 && (
              <button onClick={() => setShowWithdrawModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 4,
                background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)',
                color: '#ffcc00', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                cursor: 'pointer', fontWeight: 700, transition: 'all 0.15s',
              }}>
                <DollarSign className="w-3 h-3" /> SOLICITAR SAQUE
              </button>
            )}
          </div>

          {affCommissions.length === 0 ? (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#1a3020', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma comissão ainda. Compartilhe seu link!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {affCommissions.slice(0, 10).map((c) => (
                <div key={c._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 4,
                  background: 'rgba(0,255,65,0.02)', border: '1px solid rgba(0,255,65,0.06)',
                }}>
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#6a9a6a' }}>
                      {c.referredUser?.name || 'Usuário'} — {c.plan}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#1a3020', marginLeft: 8 }}>
                      {formatRelativeDate(c.createdAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: '#00ff41' }}>
                      R$ {c.commissionAmount.toFixed(2)}
                    </span>
                    <span style={{
                      padding: '2px 6px', borderRadius: 3,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', fontWeight: 700,
                      background: c.status === 'paid' ? 'rgba(0,255,65,0.1)' : 'rgba(255,204,0,0.1)',
                      color: c.status === 'paid' ? '#00ff41' : '#ffcc00',
                      border: `1px solid ${c.status === 'paid' ? 'rgba(0,255,65,0.2)' : 'rgba(255,204,0,0.2)'}`,
                    }}>
                      {c.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de saque */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setShowWithdrawModal(false)}>
          <div style={{
            width: '100%', maxWidth: 440,
            background: '#080e18', border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: 8, padding: 24,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700, color: '#00ff41', margin: 0 }}>
                SOLICITAR SAQUE
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', color: '#2a4d30', cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label-hack">TIPO DE CHAVE PIX</label>
                <select value={withdrawForm.pixKeyType} onChange={e => setWithdrawForm(p => ({ ...p, pixKeyType: e.target.value }))} className="input-hack">
                  <option value="cpf">CPF</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave aleatória</option>
                </select>
              </div>
              <div>
                <label className="label-hack">CHAVE PIX</label>
                <input value={withdrawForm.pixKey} onChange={e => setWithdrawForm(p => ({ ...p, pixKey: e.target.value }))} placeholder="Sua chave PIX" className="input-hack" />
              </div>
              <div>
                <label className="label-hack">NOME COMPLETO</label>
                <input value={withdrawForm.name} onChange={e => setWithdrawForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do titular" className="input-hack" />
              </div>
              <div>
                <label className="label-hack">CPF</label>
                <input value={withdrawForm.cpf} onChange={e => setWithdrawForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" className="input-hack" />
              </div>
              <div>
                <label className="label-hack">VALOR (disponível: R$ {affStats.pendingAmount.toFixed(2)})</label>
                <input type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="input-hack" max={affStats.pendingAmount} />
              </div>
              <div>
                <label className="label-hack">OBSERVAÇÕES (opcional)</label>
                <input value={withdrawForm.notes} onChange={e => setWithdrawForm(p => ({ ...p, notes: e.target.value }))} placeholder="Alguma informação extra..." className="input-hack" />
              </div>
            </div>

            {withdrawMsg && (
              <div style={{
                marginTop: 12, padding: '8px 12px', borderRadius: 4,
                background: withdrawMsg.startsWith('✓') ? 'rgba(0,255,65,0.06)' : 'rgba(255,0,64,0.06)',
                border: `1px solid ${withdrawMsg.startsWith('✓') ? 'rgba(0,255,65,0.2)' : 'rgba(255,0,64,0.2)'}`,
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
                color: withdrawMsg.startsWith('✓') ? '#00ff41' : '#ff0040',
              }}>
                {withdrawMsg}
              </div>
            )}

            <button onClick={handleWithdraw} disabled={withdrawing} style={{
              width: '100%', marginTop: 16, padding: '11px',
              background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)',
              borderRadius: 4, color: '#ffcc00',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700,
              cursor: withdrawing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: withdrawing ? 0.7 : 1, transition: 'all 0.15s',
            }}>
              <DollarSign className="w-4 h-4" />
              {withdrawing ? 'ENVIANDO...' : 'SOLICITAR SAQUE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
