
import React, { useEffect, useState, useRef, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Copy, Check, BookOpen, Brain, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MessageMarkdownContentProps {
  content: string;
  isTyping: boolean;
  isBot: boolean;
}

// Dynamically import the SyntaxHighlighter
const LazySyntaxHighlighter = React.lazy(async () => {
  const [{ Prism }, { atomDark }] = await Promise.all([
    import('react-syntax-highlighter'),
    import('react-syntax-highlighter/dist/esm/styles/prism')
  ]);
  return { default: (props: any) => <Prism {...props} style={atomDark} /> };
});

const MessageMarkdownContent: React.FC<MessageMarkdownContentProps> = ({
  content,
  isTyping,
  isBot
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
    if (!isTyping || !isBot) {
      setDisplayedContent(content);
      setTypingIndex(content.length);
    } else {
      setTypingIndex(0);
      setDisplayedContent('');
    }
  }, [content, isTyping, isBot]);

  useEffect(() => {
    if (isTyping && isBot && typingIndex < contentRef.current.length) {
      const chunkSize = Math.min(4, contentRef.current.length - typingIndex);
      const typingTimer = setTimeout(() => {
        const nextChunk = contentRef.current.substring(typingIndex, typingIndex + chunkSize);
        setDisplayedContent(prev => prev + nextChunk);
        setTypingIndex(prev => prev + chunkSize);
      }, 3);
      return () => clearTimeout(typingTimer);
    }
  }, [isTyping, isBot, typingIndex]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content);
    }
  }, [isTyping, content]);

  const CodeBlock = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    };
    
    const preloader = (
        <pre style={{ padding: '1rem', fontSize: '13px', lineHeight: '1.7', backgroundColor: '#1a1b26', margin: 0, borderRadius: 0, color: 'white', overflowX: 'auto' }}>
            <code>{codeString}</code>
        </pre>
    );

    return (
      <div className="my-4 rounded-xl overflow-hidden border border-border/50 shadow-sm">
        <div className="px-4 py-2 flex items-center justify-between text-xs bg-muted/80 border-b border-border/50">
          <span className="font-mono text-muted-foreground">{match ? match[1] : 'code'}</span>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <Suspense fallback={preloader}>
            <LazySyntaxHighlighter
              language={match ? match[1] : undefined}
              customStyle={{ 
                padding: '1rem',
                fontSize: '13px',
                lineHeight: '1.7',
                backgroundColor: '#1a1b26',
                margin: 0,
                borderRadius: 0,
              }}
              wrapLongLines={true}
            >
              {codeString}
            </LazySyntaxHighlighter>
        </Suspense>
      </div>
    );
  };

  // Custom details/summary renderer for quiz answers
  const DetailsBlock = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="my-3 rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors text-left"
        >
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Lightbulb size={16} />
            ✅ Answer देखें
          </span>
          {isOpen ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />}
        </button>
        {isOpen && (
          <div className="px-4 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Pre-process content to handle <details> blocks
  const processContent = (text: string) => {
    // Replace <details><summary>...</summary>...</details> with custom markers
    return text
      .replace(/<details>\s*<summary>(.*?)<\/summary>/gi, '\n:::answer-start $1\n')
      .replace(/<\/details>/gi, '\n:::answer-end\n');
  };

  const processedContent = processContent(displayedContent);
  
  // Split content by answer blocks and render
  const renderContent = () => {
    const parts = processedContent.split(/:::answer-start|:::answer-end/);
    if (parts.length <= 1) {
      return renderMarkdown(processedContent);
    }

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is an answer block - first line is summary text, rest is content
        const lines = part.trim().split('\n');
        const content = lines.slice(1).join('\n');
        return (
          <DetailsBlock key={index}>
            {renderMarkdown(content)}
          </DetailsBlock>
        );
      }
      return <React.Fragment key={index}>{renderMarkdown(part)}</React.Fragment>;
    });
  };

  const renderMarkdown = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b-2 border-primary/20 text-foreground flex items-center gap-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold mt-5 mb-3 text-foreground flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full inline-block" />
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground/90">{children}</h3>
        ),
        
        p: ({ node, children }) => {
            if (node.children[0]?.tagName === "code") {
              return <div>{children}</div>;
            }
            return <p className="mb-3.5 last:mb-0 leading-[1.8] text-foreground/90">{children}</p>;
        },
        
        table: ({ children }) => (
          <div className="my-5 rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <Table>{children}</Table>
          </div>
        ),
        thead: ({ children }) => <TableHeader className="bg-muted/60">{children}</TableHeader>,
        tr: ({ children }) => <TableRow className="border-border/40 hover:bg-muted/30 transition-colors">{children}</TableRow>,
        th: ({ children }) => <TableHead className="font-semibold p-3 text-sm">{children}</TableHead>,
        td: ({ children }) => <TableCell className="p-3 text-sm">{children}</TableCell>,
        
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-primary/40 bg-primary/5 rounded-r-xl pl-4 pr-3 py-3 text-foreground/80 italic">
            {children}
          </blockquote>
        ),

        ul: ({ children }) => <ul className="my-3 ml-5 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 ml-5 list-decimal space-y-2">{children}</ol>,
        li: ({ children }) => (
          <li className="pb-0.5 text-foreground/90 leading-relaxed marker:text-primary/60">
            {children}
          </li>
        ),

        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,

        hr: () => <hr className="my-6 border-t border-border/40" />,

        code({ node, inline, className, children, ...props }: any) {
          return !inline ? (
            <CodeBlock className={className}>{children}</CodeBlock>
          ) : (
            <code className="bg-primary/10 text-primary dark:text-primary px-1.5 py-0.5 rounded-md font-mono text-[13px] font-medium" {...props}>
              {children}
            </code>
          );
        },

        a: ({ children, href }) => (
          <a href={href} className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 transition-colors break-words" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div className={cn(
      "w-full break-words text-[14.5px] leading-relaxed",
      isTyping && isBot && typingIndex < contentRef.current.length && "after:content-['▎'] after:animate-pulse after:ml-0.5 after:text-primary"
    )}>
      {renderContent()}
    </div>
  );
};

export default MessageMarkdownContent;
