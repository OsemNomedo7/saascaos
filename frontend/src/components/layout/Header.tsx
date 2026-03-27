'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, X, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { searchApi } from '@/lib/api';
import { getInitials, formatRelativeDate, truncateText } from '@/lib/utils';
import type { Content } from '@/types';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    clearTimeout(searchTimer.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchApi.search({ q: query, limit: 5 });
        setSearchResults(response.data.results?.content?.items || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/content?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header className="h-14 bg-gray-900/95 border-b border-gray-800/60 flex items-center px-4 gap-4 sticky top-0 z-30 backdrop-blur-sm">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-xl relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search content..."
              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-colors"
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Search results dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
            {isSearching ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      router.push(`/content?id=${item._id}`);
                      setShowResults(false);
                      clearSearch();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left border-b border-gray-800/40 last:border-0"
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                      {item.type === 'programa' ? '💻' : item.type === 'video' ? '🎥' : item.type === 'database' ? '🗄️' : '📄'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">{truncateText(item.description, 60)}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleSearchSubmit}
                  className="w-full px-4 py-2.5 text-xs text-green-400 hover:bg-gray-800/40 transition-colors text-center"
                >
                  See all results for &ldquo;{searchQuery}&rdquo;
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications placeholder */}
        <button className="relative p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-400 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
          <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user?.name || 'U')
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-300 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-600 leading-tight capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
