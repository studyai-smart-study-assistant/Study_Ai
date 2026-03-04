
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from "@/lib/utils";
import { Download, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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

const MessageMarkdownContent: React.FC<MessageMarkdownContentProps> = ({ 
  content,
  isTyping,
  isBot
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const contentRef = useRef(content);
  const typingSpeedRef = useRef(15);

  useEffect(() => {
    contentRef.current = content;
    if (!isTyping || !isBot) {
      setDisplayedContent(content);
      setTypingIndex(content.length);
    } else {
      setTypingIndex(0);
    }
  }, [content, isBot]);

  useEffect(() => {
    if (isTyping && isBot && typingIndex < contentRef.current.length) {
      const typingTimer = setTimeout(() => {
        const nextIndex = Math.min(typingIndex + typingSpeedRef.current, contentRef.current.length);
        setDisplayedContent(contentRef.current.substring(0, nextIndex));
        setTypingIndex(nextIndex);
      }, 2);
      return () => clearTimeout(typingTimer);
    }
  }, [isTyping, isBot, typingIndex, content]);

  useEffect(() => {
    if (!isTyping || typingIndex >= contentRef.current.length) {
      setDisplayedContent(contentRef.current);
    }
  }, [isTyping, typingIndex]);

  const imageMatch = displayedContent.match(/\[Image:\s*(data:image\/[^;]+;base64,[^\]]+)\]/);
  const imageUrl = imageMatch ? imageMatch[1] : null;
  const textWithoutImage = imageUrl ? displayedContent.replace(/\[Image:[^\]]+\]/, '').trim() : displayedContent;

  const handleDownload = () => {
    if (!imageUrl) return;
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  return (
    <div className={cn(
      "max-w-none w-full break-words overflow-hidden",
      "text-base leading-[1.7] text-foreground font-[system-ui,-apple-system,sans-serif]",
      isTyping && isBot && typingIndex < contentRef.current.length && "after:content-['▎'] after:animate-pulse after:ml-0.5 after:text-primary"
    )}>
      {imageUrl && (
        <div className="my-6 space-y-3">
          <div className="relative group rounded-xl overflow-hidden border border-border/50">
            <img 
              src={imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto max-w-2xl mx-auto"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button onClick={handleDownload} size="sm" variant="secondary">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[26px] font-bold mt-8 mb-4 pb-2 border-b border-border/40 text-foreground">
              📚 {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[22px] font-semibold mt-7 mb-3 text-foreground">
              📝 {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[18px] font-medium mt-6 mb-2.5 text-foreground">
              📌 {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mt-5 mb-2 text-foreground">
              ▸ {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="my-3 whitespace-pre-wrap break-words text-base leading-[1.75] text-foreground/85">
              {children}
            </p>
          ),

          // Tables: clean comparison style
          table: ({ children }) => (
            <div className="my-6 rounded-lg border border-border/60 overflow-hidden">
              <Table>
                {children}
              </Table>
            </div>
          ),
          thead: ({ children }) => (
            <TableHeader className="bg-muted/50">
              {children}
            </TableHeader>
          ),
          tbody: ({ children }) => (
            <TableBody>{children}</TableBody>
          ),
          tr: ({ children }) => (
            <TableRow className="border-b border-border/30">
              {children}
            </TableRow>
          ),
          th: ({ children }) => (
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4">
              {children}
            </TableHead>
          ),
          td: ({ children }) => (
            <TableCell className="py-3 px-4 text-sm text-foreground/80">
              {children}
            </TableCell>
          ),

          // Blockquote: definitions/quotes with accent
          blockquote: ({ children }) => (
            <div className="my-5 relative">
              <div className="absolute top-3 left-4 text-primary/15">
                <Quote className="h-7 w-7" />
              </div>
              <blockquote className="border-l-[3px] border-primary/50 bg-primary/[0.03] rounded-r-lg pl-12 pr-5 py-4 italic text-foreground/75">
                {children}
              </blockquote>
            </div>
          ),

          ul: ({ children }) => (
            <ul className="my-3 ml-1 space-y-1.5 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-1 space-y-1.5 list-decimal list-inside marker:text-foreground/40 marker:font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-[1.7] text-foreground/85 flex items-start gap-2">
              <span className="text-foreground/30 mt-1.5 flex-shrink-0 text-sm">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic text-foreground/70">{children}</em>
          ),

          hr: () => (
            <hr className="my-8 border-none h-px bg-border/30" />
          ),

          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            
            return !inline && match ? (
              <div className="my-5 rounded-lg overflow-hidden border border-border/50">
                <div className="bg-[hsl(var(--foreground)/0.9)] px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--background)/0.5)] font-mono">{match[1]}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(children));
                      toast.success('Copied!');
                    }}
                    className="text-xs text-[hsl(var(--background)/0.5)] hover:text-[hsl(var(--background)/0.8)] transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language={match[1]}
                  style={atomDark}
                  PreTag="div"
                  wrapLines
                  wrapLongLines
                  {...props}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    overflowX: 'auto',
                    maxWidth: '100%',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn(
                "whitespace-pre-wrap bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground/80",
                className
              )} {...props}>
                {children}
              </code>
            )
          },

          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors break-words" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {textWithoutImage}
      </ReactMarkdown>
    </div>
  );
};

export default MessageMarkdownContent;
