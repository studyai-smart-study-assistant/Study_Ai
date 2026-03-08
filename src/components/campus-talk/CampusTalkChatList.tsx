
import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { CampusChatItem } from '@/pages/ChatSystem';

interface Props {
  chats: CampusChatItem[];
  isLoading: boolean;
  searchQuery: string;
  onSelectChat: (chat: CampusChatItem) => void;
}

const formatTime = (timestamp?: string | null) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  
  if (diffH < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffH < 48) return 'Yesterday';
  if (diffH < 168) return d.toLocaleDateString('en', { weekday: 'short' });
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

const getInitial = (name: string) => {
  return (name?.charAt(0) || '?').toUpperCase();
};

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
];

const getColor = (name: string) => {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
};

const CampusTalkChatList: React.FC<Props> = ({ chats, isLoading, searchQuery, onSelectChat }) => {
  const filtered = searchQuery
    ? chats.filter(c => c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(230,70%,55%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Go to "Users" tab to start chatting with someone
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((chat) => (
        <div
          key={chat.chatId}
          onClick={() => onSelectChat(chat)}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
        >
          {/* Avatar */}
          {chat.partnerAvatar ? (
            <img
              src={chat.partnerAvatar}
              alt={chat.partnerName}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full ${getColor(chat.partnerName)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
              {getInitial(chat.partnerName)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold text-foreground truncate">{chat.partnerName}</h3>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {formatTime(chat.lastMessageTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {chat.lastMessage}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CampusTalkChatList;
