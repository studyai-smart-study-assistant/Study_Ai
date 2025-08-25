
import { useNavigate } from 'react-router-dom';
import { Chat } from '@/lib/db';
import { chatDB } from '@/lib/db';
import { toast } from "sonner";

export const useTeacherChatOperations = (chats: Chat[], setChats: React.Dispatch<React.SetStateAction<Chat[]>>, isBatchDeleteMode: boolean, toggleChatSelection: (chatId: string, e?: React.MouseEvent) => void) => {
  const navigate = useNavigate();

  const handleChatClick = (chatId: string) => {
    if (isBatchDeleteMode) {
      toggleChatSelection(chatId);
    } else {
      // Navigate to the home page with the selected chat ID as state
      navigate('/', { 
        state: { 
          activeChatId: chatId,
          source: 'teacher-chats' // Add source to track where we came from
        } 
      });
    }
  };

  const handleDeleteChat = async (chatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      await chatDB.deleteChat(chatId);
      toast.success('Chat deleted successfully');
      
      // Refresh the list
      setChats(currentChats => currentChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  // Utility functions for formatting dates/times
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    handleChatClick,
    handleDeleteChat,
    formatDate,
    formatTime
  };
};
