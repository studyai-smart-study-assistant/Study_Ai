
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatDB } from '@/lib/db';
import { Chat } from '@/lib/chat/types';
import { toast } from "sonner";
import { History, Trash2, MessageSquare } from 'lucide-react';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  currentChatId: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectChat, currentChatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const allChats = await chatDB.getAllChats();
      setChats(allChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatDB.deleteChat(chatId);
      toast.success('Chat deleted successfully');
      
      // Refresh the list
      setChats(chats.filter(chat => chat.id !== chatId));
      
      // If we deleted the current chat, create a new one
      if (chatId === currentChatId) {
        const newChat = await chatDB.createNewChat();
        onSelectChat(newChat.id);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40"
        onClick={() => setIsOpen(true)}
        title="Chat History"
      >
        <History className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              View and manage your previous conversations.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              {chats.length === 0 ? (
                <p className="text-center py-6 text-gray-500">No chat history found.</p>
              ) : (
                <ul className="space-y-2">
                  {chats.map((chat) => (
                    <li 
                      key={chat.id} 
                      onClick={() => {
                        onSelectChat(chat.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                        chat.id === currentChatId 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="h-5 w-5 text-purple-500 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(chat.timestamp)} • {chat.messages.length} messages
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHistory;
