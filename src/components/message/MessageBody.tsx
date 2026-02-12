
import React from 'react';
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import MessageEditor from './MessageEditor';
import MessageMarkdownContent from './MessageMarkdownContent';

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
  return (
    <div className={cn(
      "w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 flex gap-3",
      isUserMessage ? "justify-end" : "justify-start"
    )}>
      {!isUserMessage && (
        <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold">
          AI
        </div>
      )}
      
      <div className={cn(
        "min-w-0 max-w-[85%] overflow-hidden break-words",
        isUserMessage 
          ? "bg-muted px-4 py-3 rounded-3xl"
          : ""
      )}>
        {isEditing ? (
          <MessageEditor 
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
          />
        ) : (
          <div className="w-full overflow-x-visible overflow-y-hidden break-words whitespace-pre-wrap">
            <MessageMarkdownContent 
              content={displayedContent}
              isTyping={isTyping}
              isBot={!isUserMessage}
            />
          </div>
        )}
      </div>

      {isUserMessage && (
        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={14} />
        </div>
      )}
    </div>
  );
};

export default MessageBody;
