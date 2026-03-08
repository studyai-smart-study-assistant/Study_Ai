import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

interface Source {
  title: string;
  url: string;
}

interface WebSearchSourcesProps {
  sources: Source[];
}

const WebSearchSources: React.FC<WebSearchSourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sources</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const hostname = (() => {
            try { return new URL(source.url).hostname.replace('www.', ''); } 
            catch { return source.url; }
          })();
          
          return (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all duration-200 group"
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`} 
                alt="" 
                className="h-3.5 w-3.5 rounded-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground truncate max-w-[180px]">
                {source.title || hostname}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default WebSearchSources;
