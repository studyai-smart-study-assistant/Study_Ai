
import React from 'react';
import { cn } from "@/lib/utils";
import MessageEditor from '../message/MessageEditor';
import MessageMarkdownContent from '../message/MessageMarkdownContent';
import MessageActions from '../message/MessageActions';
import { Bot } from 'lucide-react';

interface MessageBodyProps {
  isUserMessage: boolean;
  isEditing: boolean;
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  isTyping: boolean;
  displayedContent: string;
  isCopied: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  handleEdit: () => void;
  handleCopy: () => void;
  handleDelete: () => void;
  handleLike: () => void;
  handleBookmark: () => void;
}

const MessageBody: React.FC<MessageBodyProps> = ({
  isUserMessage,
  isEditing,
  editedContent,
  setEditedContent,
  handleSaveEdit,
  handleCancelEdit,
  isTyping,
  displayedContent,
  isCopied,
  isLiked,
  isBookmarked,
  handleEdit,
  handleCopy,
  handleDelete,
  handleLike,
  handleBookmark,
}) => {
  const containerClasses = "max-w-[720px] w-full mx-auto px-4 flex";
  const bubbleBaseClasses = "p-3 rounded-2xl shadow-sm max-w-[600px]";

  const actions = (
    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
      {!isEditing && (
        <MessageActions
          isUserMessage={isUserMessage}
          isCopied={isCopied}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          handleEdit={handleEdit}
          handleCopy={handleCopy}
          handleDelete={handleDelete}
          handleLike={handleLike}
          handleBookmark={handleBookmark}
        />
      )}
    </div>
  );

  if (isUserMessage) {
    return (
      <div className={cn(containerClasses, "justify-end")}>
        <div className="group flex items-center gap-2">
          <div className="order-1">{actions}</div>
          <div className={cn(
              "order-2 bg-primary text-primary-foreground rounded-br-none",
              bubbleBaseClasses,
              isBookmarked && "ring-2 ring-amber-400"
          )}>
            {isEditing ? (
              <MessageEditor 
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
              />
            ) : (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {displayedContent}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(containerClasses, "justify-start")}>
      <div className="group flex items-start gap-3">
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-muted flex items-center justify-center border mt-1">
           <Bot size={20} className="text-foreground/60" />
        </div>
        <div className={cn(
            "order-2 bg-muted rounded-bl-none",
            bubbleBaseClasses,
            isBookmarked && "ring-2 ring-amber-400"
        )}>
          {isEditing ? (
            <MessageEditor 
              editedContent={editedContent}
              setEditedContent={setEditedContent}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
            />
          ) : (
            <div className="w-full overflow-x-auto">
               <MessageMarkdownContent 
                  content={displayedContent}
                  isTyping={isTyping}
                  isBot={true}
                />
            </div>
          )}
        </div>
        <div className="order-3">{actions}</div>
      </div>
    </div>
  );
};

export default MessageBody;
