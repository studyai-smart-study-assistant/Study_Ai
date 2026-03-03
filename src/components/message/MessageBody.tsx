
import React from 'react';
import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";
import MessageEditor from './MessageEditor';
import MessageMarkdownContent from './MessageMarkdownContent';
import { Separator } from '@/components/ui/separator';

interface MessageBodyProps {
  isUserMessage: boolean;
  isEditing: boolean;
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  isTyping: boolean;
  displayedContent: string;
}

const MessageBody: React.FC<MessageBodyProps> = ({
  isUserMessage,
  isEditing,
  editedContent,
  setEditedContent,
  handleSaveEdit,
  handleCancelEdit,
  isTyping,
  displayedContent
}) => {
  if (isUserMessage) {
    // User message: small gray bubble, right-aligned
    return (
      <div className="w-full max-w-full mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%] sm:max-w-[70%]">
          <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-br-sm text-[15px] text-foreground leading-relaxed shadow-sm">
            {isEditing ? (
              <MessageEditor 
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
              />
            ) : (
              <span className="whitespace-pre-wrap break-words">{displayedContent}</span>
            )}
          </div>
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // AI message: clean, no bubble, white background with separator
  return (
    <div className="w-full max-w-full mx-auto px-3 sm:px-4 md:px-8">
      <div className="flex gap-3 sm:gap-4 max-w-3xl">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Sparkles size={14} className="text-primary-foreground" />
        </div>
        
        <div className="flex-1 min-w-0 max-w-full overflow-hidden break-words pt-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">Study AI</div>
          {isEditing ? (
            <MessageEditor 
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          ) : (
            <div className="w-full overflow-x-visible overflow-y-hidden break-words">
              <MessageMarkdownContent 
                content={displayedContent}
                isTyping={isTyping}
                isBot={true}
              />
            </div>
          )}
          <Separator className="mt-6 opacity-40" />
        </div>
      </div>
    </div>
  );
};

export default MessageBody;
