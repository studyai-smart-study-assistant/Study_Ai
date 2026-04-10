
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Share2, Volume2, MousePointerSquareDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  isUserMessage: boolean;
  isCopied: boolean;
  handleCopy: () => void;
  handleSpeak?: () => void;
  handleShare?: () => void;
  handleSelectText?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  isUserMessage,
  isCopied,
  handleCopy,
  handleSpeak,
  handleShare,
  handleSelectText,
}) => {
  return (
    <div className={cn(
      "transition-opacity flex gap-1.5",
      isUserMessage ? "justify-end" : "justify-start"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        onClick={handleCopy}
        title={isCopied ? "Copied!" : "Copy message"}
      >
        <Copy size={14} className={isCopied ? "text-green-500" : ""} />
      </Button>

      {!isUserMessage && handleSelectText && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-gray-500 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleSelectText}
          title="Select text"
        >
          <MousePointerSquareDashed size={14} />
        </Button>
      )}

      {!isUserMessage && handleSpeak && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-gray-500 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleSpeak}
          title="Speak message"
        >
          <Volume2 size={14} />
        </Button>
      )}

      {!isUserMessage && handleShare && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-gray-500 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleShare}
          title="Share message"
        >
          <Share2 size={14} />
        </Button>
      )}
    </div>
  );
};

export default MessageActions;
