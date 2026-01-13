
import React, { useEffect, useState } from 'react';
import EnhancedChatContainer from './chat/EnhancedChatContainer';
import { chatDB } from '@/lib/db';

interface ChatProps {
  chatId: string;
  onChatUpdated?: () => void;
}

const Chat: React.FC<ChatProps> = ({ chatId, onChatUpdated }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Make sure chat exists in local storage
    const ensureChatExists = async () => {
      try {
        const chat = await chatDB.getChat(chatId);
        if (!chat) {
          // Create the chat if it doesn't exist
          await chatDB.saveChat({
            id: chatId,
            title: "New Chat",
            timestamp: Date.now(),
            messages: []
          });
        }
        setIsLoaded(true);
      } catch (error) {
        console.error("Error ensuring chat exists:", error);
        setIsLoaded(true); // Continue anyway
      }
    };
    
    ensureChatExists();
  }, [chatId]);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="h-full relative">
      <EnhancedChatContainer 
        chatId={chatId} 
        onChatUpdated={onChatUpdated} 
      />
    </div>
  );
};

export default Chat;
