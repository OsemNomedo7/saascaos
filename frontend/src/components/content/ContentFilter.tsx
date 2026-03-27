'use client';

import { Filter, X, SlidersHorizontal } from 'lucide-react';
import type { Category, ContentType, UserLevel } from '@/types';

interface ContentFilterProps {
  categories: Category[];
  selectedCategory: string;
  selectedType: string;
  selectedLevel: string;
  sortBy: string;
  onCategoryChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onLevelChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onReset: () => void;
}

const CONTENT_TYPES: { value: string; label: string; emoji: string }[] = [
  { value: '', label: 'All Types', emoji: '📦' },
  { value: 'programa', label: 'Programa', emoji: '💻' },
  { value: 'database', label: 'Database', emoji: '🗄️' },
  { value: 'material', label: 'Material', emoji: '📚' },
  { value: 'esquema', label: 'Esquema', emoji: '📋' },
  { value: 'video', label: 'Vídeo', emoji: '🎥' },
  { value: 'outro', label: 'Outro', emoji: '📄' },
];

const LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'elite', label: 'Elite' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-views', label: 'Most Viewed' },
  { value: '-downloads', label: 'Most Downloaded' },
  { value: 'title', label: 'Title A-Z' },
];

export default function ContentFilter({
  categories,
  selectedCategory,
  selectedType,
  selectedLevel,
  sortBy,
  onCategoryChange,
  onTypeChange,
  onLevelChange,
  onSortChange,
  onReset,
}: ContentFilterProps) {
  const hasFilters = selectedCategory || selectedType || selectedLevel || sortBy !== '-createdAt';

  return (
    <div className="bg-gray-900/80 border border-gray-800/60 rounded-xl p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <SlidersHorizontal className="w-4 h-4 text-green-400" />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Category</label>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedCategory
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onCategoryChange(cat._id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedCategory === cat._id
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Type</label>
        <div className="grid grid-cols-2 gap-1">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                selectedType === type.value
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-400'
              }`}
            >
              <span>{type.emoji}</span>
              <span className="truncate">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Min Level</label>
        <div className="space-y-1">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => onLevelChange(level.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedLevel === level.value
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
