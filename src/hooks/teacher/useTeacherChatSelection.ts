import { useState } from 'react';
import { Chat } from '@/lib/db';
import { chatDB } from '@/lib/db';
import { toast } from "sonner";

export const useTeacherChatSelection = (chats: Chat[], setChats: React.Dispatch<React.SetStateAction<Chat[]>>) => {
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);

  const toggleChatSelection = (chatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setSelectedChats(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(chatId)) {
        newSelected.delete(chatId);
      } else {
        newSelected.add(chatId);
      }
      return newSelected;
    });
  };

  const toggleBatchDeleteMode = () => {
    setIsBatchDeleteMode(!isBatchDeleteMode);
    if (isBatchDeleteMode) {
      // Clear selections when exiting batch delete mode
      setSelectedChats(new Set());
    }
  };

  const selectAllChats = (filteredChats: Chat[]) => {
    if (filteredChats.length === selectedChats.size) {
      // If all are selected, deselect all
      setSelectedChats(new Set());
    } else {
      // Otherwise, select all visible chats
      setSelectedChats(new Set(filteredChats.map(chat => chat.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedChats.size === 0) {
      toast.error('No chats selected');
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedChats).map(chatId => 
        chatDB.deleteChat(chatId)
      );
      
      await Promise.all(deletePromises);
      
      // Update local state by filtering out deleted chats
      setChats(currentChats => currentChats.filter(chat => !selectedChats.has(chat.id)));
      
      // Reset selection
      setSelectedChats(new Set());
      setIsBatchDeleteMode(false);
      
      toast.success(`${selectedChats.size} chat(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting multiple chats:', error);
      toast.error('Failed to delete selected chats');
    }
  };

  return {
    selectedChats,
    isBatchDeleteMode,
    toggleChatSelection,
    toggleBatchDeleteMode,
    selectAllChats,
    handleBatchDelete
  };
};
