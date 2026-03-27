'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, Library } from 'lucide-react';
import Link from 'next/link';
import { categoriesApi, contentApi } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';
import { useState } from 'react';
import type { Content } from '@/types';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState(1);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug).then((r) => r.data),
  });

  const category = catData?.category;

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['category-content', category?._id, page],
    queryFn: () =>
      contentApi.list({ category: category._id, page, limit: 18 }).then((r) => r.data),
    enabled: !!category?._id,
  });

  const contents: Content[] = contentData?.contents || [];
  const pagination = contentData?.pagination;

  if (catLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="skeleton h-32 rounded-xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Category not found</h2>
        <Link href="/content" className="btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Content
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/content" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Content
      </Link>

      {/* Category header */}
      <div
        className="rounded-xl p-6 mb-6 border"
        style={{
          backgroundColor: `${category.color}10`,
          borderColor: `${category.color}30`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
          >
            {category.icon || '📁'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{category.name}</h1>
            {category.description && (
              <p className="text-gray-400 text-sm mt-1">{category.description}</p>
            )}
            {pagination && (
              <p className="text-gray-600 text-sm mt-2">
                {pagination.total} item{pagination.total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {contentLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50">
          <Library className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No content in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((item) => (
            <ContentCard key={item._id} content={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">
            Previous
          </button>
          <span className="text-sm text-gray-500">
            {page} / {pagination.pages}
          </span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-3 py-1.5 text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
