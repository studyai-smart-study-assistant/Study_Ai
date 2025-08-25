
import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import {
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

interface ChatItemContextMenuProps {
  onChatClick: (chatId: string) => void;
  onEditChat: (chatId: string, e?: React.MouseEvent) => void;
  onDeleteChat: (chatId: string, e?: React.MouseEvent) => void;
  chatId: string;
}

export const ChatItemContextMenu: React.FC<ChatItemContextMenuProps> = ({
  onChatClick,
  onEditChat,
  onDeleteChat,
  chatId
}) => (
  <ContextMenuContent className="w-40">
    <ContextMenuItem
      className="flex items-center text-sm cursor-pointer"
      onClick={() => onChatClick(chatId)}
    >
      <Eye className="mr-2 h-4 w-4" />
      View
    </ContextMenuItem>
    <ContextMenuItem
      className="flex items-center text-sm cursor-pointer"
      onClick={(e) => onEditChat(chatId)}
    >
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </ContextMenuItem>
    <ContextMenuItem
      className="flex items-center text-sm cursor-pointer text-red-500"
      onClick={() => onDeleteChat(chatId)}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
);
