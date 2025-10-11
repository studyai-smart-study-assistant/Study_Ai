
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from "@/lib/utils";
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const typingSpeedRef = useRef(15); // Super fast typing speed (15 characters per render)

  // Reset typing animation when content changes
  useEffect(() => {
    contentRef.current = content;
    if (!isTyping || !isBot) {
      setDisplayedContent(content);
      setTypingIndex(content.length);
    } else {
      setTypingIndex(0);
    }
  }, [content, isBot]);

  // Handle typing animation
  useEffect(() => {
    if (isTyping && isBot && typingIndex < contentRef.current.length) {
      const typingTimer = setTimeout(() => {
        // Add multiple characters per render cycle for faster typing
        const nextIndex = Math.min(typingIndex + typingSpeedRef.current, contentRef.current.length);
        const nextContent = contentRef.current.substring(0, nextIndex);
        setDisplayedContent(nextContent);
        setTypingIndex(nextIndex);
      }, 2); // Ultra fast interval (2ms instead of 5ms)

      return () => clearTimeout(typingTimer);
    }
  }, [isTyping, isBot, typingIndex, content]);

  // Ensure we display the full content when typing is complete
  useEffect(() => {
    if (!isTyping || typingIndex >= contentRef.current.length) {
      setDisplayedContent(contentRef.current);
    }
  }, [isTyping, typingIndex]);

  // Extract image URL from content if present
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
      "prose dark:prose-invert max-w-none w-full break-words overflow-hidden prose-p:my-1 prose-pre:my-2 prose-headings:mt-3 prose-headings:mb-2",
      "prose-pre:overflow-x-auto prose-code:whitespace-pre-wrap",
      isTyping && isBot && typingIndex < contentRef.current.length && "after:content-['▎'] after:animate-pulse after:ml-0.5 after:text-purple-500"
    )}>
      {/* Display generated image if present */}
      {imageUrl && (
        <div className="my-4 space-y-3">
          <div className="relative group rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <img 
              src={imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto max-w-2xl mx-auto"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-white/90 hover:bg-white text-purple-700 shadow-lg"
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
      
      {/* Display text content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                style={atomDark}
                PreTag="div"
                wrapLines={true}
                wrapLongLines={true}
                {...props}
                customStyle={{
                  borderRadius: '0.375rem',
                  overflowX: 'auto',
                  maxWidth: '100%'
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn(className, "whitespace-pre-wrap")} {...props}>
                {children}
              </code>
            )
          },
          p({children}) {
            return <p className="whitespace-pre-wrap break-words">{children}</p>
          },
          a({children, href}) {
            return <a href={href} className="break-words" target="_blank" rel="noopener noreferrer">{children}</a>
          }
        }}
      >
        {textWithoutImage}
      </ReactMarkdown>
    </div>
  );
};

export default MessageMarkdownContent;
