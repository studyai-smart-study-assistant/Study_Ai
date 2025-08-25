import React from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchHistoryService } from '@/services/youtubeService';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchHistoryProps {
  onSearchSelect: (term: string) => void;
  onClose: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  onSearchSelect,
  onClose
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const [history, setHistory] = React.useState<string[]>([]);

  React.useEffect(() => {
    setHistory(SearchHistoryService.getSearchHistory());
  }, []);

  const handleRemoveItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SearchHistoryService.removeSearchTerm(term);
    setHistory(SearchHistoryService.getSearchHistory());
  };

  const handleClearAll = () => {
    SearchHistoryService.clearSearchHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isHindi ? 'खोज इतिहास' : 'Search History'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {isHindi ? 'कोई खोज इतिहास नहीं मिला' : 'No search history found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isHindi ? 'खोज इतिहास' : 'Search History'}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isHindi ? 'सभी हटाएं' : 'Clear All'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {history.map((term, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors group"
            onClick={() => onSearchSelect(term)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 dark:text-white truncate">
                {term}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleRemoveItem(term, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-gray-400 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};