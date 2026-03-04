
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from "@/lib/utils";
import { Copy, Check } from 'lucide-react';
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
      const typingTimer = setTimeout(() => {
        const nextChunk = contentRef.current.substring(typingIndex, typingIndex + 2);
        setDisplayedContent(prev => prev + nextChunk);
        setTypingIndex(prev => prev + 2);
      }, 5);
      return () => clearTimeout(typingTimer);
    }
  }, [isTyping, isBot, typingIndex]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content);
    }
  }, [isTyping, content]);

  const CodeBlock = ({ className, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    };

    return (
      <div className="my-4 bg-gray-900 rounded-lg shadow-sm border border-gray-700">
        <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400 bg-gray-800">
          <span>{match ? match[1] : 'code'}</span>
          <button onClick={handleCopy} className="flex items-center gap-1.5">
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            {isCopied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <SyntaxHighlighter
          language={match ? match[1] : undefined}
          style={atomDark}
          customStyle={{ 
            padding: '1rem',
            fontSize: '14px',
            lineHeight: '1.6',
            backgroundColor: 'transparent',
            margin: 0,
          }}
          wrapLongLines={true}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className={cn(
      "w-full break-words text-[15px] leading-relaxed font-sans", // Modern, minimalist font
      isTyping && isBot && typingIndex < contentRef.current.length && "after:content-['▎'] after:animate-pulse after:ml-0.5 after:text-primary"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
          
          p: ({ children }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap">{children}</p>,
          
          table: ({ children }) => (
            <div className="my-6 rounded-lg border shadow-sm overflow-hidden"><Table>{children}</Table></div>
          ),
          thead: ({ children }) => <TableHeader className="bg-gray-50 dark:bg-gray-800">{children}</TableHeader>,
          tr: ({ children }) => <TableRow className="border-gray-200 dark:border-gray-700">{children}</TableRow>,
          th: ({ children }) => <TableHead className="font-semibold p-4">{children}</TableHead>,
          td: ({ children }) => <TableCell className="p-4">{children}</TableCell>,
          
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400">{children}</blockquote>
          ),

          ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>,
          li: ({ children }) => <li className="pb-1">{children}</li>,

          strong: ({ children }) => <strong className="font-bold">{children}</strong>,

          hr: () => <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />,

          code({ node, inline, className, children, ...props }) {
            return !inline ? (
              <CodeBlock className={className}>{children}</CodeBlock>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 text-red-500 dark:text-red-400 px-1.5 py-1 rounded-md font-mono text-sm" {...props}>
                {children}
              </code>
            );
          },

          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 break-words" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageMarkdownContent;
