'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import type { Category } from '@/types';

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

const CONTENT_TYPES = [
  { value: '', label: 'TODOS', color: '#4d8c5a' },
  { value: 'programa', label: 'PROGRAMA', color: '#00d4ff' },
  { value: 'database', label: 'DATABASE', color: '#ffcc00' },
  { value: 'material', label: 'MATERIAL', color: '#00ff41' },
  { value: 'esquema', label: 'ESQUEMA', color: '#cc66ff' },
  { value: 'video', label: 'VÍDEO', color: '#ff6644' },
  { value: 'outro', label: 'OUTRO', color: '#4d8c5a' },
];

const LEVELS = [
  { value: '', label: 'TODOS' },
  { value: 'iniciante', label: 'INICIANTE', color: '#00ff41' },
  { value: 'intermediario', label: 'INTERMEDIÁRIO', color: '#00d4ff' },
  { value: 'avancado', label: 'AVANÇADO', color: '#ffcc00' },
  { value: 'elite', label: 'ELITE', color: '#ff4400' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: '> MAIS RECENTE' },
  { value: 'createdAt', label: '> MAIS ANTIGO' },
  { value: '-views', label: '> MAIS VISTO' },
  { value: '-downloads', label: '> MAIS BAIXADO' },
  { value: 'title', label: '> TÍTULO A-Z' },
];

const filterBtnStyle = (active: boolean, color = '#00ff41') => ({
  width: '100%',
  textAlign: 'left' as const,
  padding: '6px 10px',
  borderRadius: 3,
  border: `1px solid ${active ? `${color}40` : 'transparent'}`,
  background: active ? `${color}10` : 'transparent',
  color: active ? color : '#2a4a2a',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.65rem',
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
  letterSpacing: '0.06em',
});

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

  const sectionLabel = (text: string) => (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.58rem',
      fontWeight: 700,
      letterSpacing: '0.2em',
      color: '#1a3020',
      marginBottom: 6,
      marginTop: 2,
    }}>
      {text}
    </div>
  );

  return (
    <div style={{
      background: 'rgba(10,18,10,0.8)',
      border: '1px solid rgba(0,255,65,0.1)',
      borderRadius: 6,
      padding: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <SlidersHorizontal style={{ width: 13, height: 13, color: '#00ff41' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: '#2a6a3a', letterSpacing: '0.1em' }}>
            FILTROS
          </span>
        </div>
        {hasFilters && (
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.6rem', color: '#ff4400',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <X style={{ width: 10, height: 10 }} /> LIMPAR
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sort */}
        <div>
          {sectionLabel('// ORDENAR')}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(5,10,5,0.8)',
              border: '1px solid rgba(0,255,65,0.15)',
              borderRadius: 4,
              padding: '7px 10px',
              color: '#4d8c5a',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            {sectionLabel('// CATEGORIA')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button
                onClick={() => onCategoryChange('')}
                style={filterBtnStyle(!selectedCategory)}
                onMouseEnter={e => { if (selectedCategory) (e.currentTarget).style.color = '#4d8c5a'; }}
                onMouseLeave={e => { if (selectedCategory) (e.currentTarget).style.color = '#2a4a2a'; }}
              >
                TODAS
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => onCategoryChange(cat._id)}
                  style={{
                    ...filterBtnStyle(selectedCategory === cat._id, cat.color),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                  title={cat.description || cat.name}
                >
                  <span style={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>{cat.icon || '📁'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type */}
        <div>
          {sectionLabel('// TIPO')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onTypeChange(type.value)}
                style={filterBtnStyle(selectedType === type.value, type.color)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          {sectionLabel('// NÍVEL')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => onLevelChange(level.value)}
                style={filterBtnStyle(selectedLevel === level.value, level.color || '#00ff41')}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
