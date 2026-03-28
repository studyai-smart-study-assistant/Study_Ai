
import React from 'react';
import { Globe } from 'lucide-react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchResultsProps {
  results: SearchResult[];
  status: string;
}

const WebSearchResults: React.FC<WebSearchResultsProps> = ({ results, status }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 my-4">
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Sources</h3>
            <span className="text-xs text-muted-foreground ml-auto">{status}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((result, index) => (
              <a
                key={index}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
              >
                <p className="text-sm font-medium text-primary truncate group-hover:underline">
                  {result.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {new URL(result.link).hostname}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSearchResults;
