
import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Heart, Bookmark, FileDown, Share2, ThumbsDown, Volume2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  handleDislike?: () => void;
  handleSpeak?: () => void;
  handleShare?: () => void;
  handleBookmark: () => void;
  handleDownloadPdf?: () => void;
  handleSharePdf?: () => void;
  handleViewSources?: () => void;
  handleRegenerate?: () => void;
  handleReport?: () => void;
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
  handleDislike,
  handleSpeak,
  handleShare,
  handleBookmark,
  handleDownloadPdf,
  handleSharePdf,
  handleViewSources,
  handleRegenerate,
  handleReport,
}) => {
  return (
    <div className={cn(
      "transition-opacity flex gap-1",
      isUserMessage ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100" : "opacity-100",
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

      {!isUserMessage && handleDislike && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleDislike}
          title="Dislike message"
        >
          <ThumbsDown size={14} />
        </Button>
      )}

      {!isUserMessage && handleSpeak && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800"
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
          className="h-6 w-6 rounded-md text-gray-500 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleShare}
          title="Share message"
        >
          <Share2 size={14} />
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

      {!isUserMessage && handleDownloadPdf && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleDownloadPdf}
          title="Download as PDF"
        >
          <FileDown size={14} />
        </Button>
      )}

      {!isUserMessage && handleSharePdf && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md text-gray-500 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleSharePdf}
          title="Share as PDF"
        >
          <Share2 size={14} />
        </Button>
      )}

      {!isUserMessage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="More actions"
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleViewSources}>View Sources</DropdownMenuItem>
            <DropdownMenuItem onClick={handleRegenerate}>Regenerate</DropdownMenuItem>
            <DropdownMenuItem onClick={handleReport}>Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

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
