import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Download, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BannerAd } from '@/components/ads';

interface GeneratedNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  noteType: string;
  content: string;
  keyPoints: string[];
  timestamp: string;
}

const NotesView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const note = location.state?.note as GeneratedNote | undefined;

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">कोई Notes नहीं मिला</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            वापस जाएं
          </Button>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(note.content);
    toast.success('📋 Notes clipboard में copy हो गए!');
  };

  const downloadNotes = () => {
    const element = document.createElement('a');
    const file = new Blob([note.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('📥 Notes download हो गए!');
  };

  const shareNotes = () => {
    if (navigator.share) {
      navigator.share({
        title: note.title,
        text: note.content,
      }).then(() => {
        toast.success('✅ Notes share किए गए!');
      }).catch(() => {
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">वापस</span>
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="gap-1.5 hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-sm">Copy</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareNotes}
                className="gap-1.5 hover:bg-muted"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-sm">Share</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadNotes}
                className="gap-1.5 hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-sm">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title Section */}
        <div className="mb-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2 text-xs mb-3">
            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md font-medium">
              {note.subject}
            </span>
            <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md">
              {note.noteType}
            </span>
            <span className="text-muted-foreground ml-auto">
              {new Date(note.timestamp).toLocaleDateString('hi-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
            {note.title}
          </h1>
        </div>

        {/* Key Points Section */}
        {note.keyPoints.length > 0 && (
          <div className="mb-6 p-5 bg-muted/40 border-l-4 border-primary rounded-md">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              🎯 मुख्य परिचय:
            </h2>
            <div className="space-y-2.5">
              {note.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <span className="text-primary font-bold text-base mt-0.5">•</span>
                  <p className="text-foreground leading-relaxed text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner Ad (between summary and content) */}
        <div className="mb-6">
          <p className="text-xs text-center text-muted-foreground mb-1">प्रायोजित</p>
          <BannerAd className="mx-auto" />
        </div>

        {/* Notes Content */}
        <div className="bg-background">
          <style>
            {`
              .notes-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', sans-serif;
                line-height: 1.75;
                color: hsl(var(--foreground));
                font-size: 15px;
              }
              
              .notes-content h1 {
                font-size: 1.75rem;
                font-weight: 700;
                color: hsl(var(--foreground));
                margin-top: 2rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid hsl(var(--primary) / 0.3);
              }
              
              .notes-content h2 {
                font-size: 1.5rem;
                font-weight: 700;
                color: hsl(var(--foreground));
                margin-top: 1.75rem;
                margin-bottom: 0.875rem;
                padding-bottom: 0.375rem;
                border-bottom: 1px solid hsl(var(--border));
              }
              
              .notes-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: hsl(var(--foreground));
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              
              .notes-content h4 {
                font-size: 1.125rem;
                font-weight: 600;
                color: hsl(var(--foreground));
                margin-top: 1.25rem;
                margin-bottom: 0.625rem;
              }
              
              .notes-content p {
                margin-bottom: 1rem;
                line-height: 1.8;
                color: hsl(var(--foreground));
              }
              
              .notes-content ul {
                margin-left: 1.5rem;
                margin-bottom: 1rem;
                list-style-type: none;
              }
              
              .notes-content ul li {
                margin-bottom: 0.625rem;
                line-height: 1.75;
                color: hsl(var(--foreground));
                position: relative;
                padding-left: 1.5rem;
              }
              
              .notes-content ul li::before {
                content: "●";
                position: absolute;
                left: 0;
                color: hsl(var(--primary));
                font-size: 0.875rem;
                font-weight: bold;
              }
              
              .notes-content ol {
                margin-left: 1.5rem;
                margin-bottom: 1rem;
                list-style-type: decimal;
              }
              
              .notes-content ol li {
                margin-bottom: 0.625rem;
                line-height: 1.75;
                color: hsl(var(--foreground));
                padding-left: 0.5rem;
              }
              
              .notes-content strong,
              .notes-content b {
                font-weight: 700;
                color: hsl(var(--foreground));
              }
              
              .notes-content em,
              .notes-content i {
                font-style: italic;
              }
              
              .notes-content code {
                background: hsl(var(--muted));
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-family: 'Courier New', monospace;
                font-size: 0.875em;
                color: hsl(var(--primary));
              }
              
              .notes-content pre {
                background: hsl(var(--muted));
                padding: 1rem;
                border-radius: 0.5rem;
                overflow-x: auto;
                margin: 1rem 0;
              }
              
              .notes-content blockquote {
                border-left: 4px solid hsl(var(--primary));
                padding-left: 1rem;
                margin: 1.25rem 0;
                color: hsl(var(--muted-foreground));
                font-style: italic;
                background: hsl(var(--muted) / 0.3);
                padding: 1rem 1rem 1rem 1.5rem;
                border-radius: 0.375rem;
              }
              
              .notes-content hr {
                border: none;
                border-top: 1px solid hsl(var(--border));
                margin: 2rem 0;
              }

              .notes-content table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
              }

              .notes-content th,
              .notes-content td {
                border: 1px solid hsl(var(--border));
                padding: 0.5rem;
                text-align: left;
              }

              .notes-content th {
                background: hsl(var(--muted));
                font-weight: 600;
              }
            `}
          </style>
          <div className="notes-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 py-3 text-center text-xs text-muted-foreground">
          💡 आप इन notes को copy, share या download कर सकते हैं
        </div>
      </div>
    </div>
  );
};

export default NotesView;
