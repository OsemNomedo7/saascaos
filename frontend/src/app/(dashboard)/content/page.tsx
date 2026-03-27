'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { contentApi, categoriesApi } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';
import ContentFilter from '@/components/content/ContentFilter';
import type { Content, Category } from '@/types';

export default function ContentPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['content', { search, selectedCategory, selectedType, selectedLevel, sortBy, page }],
    queryFn: () =>
      contentApi.list({
        search: search || undefined,
        category: selectedCategory || undefined,
        type: selectedType || undefined,
        level: selectedLevel || undefined,
        sort: sortBy,
        page,
        limit: 18,
      }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const categories: Category[] = categoriesData?.categories || [];
  const contents: Content[] = data?.contents || [];
  const pagination = data?.pagination;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleReset = () => {
    setSearch('');
    setSearchInput('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedLevel('');
    setSortBy('-createdAt');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Content Library</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagination ? `${pagination.total} items available` : 'Loading...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-700 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search content by title, description or tags..."
          className="input-field pl-9"
        />
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <ContentFilter
            categories={categories}
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            selectedLevel={selectedLevel}
            sortBy={sortBy}
            onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
            onTypeChange={(v) => { setSelectedType(v); setPage(1); }}
            onLevelChange={(v) => { setSelectedLevel(v); setPage(1); }}
            onSortChange={(v) => { setSortBy(v); setPage(1); }}
            onReset={handleReset}
          />
        </div>

        {/* Mobile filters */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-gray-950/80" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
              <ContentFilter
                categories={categories}
                selectedCategory={selectedCategory}
                selectedType={selectedType}
                selectedLevel={selectedLevel}
                sortBy={sortBy}
                onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
                onTypeChange={(v) => { setSelectedType(v); setPage(1); }}
                onLevelChange={(v) => { setSelectedLevel(v); setPage(1); }}
                onSortChange={(v) => { setSortBy(v); setPage(1); }}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* Content grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-xl" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400 font-medium">No content found</p>
              <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
              <button onClick={handleReset} className="btn-secondary mt-4 text-sm">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {contents.map((item) => (
                  <ContentCard key={item._id} content={item} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-green-500 text-gray-950'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
