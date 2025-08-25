
import React from 'react';
import { Chat } from '@/lib/db';
import { EmptyChatList } from './EmptyChatList';
import TeacherChatLoadingState from './TeacherChatLoadingState';
import TeacherChatGrid from './TeacherChatGrid';

interface TeacherChatListProps {
  chats: Chat[];
  isDataLoading: boolean;
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

const TeacherChatList: React.FC<TeacherChatListProps> = (props) => {
  if (props.isDataLoading) {
    return <TeacherChatLoadingState />;
  }

  if (props.chats.length === 0) {
    return <EmptyChatList />;
  }

  return <TeacherChatGrid {...props} />;
};

export default TeacherChatList;
