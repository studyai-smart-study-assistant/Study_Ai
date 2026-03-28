
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import MarkdownRenderer from './MarkdownRenderer'; // Import the new renderer

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    imageUrl?: string;
    createdAt: Date;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-start gap-3 w-full", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/study-ai-logo.png" alt="Study AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl p-3.5 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none"
        )}
      >
        {/* If the message is from the assistant, use the MarkdownRenderer */}
        {message.role === 'assistant' ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          // For user messages, just display plain text with a readable size
          <p className="text-base leading-7">{message.content}</p>
        )}
        {message.imageUrl && (
          <img src={message.imageUrl} alt="Chat content" className="mt-2 rounded-lg max-w-full h-auto" />
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || 'User'} />
          <AvatarFallback>{currentUser?.displayName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
