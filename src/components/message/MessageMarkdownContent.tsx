
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from "@/lib/utils";
import { Download, Quote, Lightbulb, Star } from 'lucide-react';
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
        const nextContent = contentRef.current.substring(0, nextIndex);
        setDisplayedContent(nextContent);
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
      toast.success('Image download शुरू हो गया!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download में समस्या हुई');
    }
  };

  return (
    <div className={cn(
      "max-w-none w-full break-words overflow-hidden",
      "text-[15px] leading-[1.8] text-foreground",
      isTyping && isBot && typingIndex < contentRef.current.length && "after:content-['▎'] after:animate-pulse after:ml-0.5 after:text-primary"
    )}>
      {imageUrl && (
        <div className="my-5 space-y-3">
          <div className="relative group rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <img 
              src={imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto max-w-2xl mx-auto"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-white/90 hover:bg-white text-foreground shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground italic">
            ✨ AI द्वारा generate की गई image
          </p>
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // --- HEADERS with emojis & structure ---
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-border text-foreground flex items-center gap-2">
              <span>📚</span> {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-2.5 text-foreground flex items-center gap-2">
              <span>📝</span> {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground flex items-center gap-2">
              <span>📌</span> {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mt-3 mb-1.5 text-foreground flex items-center gap-2">
              <span>▸</span> {children}
            </h4>
          ),

          // --- PARAGRAPHS with breathing room ---
          p: ({ children }) => (
            <p className="my-2.5 whitespace-pre-wrap break-words text-[15px] leading-[1.8] text-foreground/90">
              {children}
            </p>
          ),

          // --- TABLES: Clean comparison style ---
          table: ({ children }) => (
            <div className="my-5 rounded-xl border border-border overflow-hidden shadow-sm">
              <Table>
                {children}
              </Table>
            </div>
          ),
          thead: ({ children }) => (
            <TableHeader className="bg-muted/70">
              {children}
            </TableHeader>
          ),
          tbody: ({ children }) => (
            <TableBody>{children}</TableBody>
          ),
          tr: ({ children }) => (
            <TableRow className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              {children}
            </TableRow>
          ),
          th: ({ children }) => (
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4">
              {children}
            </TableHead>
          ),
          td: ({ children }) => (
            <TableCell className="py-3 px-4 text-sm text-foreground/85">
              {children}
            </TableCell>
          ),

          // --- BLOCKQUOTE: Definitions/Quotes style ---
          blockquote: ({ children }) => (
            <div className="my-4 relative">
              <div className="absolute top-3 left-4 text-primary/20">
                <Quote className="h-8 w-8" />
              </div>
              <blockquote className="border-l-4 border-primary/60 bg-primary/5 dark:bg-primary/10 rounded-r-xl pl-12 pr-5 py-4 italic text-foreground/80">
                {children}
              </blockquote>
            </div>
          ),

          // --- LISTS: Clean bullet/numbered ---
          ul: ({ children }) => (
            <ul className="my-3 ml-1 space-y-1.5 list-none">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === 'li') {
                  return child;
                }
                return child;
              })}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-1 space-y-1.5 list-decimal list-inside marker:text-primary marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children, ordered, ...props }) => (
            <li className="text-[15px] leading-[1.7] text-foreground/90 flex items-start gap-2">
              <span className="text-primary mt-1.5 flex-shrink-0">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // --- STRONG: Accent highlight for key terms ---
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground bg-primary/10 px-1 rounded">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic text-primary/80">{children}</em>
          ),

          // --- HR: Clean separator ---
          hr: () => (
            <hr className="my-6 border-none h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          ),

          // --- CODE blocks ---
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            
            return !inline && match ? (
              <div className="my-4 rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="bg-muted-foreground/90 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-background/60 font-mono">{match[1]}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(children));
                      toast.success('Code copied!');
                    }}
                    className="text-xs text-background/60 hover:text-background transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language={match[1]}
                  style={atomDark}
                  PreTag="div"
                  wrapLines={true}
                  wrapLongLines={true}
                  {...props}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    overflowX: 'auto',
                    maxWidth: '100%',
                    fontSize: '13px',
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn(
                "whitespace-pre-wrap bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary",
                className
              )} {...props}>
                {children}
              </code>
            )
          },

          // --- LINKS ---
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors break-words" 
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
