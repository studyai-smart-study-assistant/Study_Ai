
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
    // User message: right-aligned, indigo bubble with visible text
    return (
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className={cn(
          "max-w-[80%]",
          "bg-indigo-600 text-white", // Indigo background and white text
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

  // AI message: full-width document layout on a clean white background
  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8">
      <div className="w-full overflow-x-visible overflow-y-hidden break-words bg-white dark:bg-zinc-800 rounded-lg p-4">
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
