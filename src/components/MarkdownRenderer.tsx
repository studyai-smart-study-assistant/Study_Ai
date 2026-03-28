
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]} // For tables, strikethrough, etc.
      className="prose prose-sm dark:prose-invert max-w-none text-base leading-7"
      components={{
        // Custom renderer for code blocks to add syntax highlighting
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={a11yDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Custom renderer for tables to add some styling
        table({ children }) {
          return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table></div>;
        },
        thead({ children }) {
            return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
        },
        th({ children }) {
            return <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{children}</th>
        },
        tbody({ children }) {
            return <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
        },
        tr({ children }) {
            return <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">{children}</tr>
        },
        td({ children }) {
            return <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{children}</td>
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
