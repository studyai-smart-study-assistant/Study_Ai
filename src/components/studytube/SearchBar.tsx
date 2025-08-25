import React, { useState, useRef, useEffect } from 'react';
import { Search, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchHistoryService } from '@/services/youtubeService';
import { debounce, sanitizeSearchQuery } from '@/utils/videoUtils';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedShowSuggestions = debounce(() => {
    setShowSuggestions(true);
  }, 300);

  useEffect(() => {
    if (searchTerm) {
      setShowSuggestions(false);
    } else {
      debouncedShowSuggestions();
    }
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedQuery = sanitizeSearchQuery(searchTerm);
    if (sanitizedQuery) {
      SearchHistoryService.addSearchTerm(sanitizedQuery);
      onSearch(sanitizedQuery);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    const sanitizedQuery = sanitizeSearchQuery(query);
    setSearchTerm(sanitizedQuery);
    SearchHistoryService.addSearchTerm(sanitizedQuery);
    onSearch(sanitizedQuery);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const suggestionQueries = [
    'Mathematics tutorials hindi',
    'Science experiments for students',
    'English grammar lessons',
    'History lessons in hindi',
    'Programming for beginners',
    'Physics concepts explained',
    'Chemistry practical',
    'Biology class 10'
  ];

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-20 h-12 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-400 rounded-full shadow-sm"
          />
          
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-12 h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onShowHistory}
            className="absolute right-2 h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Quick suggestions when search is empty */}
      {!searchTerm && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Suggested searches:
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestionQueries.map((query) => (
              <Button
                key={query}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(query)}
                className="text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600"
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};