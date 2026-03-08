import React, { useState, useRef } from 'react';
import { Search, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchHistoryService } from '@/services/youtubeService';
import { sanitizeSearchQuery } from '@/utils/videoUtils';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onShowHistory: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onShowHistory,
  placeholder = 'Search videos...',
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedQuery = sanitizeSearchQuery(searchTerm);
    if (sanitizedQuery) {
      SearchHistoryService.addSearchTerm(sanitizedQuery);
      onSearch(sanitizedQuery);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-20 h-10 text-sm bg-muted/50 border border-border rounded-full outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all placeholder:text-muted-foreground"
          />
          
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={onShowHistory}
            className="absolute right-2 p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
