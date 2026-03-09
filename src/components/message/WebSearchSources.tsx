import React, { useState } from 'react';
import { ExternalLink, Globe, ChevronDown, ChevronUp, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  title: string;
  url: string;
}

interface WebSearchSourcesProps {
  sources: Source[];
  label?: string;
}

const WebSearchSources: React.FC<WebSearchSourcesProps> = ({ sources, label }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!sources || sources.length === 0) return null;

  const visibleSources = expanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;

  return (
    <motion.div 
      className="mt-4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          {label === 'news' ? (
            <Newspaper className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-primary" />
          )}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {label === 'news' ? 'News Sources' : 'Sources'}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sources.length}
        </span>
      </div>

      {/* Sources list */}
      <div className="divide-y divide-border/30">
        <AnimatePresence initial={false}>
          {visibleSources.map((source, index) => {
            const hostname = (() => {
              try { return new URL(source.url).hostname.replace('www.', ''); } 
              catch { return source.url; }
            })();
            
            return (
              <motion.a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                {/* Favicon + number */}
                <div className="flex items-center gap-2 mt-0.5 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground/60 w-4 text-right">
                    {index + 1}
                  </span>
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                    alt="" 
                    className="h-5 w-5 rounded-sm"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display = 'none'; 
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {source.title || hostname}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    {hostname}
                  </p>
                </div>

                {/* External link */}
                <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 bg-muted/20 hover:bg-muted/40"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              View all {sources.length} sources
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default WebSearchSources;
