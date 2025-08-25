
import React from 'react';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatItemActionsProps {
  onChatClick: (chatId: string) => void;
  onEditChat: (chatId: string, e?: React.MouseEvent) => void;
  onDeleteChat: (chatId: string, e?: React.MouseEvent) => void;
  chatId: string;
}

export const ChatItemActions: React.FC<ChatItemActionsProps> = ({
  onChatClick,
  onEditChat,
  onDeleteChat,
  chatId
}) => {
  return (
    <>
      {/* Desktop: Show all buttons */}
      <div className="hidden sm:flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={(e) => onChatClick(chatId)}
          title="View chat"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={(e) => onEditChat(chatId, e)}
          title="Edit chat"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={(e) => onDeleteChat(chatId, e)}
          title="Delete chat"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Mobile: Show dropdown menu */}
      <div className="block sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start rounded-none text-left pl-2 pr-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onChatClick(chatId);
                }}
              >
                <Eye className="h-4 w-4 mr-2" /> View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start rounded-none text-left pl-2 pr-6"
                onClick={(e) => onEditChat(chatId, e)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start rounded-none text-left pl-2 pr-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => onDeleteChat(chatId, e)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
