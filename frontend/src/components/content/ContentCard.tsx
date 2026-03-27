'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Eye, ExternalLink, Lock, Clock, Tag } from 'lucide-react';
import { contentApi } from '@/lib/api';
import { LevelBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  getContentTypeIcon,
  getContentTypeLabel,
  getContentTypeColor,
  formatBytes,
  formatRelativeDate,
  cn,
} from '@/lib/utils';
import type { Content } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const LEVEL_ORDER: Record<string, number> = {
  iniciante: 0,
  intermediario: 1,
  avancado: 2,
  elite: 3,
};

interface ContentCardProps {
  content: Content;
  onDownload?: () => void;
}

export default function ContentCard({ content, onDownload }: ContentCardProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [views, setViews] = useState(content.views);
  const [downloads, setDownloads] = useState(content.downloads);

  const userLevelOrder = LEVEL_ORDER[user?.level || 'iniciante'] || 0;
  const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
  const isLocked = userLevelOrder < contentLevelOrder && user?.role !== 'admin';

  const category = typeof content.category === 'object' ? content.category : null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await contentApi.download(content._id);
      const { fileUrl, externalLink } = response.data;

      setDownloads((d) => d + 1);

      if (externalLink) {
        window.open(externalLink, '_blank', 'noopener,noreferrer');
      } else if (fileUrl) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = content.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onDownload?.();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className={cn('flex flex-col transition-all duration-200 hover:border-green-500/20 hover:shadow-green-glow/30', isLocked && 'opacity-75')}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0',
            'bg-gray-800/80'
          )}>
            {getContentTypeIcon(content.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-200 leading-tight line-clamp-2">
                {content.title}
              </h3>
              {isLocked && (
                <Lock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', getContentTypeColor(content.type))}>
                {getContentTypeLabel(content.type)}
              </span>
              <LevelBadge level={content.minLevel} size="sm" />
              {category && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded border font-medium"
                  style={{ color: category.color, borderColor: `${category.color}40`, backgroundColor: `${category.color}15` }}
                >
                  {category.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {content.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{content.description}</p>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {content.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 text-xs text-gray-600 bg-gray-800/50 rounded px-1.5 py-0.5">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {content.tags.length > 3 && (
              <span className="text-xs text-gray-600">+{content.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-gray-800/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {views}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" /> {downloads}
          </span>
          {content.fileSize > 0 && (
            <span>{formatBytes(content.fileSize)}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(content.createdAt)}
          </span>
        </div>

        {isLocked ? (
          <Link
            href="/planos"
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <Lock className="w-3 h-3" /> Upgrade
          </Link>
        ) : (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : content.externalLink ? (
              <ExternalLink className="w-3 h-3" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {content.externalLink ? 'Open' : 'Download'}
          </button>
        )}
      </div>
    </Card>
  );
}
