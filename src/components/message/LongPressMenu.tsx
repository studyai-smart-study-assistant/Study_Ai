import React, { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Trash, ThumbsUp, ThumbsDown, Volume2, Pause, Play, Loader, FileDown, Share2 } from 'lucide-react';
import { useTTS } from '@/contexts/TTSContext';

interface LongPressMenuProps {
  children: React.ReactNode;
  message: { id: string; content: string; isUser: boolean; };
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onFeedback?: (id: string, rating: 'like' | 'dislike') => void;
  onDownloadPdf?: () => void;
  onSharePdf?: () => void;
  isLiked?: boolean;
  hasInteractiveContent?: boolean;
}

const LONG_PRESS_DURATION = 500;
const INTERACTIVE_LONG_PRESS_DURATION = 1200;

const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  message,
  onCopy,
  onDelete,
  onFeedback,
  onDownloadPdf,
  onSharePdf,
  isLiked,
  hasInteractiveContent,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const { isGenerating, isPlaying, togglePlayPause } = useTTS();

  const duration = hasInteractiveContent ? INTERACTIVE_LONG_PRESS_DURATION : LONG_PRESS_DURATION;

  const startPress = useCallback(() => {
    timerRef.current = setTimeout(() => setIsSheetOpen(true), duration);
  }, [duration]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleAction = (action: () => void) => () => {
    action();
    setIsSheetOpen(false);
  };
  
  const handleListen = () => {
    togglePlayPause(message.content);
    setIsSheetOpen(false); // Close sheet, audio keeps playing
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <div
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
        >
          {children}
        </div>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-4 rounded-t-2xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Message Actions</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-1 gap-2">
          {!message.isUser && (
            <Button variant="outline" className="justify-start py-6" onClick={handleListen}>
              {isGenerating ? (
                <Loader className="h-5 w-5 mr-3 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 mr-3" />
              ) : (
                <Play className="h-5 w-5 mr-3" />
              )}
              {isGenerating ? 'Generating...' : isPlaying ? 'Pause Audio' : 'Listen to Message'}
            </Button>
          )}

          <Button variant="outline" className="justify-start py-6" onClick={handleAction(() => onCopy(message.content))}>
            <Copy className="h-5 w-5 mr-3" /> Copy Text
          </Button>

          {!message.isUser && onDownloadPdf && (
            <Button variant="outline" className="justify-start py-6" onClick={handleAction(onDownloadPdf)}>
              <FileDown className="h-5 w-5 mr-3" /> Download PDF
            </Button>
          )}

          {!message.isUser && onSharePdf && (
            <Button variant="outline" className="justify-start py-6" onClick={handleAction(onSharePdf)}>
              <Share2 className="h-5 w-5 mr-3" /> Share PDF
            </Button>
          )}
          </Button>

          {!message.isUser && onFeedback && (
            <div className="flex gap-2">
              <Button variant={isLiked ? "secondary" : "outline"} className="w-full py-6" onClick={handleAction(() => onFeedback(message.id, 'like'))}>
                <ThumbsUp className="h-5 w-5 mr-2" /> Like
              </Button>
              <Button variant={!isLiked ? "secondary" : "outline"} className="w-full py-6" onClick={handleAction(() => onFeedback(message.id, 'dislike'))}>
                <ThumbsDown className="h-5 w-5 mr-2" /> Dislike
              </Button>
            </div>
          )}

          {message.isUser && (
            <Button variant="destructive" className="justify-start py-6" onClick={handleAction(() => onDelete(message.id))}>
              <Trash className="h-5 w-5 mr-3" /> Delete Message
            </Button>
          )}
        </div>
        <SheetFooter className="mt-4">
          <Button variant="ghost" className="w-full" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LongPressMenu;
