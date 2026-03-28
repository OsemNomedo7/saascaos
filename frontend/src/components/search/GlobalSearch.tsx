'use client';

import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Search, X, FileText, Database, Video, Package, Zap, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchApi } from '@/lib/api';
import { Content } from '@/types';

interface GlobalSearchProps {
  onSelectContent?: (content: Content) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  programa: <Package size={13} color="#00ff41" />,
  database: <Database size={13} color="#00d4ff" />,
  material: <FileText size={13} color="#cc66ff" />,
  esquema: <FileText size={13} color="#ff4400" />,
  video: <Video size={13} color="#00d4ff" />,
  outro: <File size={13} color="#00ff4199" />,
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function GlobalSearch({ onSelectContent }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Content[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
    }
  }, [open]);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchApi
      .search({ q: debouncedQuery, limit: 8 })
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (Array.isArray(data)) {
          setResults(data);
        } else if (Array.isArray(data?.results)) {
          setResults(data.results);
        } else if (Array.isArray(data?.content)) {
          setResults(data.content);
        } else if (Array.isArray(data?.data)) {
          setResults(data.data);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (content: Content) => {
      setOpen(false);
      if (onSelectContent) {
        onSelectContent(content);
      } else {
        router.push(`/content?id=${content._id}`);
      }
    },
    [onSelectContent, router]
  );

  // Keyboard navigation in results
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  if (!open) return null;

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,10,5,0.85)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '10vh',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const panelStyle: CSSProperties = {
    width: '100%',
    maxWidth: 560,
    background: '#0a0f0a',
    border: '1px solid #00ff4144',
    borderRadius: 12,
    boxShadow: '0 24px 80px rgba(0,0,0,0.9), 0 0 40px #00ff4111',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: '0 16px',
  };

  const searchBarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: results.length > 0 || searching ? '1px solid #00ff4122' : 'none',
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#00ff41',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
    caretColor: '#00ff41',
  };

  const closeBtnStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    background: '#00ff4111',
    border: '1px solid #00ff4122',
    cursor: 'pointer',
    outline: 'none',
    padding: 0,
    flexShrink: 0,
  };

  const shortcutHintStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 16px 10px',
    fontSize: 10,
    color: '#00ff4155',
  };

  const kbdStyle: CSSProperties = {
    background: '#00ff4111',
    border: '1px solid #00ff4133',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 10,
    color: '#00ff4199',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const spinnerWrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    gap: 8,
    color: '#00ff4166',
    fontSize: 11,
  };

  const spinnerStyle: CSSProperties = {
    width: 16,
    height: 16,
    border: '2px solid #00ff4122',
    borderTopColor: '#00ff41',
    borderRadius: '50%',
    animation: 'gsearchSpin 0.7s linear infinite',
  };

  const sectionLabelStyle: CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: '#00ff4166',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '8px 16px 4px',
    borderBottom: '1px solid #00ff4111',
  };

  const noResultsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '20px 16px',
    fontSize: 12,
    color: '#00ff4155',
  };

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    borderTop: '1px solid #00ff4111',
    fontSize: 10,
    color: '#00ff4144',
    flexWrap: 'wrap',
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <style>{`
        @keyframes gsearchSpin { to { transform: rotate(360deg); } }
        .gs-result-item:hover { background: rgba(0,255,65,0.07) !important; }
        ::placeholder { color: #00ff4144 !important; }
      `}</style>

      {/* Overlay backdrop */}
      <div
        style={overlayStyle}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        aria-modal="true"
        role="dialog"
        aria-label="Busca global"
      >
        <div style={panelStyle}>
          {/* Search bar */}
          <div style={searchBarStyle}>
            <Search size={16} color="#00ff4199" strokeWidth={2} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              style={inputStyle}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="// buscar no sistema..."
              spellCheck={false}
              autoComplete="off"
            />
            {query && (
              <button
                style={closeBtnStyle}
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                type="button"
                aria-label="Limpar busca"
              >
                <X size={12} color="#00ff4199" />
              </button>
            )}
          </div>

          {/* Shortcut hint when empty */}
          {!query && !searching && results.length === 0 && (
            <div style={shortcutHintStyle}>
              <span>Fechar com</span>
              <kbd style={kbdStyle}>ESC</kbd>
              <span style={{ marginLeft: 8 }}>Navegar com</span>
              <kbd style={kbdStyle}>↑</kbd>
              <kbd style={kbdStyle}>↓</kbd>
              <kbd style={kbdStyle}>↵</kbd>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                <kbd style={kbdStyle}>{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
                <span>para abrir</span>
              </span>
            </div>
          )}

          {/* Loading */}
          {searching && (
            <div style={spinnerWrapStyle}>
              <span style={spinnerStyle} />
              <span>Buscando...</span>
            </div>
          )}

          {/* Results */}
          {!searching && results.length > 0 && (
            <>
              <div style={sectionLabelStyle}>Conteúdo — {results.length} resultado{results.length !== 1 ? 's' : ''}</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {results.map((item, idx) => (
                  <ResultItem
                    key={item._id}
                    content={item}
                    active={idx === activeIndex}
                    onSelect={handleSelect}
                    onHover={() => setActiveIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}

          {/* No results */}
          {!searching && query.trim() && results.length === 0 && (
            <div style={noResultsStyle}>
              <Zap size={14} color="#00ff4155" />
              <span>Nenhum resultado para &quot;{query}&quot;</span>
            </div>
          )}

          {/* Footer */}
          <div style={footerStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <kbd style={kbdStyle}>↑↓</kbd> navegar
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <kbd style={kbdStyle}>↵</kbd> selecionar
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <kbd style={kbdStyle}>ESC</kbd> fechar
            </span>
            <span style={{ marginLeft: 'auto', color: '#00d4ff33' }}>
              ELITE TROJAN // SISTEMA
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Result Item ──────────────────────────────────────────────────────────────

function ResultItem({
  content,
  active,
  onSelect,
  onHover,
}: {
  content: Content;
  active: boolean;
  onSelect: (c: Content) => void;
  onHover: () => void;
}) {
  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    background: active ? 'rgba(0,255,65,0.09)' : 'transparent',
    borderLeft: active ? '2px solid #00ff41' : '2px solid transparent',
    transition: 'background 0.1s ease',
    borderBottom: '1px solid #00ff4108',
  };

  const iconWrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'rgba(0,255,65,0.08)',
    border: '1px solid #00ff4122',
    flexShrink: 0,
    marginTop: 1,
  };

  const titleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: active ? '#00ff41' : '#ccffcc',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.4,
    marginBottom: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 380,
  };

  const metaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 9,
    color: '#00ff4166',
    fontFamily: "'JetBrains Mono', monospace",
  };

  const tagStyle: CSSProperties = {
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid #00d4ff22',
    borderRadius: 3,
    padding: '1px 5px',
    color: '#00d4ff88',
    fontSize: 9,
  };

  const descStyle: CSSProperties = {
    fontSize: 10,
    color: '#ffffff55',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: 4,
  };

  const categoryName =
    typeof content.category === 'object' && content.category !== null
      ? content.category.name
      : null;

  return (
    <div
      style={itemStyle}
      className="gs-result-item"
      onClick={() => onSelect(content)}
      onMouseEnter={onHover}
      role="option"
      aria-selected={active}
    >
      <div style={iconWrapStyle}>
        {TYPE_ICONS[content.type] ?? <File size={13} color="#00ff4199" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{content.title}</div>
        {content.description && (
          <div style={descStyle}>{content.description}</div>
        )}
        <div style={metaStyle}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {content.type}
          </span>
          {categoryName && <span style={tagStyle}>{categoryName}</span>}
          {content.isFree && (
            <span style={{ ...tagStyle, color: '#00ff4188', borderColor: '#00ff4122', background: 'rgba(0,255,65,0.06)' }}>
              FREE
            </span>
          )}
          {content.isDrop && (
            <span style={{ ...tagStyle, color: '#ff440088', borderColor: '#ff440022', background: 'rgba(255,68,0,0.06)' }}>
              DROP
            </span>
          )}
          <span style={{ marginLeft: 'auto', color: '#00d4ff44' }}>
            {content.downloads} downloads
          </span>
        </div>
      </div>
    </div>
  );
}
