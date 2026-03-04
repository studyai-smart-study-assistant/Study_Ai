
import React from 'react';
import { cn } from "@/lib/utils";
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
  if (isUserMessage) {
    // User message: right-aligned, subtle typography, no bubble
    return (
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className="max-w-[60%]">
          {isEditing ? (
            <MessageEditor 
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          ) : (
            <p className="text-[15px] leading-relaxed text-foreground/70 font-normal text-right whitespace-pre-wrap break-words">
              {displayedContent}
            </p>
          )}
        </div>
      </div>
    );
  }

  // AI message: full-width document layout, centered container, no avatar
  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8">
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
      {/* Thin separator */}
      <div className="mt-8 h-px bg-border/30" />
    </div>
  );
};

export default MessageBody;
