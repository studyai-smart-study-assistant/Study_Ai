import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import MessageEditor from './MessageEditor';
import MessageMarkdownContent from './MessageMarkdownContent';
import ImageModal from '@/components/ui/image-modal';
import InlineQuizCard from '@/components/chat/InlineQuizCard';
import { ZoomIn, Download, Brain, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

interface MessageBodyProps {
  isUserMessage: boolean;
  isEditing: boolean;
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  isTyping: boolean;
  displayedContent: string;
  onEditImage?: (imageUrl: string, originalPrompt: string) => void;
}

// Parse thinking block from content
function parseThinking(content: string): { thinking: string | null; rest: string } {
  const match = content.match(/^\[THINKING:([^\]]+)\]/);
  if (match) {
    return { thinking: match[1], rest: content.replace(match[0], '') };
  }
  return { thinking: null, rest: content };
}

// Parse image from content - handles both base64 and URL formats
function parseImage(content: string): { imageUrl: string; rest: string } {
  // Match [IMG_DATA:...] anywhere - use greedy match up to the last ] before text
  const imgDataMatch = content.match(/\[IMG_DATA:(data:image\/[^[\]]*(?:\][^[\]]*)*)\]/);
  if (!imgDataMatch) {
    // Try non-base64 URL format: [IMG_DATA:https://...]
    const urlMatch = content.match(/\[IMG_DATA:(https?:\/\/[^\]]+)\]/);
    if (urlMatch) {
      return { imageUrl: urlMatch[1], rest: content.replace(urlMatch[0], '').trim() };
    }
    // Legacy format: [Image: url]
    const linkMatch = content.match(/\[Image:\s*([^\]]+)\]/);
    if (linkMatch) {
      return { imageUrl: linkMatch[1].trim(), rest: content.replace(/\[Image:\s*[^\]]+\]/, '').trim() };
    }
    return { imageUrl: '', rest: content };
  }
  return { imageUrl: imgDataMatch[1], rest: content.replace(imgDataMatch[0], '').trim() };
}

// Parse quiz data from content
function parseQuizData(content: string): { quizData: any | null; rest: string } {
  const match = content.match(/\[QUIZ_DATA:([\s\S]+)\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return { quizData: parsed, rest: content.replace(match[0], '').trim() };
      }
    } catch {}
  }
  return { quizData: null, rest: content };
}

// Thinking indicator component
const ThinkingBadge: React.FC<{ thinking: string }> = ({ thinking }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Determine icon/color based on thinking content
  const getThinkingStyle = () => {
    if (thinking.includes('🎨') || thinking.includes('Image')) return { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-800' };
    if (thinking.includes('📝') || thinking.includes('Notes')) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' };
    if (thinking.includes('🎯') || thinking.includes('Quiz')) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
    if (thinking.includes('🔍') || thinking.includes('Search')) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
    return { color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border/50' };
  };

  const style = getThinkingStyle();

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "w-full text-left rounded-xl border px-3 py-2 mb-2 transition-all duration-200",
        style.bg, style.border,
        "hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain size={14} className={cn(style.color, "animate-pulse")} />
          <span className={cn("text-xs font-medium", style.color)}>
            {expanded ? 'Thinking Process' : 'AI ने सोचा...'}
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className={style.color} /> : <ChevronDown size={14} className={style.color} />}
      </div>
      {expanded && (
        <p className={cn("mt-1.5 text-xs leading-relaxed", style.color)}>
          {thinking}
        </p>
      )}
    </button>
  );
};

const MessageBody: React.FC<MessageBodyProps> = ({
  isUserMessage,
  isEditing,
  editedContent,
  setEditedContent,
  handleSaveEdit,
  handleCancelEdit,
  isTyping,
  displayedContent,
  onEditImage
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // ── User Message ──
  if (isUserMessage) {
    const { imageUrl, rest: textContent } = parseImage(displayedContent);

    const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!imageUrl) return;
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className="flex flex-col items-end gap-2 max-w-[85%]">
          {imageUrl && !isEditing && (
            <div className="relative group rounded-2xl overflow-hidden border border-border/40 shadow-sm cursor-pointer bg-muted/30" onClick={() => setImageModalOpen(true)}>
              <img src={imageUrl} alt="Uploaded" className="max-w-[280px] sm:max-w-[320px] max-h-[300px] rounded-2xl object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-3">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2"><ZoomIn className="h-5 w-5 text-white" /></div>
                <button onClick={handleDownload} className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2 hover:bg-black/70"><Download className="h-5 w-5 text-white" /></button>
              </div>
            </div>
          )}
          {(textContent || isEditing) && (
            <div className={cn("bg-primary text-primary-foreground", "px-4 py-3 rounded-2xl")}>
              {isEditing ? (
                <MessageEditor editedContent={editedContent} setEditedContent={setEditedContent} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />
              ) : (
                <p className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap break-words">{textContent}</p>
              )}
            </div>
          )}
        </div>
        {imageUrl && <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={imageUrl} />}
      </div>
    );
  }

  // ── AI Message — parse image, thinking, quiz ──
  const { imageUrl: botImageUrl, rest: afterImage } = parseImage(displayedContent);
  const { thinking, rest: afterThinking } = parseThinking(afterImage);
  const { quizData, rest: botTextContent } = parseQuizData(afterThinking);

  const handleBotDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!botImageUrl) return;
    const link = document.createElement('a');
    link.href = botImageUrl;
    link.download = `generated_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!botImageUrl || !onEditImage) return;
    onEditImage(botImageUrl, botTextContent);
  };

  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-start">
      <div className="flex flex-col gap-2 max-w-[90%]">
        {/* Thinking badge */}
        {thinking && !isEditing && (
          <ThinkingBadge thinking={thinking} />
        )}

        {/* Generated image */}
        {botImageUrl && !isEditing && (
          <>
            <div className="relative group rounded-2xl overflow-hidden border border-border/40 shadow-sm cursor-pointer bg-muted/30" onClick={() => setImageModalOpen(true)}>
              <img src={botImageUrl} alt="Generated" className="max-w-[280px] sm:max-w-[320px] max-h-[300px] rounded-2xl object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-3">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2"><ZoomIn className="h-5 w-5 text-white" /></div>
                <button onClick={handleBotDownload} className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2 hover:bg-black/70"><Download className="h-5 w-5 text-white" /></button>
              </div>
            </div>
            {onEditImage && (
              <button
                onClick={handleEditImage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Image
              </button>
            )}
          </>
        )}

        {/* Interactive Quiz */}
        {quizData && !isEditing && (
          <InlineQuizCard quizData={quizData} />
        )}
        
        {/* Text bubble */}
        {(botTextContent || isEditing) && !quizData && (
          <div className={cn("bg-muted text-foreground", "px-4 py-3 rounded-2xl")}>
            {isEditing ? (
              <MessageEditor editedContent={editedContent} setEditedContent={setEditedContent} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />
            ) : (
              <MessageMarkdownContent content={botTextContent} isTyping={isTyping} isBot={true} />
            )}
          </div>
        )}
      </div>
      {botImageUrl && <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={botImageUrl} />}
    </div>
  );
};

export default MessageBody;
