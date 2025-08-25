
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  isUserMessage: boolean;
  isCopied: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  handleEdit?: () => void;
  handleCopy: () => void;
  handleDelete: () => void;
  handleLike?: () => void;
  handleBookmark: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  isUserMessage,
  isCopied,
  isLiked,
  isBookmarked,
  handleEdit,
  handleCopy,
  handleDelete,
  handleLike,
  handleBookmark,
}) => {
  return (
    <div className={cn(
      "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-1",
      isUserMessage ? "justify-end" : "justify-start"
    )}>
      {isUserMessage && handleEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          onClick={handleEdit}
          title="Edit message"
        >
          <Pencil size={14} />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        onClick={handleCopy}
        title={isCopied ? "Copied!" : "Copy message"}
      >
        <Copy size={14} className={isCopied ? "text-green-500" : ""} />
      </Button>

      {!isUserMessage && handleLike && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleLike}
          title={isLiked ? "Unlike" : "Like message"}
        >
          <Heart 
            size={14} 
            className={isLiked ? "text-red-500 fill-red-500" : ""} 
            fill={isLiked ? "currentColor" : "none"} 
          />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md text-gray-500 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleBookmark}
        title={isBookmarked ? "Remove bookmark" : "Bookmark message"}
      >
        <Bookmark 
          size={14} 
          className={isBookmarked ? "text-amber-500 fill-amber-500" : ""} 
          fill={isBookmarked ? "currentColor" : "none"} 
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleDelete}
        title="Delete message"
      >
        <Trash size={14} />
      </Button>
    </div>
  );
};

export default MessageActions;
