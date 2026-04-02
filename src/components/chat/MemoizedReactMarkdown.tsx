
import React, { FC, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

// Custom component for code blocks to add a copy button
const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        copyToClipboard(code);
    };

    if (inline) {
        return <code className="bg-muted text-foreground font-mono text-sm px-1 py-0.5 rounded" {...props}>{children}</code>;
    }

    return (
        <div className="relative text-sm bg-[#282c34] rounded-lg my-4 overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-1 bg-muted/50">
                <span className="text-xs text-muted-foreground lowercase">{match ? match[1] : 'code'}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match ? match[1] : undefined}
                PreTag="div"
                {...props}
                customStyle={{ margin: 0, padding: '1rem' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

const components = {
    code: CodeBlock,
    table: ({ node, ...props }: any) => <div className="overflow-x-auto"><table className="w-full" {...props} /></div>,
    a: ({ node, ...props }: any) => <a className="text-primary hover:underline" {...props} />,
};

const MemoizedReactMarkdown: FC<{ content: string }> = memo(({ content }) => {
    return (
        <ReactMarkdown
            // @ts-ignore - className is supported by react-markdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {content}
        </ReactMarkdown>
    );
}, (prevProps, nextProps) => prevProps.content === nextProps.content);

export default MemoizedReactMarkdown;
