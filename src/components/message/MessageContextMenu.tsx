import React, { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Pencil, Trash, Heart, Bookmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageContextMenuProps {
  children: ReactNode;
  isUserMessage: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  messageText: string;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onLike?: () => void;
  onBookmark: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  children,
  isUserMessage,
  isLiked,
  isBookmarked,
  messageText,
  onCopy,
  onEdit,
  onDelete,
  onLike,
  onBookmark,
}) => {
  const { language } = useLanguage();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          {language === 'hi' ? 'कॉपी करें' : 'Copy'}
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        {isUserMessage && onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {language === 'hi' ? 'संपादित करें' : 'Edit'}
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        
        {!isUserMessage && onLike && (
          <ContextMenuItem onClick={onLike}>
            <Heart 
              className={`mr-2 h-4 w-4 ${isLiked ? "text-red-500 fill-red-500" : ""}`}
              fill={isLiked ? "currentColor" : "none"}
            />
            {isLiked 
              ? (language === 'hi' ? 'अनलाइक' : 'Unlike')
              : (language === 'hi' ? 'लाइक' : 'Like')
            }
          </ContextMenuItem>
        )}
        
        <ContextMenuItem onClick={onBookmark}>
          <Bookmark
            className={`mr-2 h-4 w-4 ${isBookmarked ? "text-amber-500 fill-amber-500" : ""}`}
            fill={isBookmarked ? "currentColor" : "none"}
          />
          {isBookmarked 
            ? (language === 'hi' ? 'बुकमार्क हटाएं' : 'Unbookmark')
            : (language === 'hi' ? 'बुकमार्क करें' : 'Bookmark')
          }
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onDelete} className="text-red-600">
          <Trash className="mr-2 h-4 w-4" />
          {language === 'hi' ? 'डिलीट करें' : 'Delete'}
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;