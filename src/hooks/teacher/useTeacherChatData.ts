
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatDB } from '@/lib/db';
import { Chat } from '@/lib/db';
import { toast } from "sonner";

export const useTeacherChatData = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    } else if (currentUser) {
      loadTeacherChats();
    }
  }, [currentUser, authLoading, navigate]);

  const loadTeacherChats = async () => {
    try {
      setIsDataLoading(true);
      const allChats = await chatDB.getAllChats();
      
      // Filter for teacher-related chats
      const teacherChats = allChats.filter(chat => 
        chat.title.toLowerCase().includes('teach') || 
        chat.title.toLowerCase().includes('learn') ||
        chat.title.toLowerCase().includes('educat') ||
        chat.title.toLowerCase().includes('school') ||
        chat.title.toLowerCase().includes('class') ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes('teach') ||
          msg.content.toLowerCase().includes('learn') ||
          msg.content.toLowerCase().includes('educat') ||
          msg.content.toLowerCase().includes('school') ||
          msg.content.toLowerCase().includes('class')
        )
      );
      
      // Sort by timestamp (newest first)
      teacherChats.sort((a, b) => b.timestamp - a.timestamp);
      
      setChats(teacherChats);
    } catch (error) {
      console.error('Error loading teacher chats:', error);
      toast.error('Failed to load teacher chats');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return {
    chats,
    setChats,
    filteredChats,
    isLoading: authLoading,
    isDataLoading,
    searchTerm,
    setSearchTerm
  };
};
