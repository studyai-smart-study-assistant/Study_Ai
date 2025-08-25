
import React from 'react';
import { Chat } from '@/lib/db';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatListItem } from './ChatListItem';

interface TeacherChatGridProps {
  chats: Chat[];
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
  selectedChats?: Set<string>;
  onToggleSelection?: (chatId: string, e?: React.MouseEvent) => void;
}

const TeacherChatGrid: React.FC<TeacherChatGridProps> = ({
  chats,
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
  selectedChats = new Set(),
  onToggleSelection = () => {},
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="grid gap-4">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            editingChatId={editingChatId}
            editingChatTitle={editingChatTitle}
            onChatClick={onChatClick}
            onEditChat={onEditChat}
            onDeleteChat={onDeleteChat}
            onEditingTitleChange={onEditingTitleChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            formatDate={formatDate}
            formatTime={formatTime}
            isBatchDeleteMode={isBatchDeleteMode}
            isSelected={selectedChats.has(chat.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default TeacherChatGrid;
