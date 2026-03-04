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
    // User message: right-aligned, violet bubble
    return (
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className={cn(
          "max-w-[80%]",
          "bg-violet-600 text-white",
          "px-4 py-3 rounded-2xl"
        )}>
          {isEditing ? (
            <MessageEditor
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          ) : (
            <p className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap break-words">
              {displayedContent}
            </p>
          )}
        </div>
      </div>
    );
  }

  // AI message: left-aligned, light-colored bubble
  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-start">
      <div className={cn(
        "max-w-[80%]",
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50",
        "px-4 py-3 rounded-2xl"
      )}>
        {isEditing ? (
          <MessageEditor
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
          />
        ) : (
          <MessageMarkdownContent
            content={displayedContent}
            isTyping={isTyping}
            isBot={true}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBody;
