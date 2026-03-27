import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import type { UserLevel, SubscriptionPlan, ContentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, pattern = 'MMM dd, yyyy'): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Invalid date';
    return format(d, pattern);
  } catch {
    return 'Invalid date';
  }
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Invalid date';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'N/A';
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getLevelColor(level: UserLevel): string {
  const colors: Record<UserLevel, string> = {
    iniciante: 'text-gray-400 bg-gray-800/50 border-gray-700/50',
    intermediario: 'text-blue-400 bg-blue-900/30 border-blue-800/50',
    avancado: 'text-purple-400 bg-purple-900/30 border-purple-800/50',
    elite: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
  };
  return colors[level] || colors.iniciante;
}

export function getLevelLabel(level: UserLevel): string {
  const labels: Record<UserLevel, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado',
    elite: 'Elite',
  };
  return labels[level] || level;
}

export function getPlanName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    lifetime: 'Vitalício',
  };
  return names[plan] || plan;
}

export function getPlanColor(plan: SubscriptionPlan): string {
  const colors: Record<SubscriptionPlan, string> = {
    weekly: 'text-cyan-400 bg-cyan-900/30 border-cyan-800/50',
    monthly: 'text-green-400 bg-green-900/30 border-green-800/50',
    lifetime: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
  };
  return colors[plan] || 'text-gray-400 bg-gray-800 border-gray-700';
}

export function getContentTypeIcon(type: ContentType): string {
  const icons: Record<ContentType, string> = {
    programa: '💻',
    database: '🗄️',
    material: '📚',
    esquema: '📋',
    video: '🎥',
    outro: '📦',
  };
  return icons[type] || '📦';
}

export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    programa: 'Programa',
    database: 'Database',
    material: 'Material',
    esquema: 'Esquema',
    video: 'Vídeo',
    outro: 'Outro',
  };
  return labels[type] || type;
}

export function getContentTypeColor(type: ContentType): string {
  const colors: Record<ContentType, string> = {
    programa: 'text-green-400 bg-green-900/30 border-green-800/50',
    database: 'text-blue-400 bg-blue-900/30 border-blue-800/50',
    material: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
    esquema: 'text-purple-400 bg-purple-900/30 border-purple-800/50',
    video: 'text-red-400 bg-red-900/30 border-red-800/50',
    outro: 'text-gray-400 bg-gray-800/50 border-gray-700/50',
  };
  return colors[type] || colors.outro;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-400 bg-green-900/30 border-green-800/50',
    expired: 'text-red-400 bg-red-900/30 border-red-800/50',
    cancelled: 'text-gray-400 bg-gray-800/50 border-gray-700/50',
    pending: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
    banned: 'text-red-400 bg-red-900/30 border-red-800/50',
  };
  return colors[status] || 'text-gray-400 bg-gray-800 border-gray-700';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCountdown(expiresAt: string | Date): { hours: number; minutes: number; seconds: number; expired: boolean } {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}
