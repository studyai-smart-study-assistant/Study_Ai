
import React from 'react';
import { Chat } from '@/lib/db';
import { School, Calendar, MoreHorizontal, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ChatItemContextMenu } from './ChatItemContextMenu';
import { ChatItemActions } from './ChatItemActions';

interface ChatListItemProps {
  chat: Chat;
  editingChatId: string | null;
  editingChatTitle: string;
  onChatClick: (chatId: string) => void;
  onEditChat: (chatId: string, e?: React.MouseEvent) => void;
  onDeleteChat: (chatId: string, e?: React.MouseEvent) => void;
  onEditingTitleChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  formatDate: (timestamp: number) => string;
  formatTime: (timestamp: number) => string;
  isBatchDeleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (chatId: string, e?: React.MouseEvent) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  editingChatId,
  editingChatTitle,
  onChatClick,
  onEditChat,
  onDeleteChat,
  onEditingTitleChange,
  onSaveEdit,
  onCancelEdit,
  formatDate,
  formatTime,
  isBatchDeleteMode = false,
  isSelected = false,
  onToggleSelection = () => {},
}) => {
  const handleChatItemClick = () => {
    onChatClick(chat.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className={cn(
            "relative cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
            editingChatId === chat.id && "border-green-500 dark:border-green-500",
            isSelected && "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20"
          )}
          onClick={handleChatItemClick}
        >
          <div className="p-4">
            {editingChatId === chat.id ? (
              <EditingChatForm 
                editingChatTitle={editingChatTitle}
                onEditingTitleChange={onEditingTitleChange}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            ) : (
              <ChatItemContent
                chat={chat}
                formatDate={formatDate}
                formatTime={formatTime}
                isBatchDeleteMode={isBatchDeleteMode}
                isSelected={isSelected}
                onToggleSelection={onToggleSelection}
                onChatClick={onChatClick}
                onEditChat={onEditChat}
                onDeleteChat={onDeleteChat}
              />
            )}
          </div>
          {/* Touch-friendly action hint for mobile */}
          {!isBatchDeleteMode && (
            <div className="text-xs text-center py-1 bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 sm:hidden">
              Press and hold for options
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ChatItemContextMenu
        onChatClick={onChatClick}
        onEditChat={onEditChat}
        onDeleteChat={onDeleteChat}
        chatId={chat.id}
      />
    </ContextMenu>
  );
};

interface EditingChatFormProps {
  editingChatTitle: string;
  onEditingTitleChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const EditingChatForm: React.FC<EditingChatFormProps> = ({
  editingChatTitle,
  onEditingTitleChange,
  onSaveEdit,
  onCancelEdit
}) => (
  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
    <input
      value={editingChatTitle}
      onChange={(e) => onEditingTitleChange(e.target.value)}
      placeholder="Enter chat title"
      className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      autoFocus
    />
    <div className="flex space-x-2">
      <Button 
        size="sm" 
        onClick={onSaveEdit}
      >
        Save
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onCancelEdit}
      >
        Cancel
      </Button>
    </div>
  </div>
);

interface ChatItemContentProps {
  chat: Chat;
  formatDate: (timestamp: number) => string;
  formatTime: (timestamp: number) => string;
  isBatchDeleteMode: boolean;
  isSelected: boolean;
  onToggleSelection: (chatId: string, e?: React.MouseEvent) => void;
  onChatClick: (chatId: string) => void;
  onEditChat: (chatId: string, e?: React.MouseEvent) => void;
  onDeleteChat: (chatId: string, e?: React.MouseEvent) => void;
}

const ChatItemContent: React.FC<ChatItemContentProps> = ({
  chat,
  formatDate,
  formatTime,
  isBatchDeleteMode,
  isSelected,
  onToggleSelection,
  onChatClick,
  onEditChat,
  onDeleteChat
}) => (
  <>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        {isBatchDeleteMode ? (
          <div 
            className="flex items-center mr-2" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(chat.id, e);
            }}
          >
            <Checkbox 
              checked={isSelected}
              className="mr-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              aria-label={`Select ${chat.title}`}
            />
          </div>
        ) : (
          <School className="h-5 w-5 text-green-500 mr-2" />
        )}
        <h3 className="font-medium text-gray-900 dark:text-white">
          {chat.title}
        </h3>
      </div>
      
      {/* Don't show action buttons in batch delete mode */}
      {!isBatchDeleteMode && (
        <ChatItemActions 
          onChatClick={onChatClick}
          onEditChat={onEditChat}
          onDeleteChat={onDeleteChat}
          chatId={chat.id}
        />
      )}
    </div>
    
    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
      <Calendar className="h-3.5 w-3.5 mr-1" />
      <span>{formatDate(chat.timestamp)} at {formatTime(chat.timestamp)}</span>
      <span className="mx-2">•</span>
      <span>{chat.messages.length} messages</span>
    </div>
    
    {chat.messages.length > 0 && (
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
        {chat.messages[chat.messages.length - 1].content}
      </div>
    )}
  </>
);
