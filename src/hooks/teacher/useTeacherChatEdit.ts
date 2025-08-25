
import { useState } from 'react';
import { Chat } from '@/lib/db';
import { chatDB } from '@/lib/db';
import { toast } from "sonner";

export const useTeacherChatEdit = (chats: Chat[], setChats: React.Dispatch<React.SetStateAction<Chat[]>>) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  const handleEditChat = async (chatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Find the chat and set it for editing
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setEditingChatId(chatId);
      setEditingChatTitle(chat.title);
    }
  };

  const saveEditedChat = async () => {
    if (!editingChatId || !editingChatTitle.trim()) {
      toast.error('Chat title cannot be empty');
      return;
    }

    try {
      const chatToUpdate = chats.find(chat => chat.id === editingChatId);
      if (chatToUpdate) {
        const updatedChat = { ...chatToUpdate, title: editingChatTitle };
        await chatDB.saveChat(updatedChat);
        
        // Update local state
        setChats(currentChats => currentChats.map(chat => 
          chat.id === editingChatId 
            ? { ...chat, title: editingChatTitle } 
            : chat
        ));
        
        setEditingChatId(null);
        toast.success('Chat updated successfully');
      }
    } catch (error) {
      console.error('Error updating chat:', error);
      toast.error('Failed to update chat');
    }
  };

  const cancelEditing = () => setEditingChatId(null);

  return {
    editingChatId,
    editingChatTitle,
    setEditingChatTitle,
    handleEditChat,
    saveEditedChat,
    cancelEditing
  };
};
