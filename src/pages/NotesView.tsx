import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Download, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">वापस जाएं</span>
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareNotes}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadNotes}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {note.subject}
            </span>
            <span className="px-3 py-1 bg-secondary/50 rounded-full">
              {note.noteType}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            📘 {note.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(note.timestamp).toLocaleDateString('hi-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Key Points Section */}
        {note.keyPoints.length > 0 && (
          <div className="mb-8 p-6 bg-accent/30 border-l-4 border-primary rounded-lg">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              🎯 मुख्य बिंदु
            </h2>
            <ul className="space-y-3">
              {note.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg mt-0.5">•</span>
                  <span className="text-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes Content */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <ScrollArea className="h-auto max-h-[70vh]">
            <div className="p-6 sm:p-8 lg:p-10">
              <style>
                {`
                  .notes-content {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans', sans-serif;
                    line-height: 1.8;
                    color: hsl(var(--foreground));
                  }
                  
                  .notes-content h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: hsl(var(--primary));
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid hsl(var(--primary));
                  }
                  
                  .notes-content h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: hsl(var(--primary));
                    margin-top: 1.75rem;
                    margin-bottom: 0.875rem;
                  }
                  
                  .notes-content h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: hsl(var(--primary));
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                  }
                  
                  .notes-content h4 {
                    font-size: 1.25rem;
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
                  
                  .notes-content ul,
                  .notes-content ol {
                    margin-left: 1.5rem;
                    margin-bottom: 1rem;
                    padding-left: 0.5rem;
                  }
                  
                  .notes-content li {
                    margin-bottom: 0.5rem;
                    line-height: 1.7;
                    color: hsl(var(--foreground));
                  }
                  
                  .notes-content ul li {
                    list-style-type: disc;
                  }
                  
                  .notes-content ol li {
                    list-style-type: decimal;
                  }
                  
                  .notes-content strong,
                  .notes-content b {
                    font-weight: 700;
                    color: hsl(var(--primary));
                  }
                  
                  .notes-content em,
                  .notes-content i {
                    font-style: italic;
                    color: hsl(var(--foreground));
                  }
                  
                  .notes-content code {
                    background: hsl(var(--muted));
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                    color: hsl(var(--foreground));
                  }
                  
                  .notes-content blockquote {
                    border-left: 4px solid hsl(var(--primary));
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: hsl(var(--muted-foreground));
                    font-style: italic;
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
                  
                  /* Emoji and Icon Support */
                  .notes-content h1::before,
                  .notes-content h2::before,
                  .notes-content h3::before {
                    margin-right: 0.5rem;
                  }
                `}
              </style>
              <div 
                className="notes-content whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: note.content.replace(/\n/g, '<br />') }}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> आप इन notes को copy, share या download कर सकते हैं
        </div>
      </div>
    </div>
  );
};

export default NotesView;
