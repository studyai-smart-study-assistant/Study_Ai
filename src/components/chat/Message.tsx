
import React from 'react';
import { Message as MessageType } from "@/lib/db";
import MessageBody from '../message/MessageBody';
import MessageActions from '../message/MessageActions';
import MessageContextMenu from '../message/MessageContextMenu';
import { useMessageState } from '@/hooks/useMessageState';
import { useMessageBookmark } from '@/hooks/useMessageBookmark';
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
  onEdited: () => void;
  onDeleted: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onEdited, onDeleted }) => {
  const { 
    isEditing, editedContent, setEditedContent, isTyping, displayedContent,
    isCopied, isLiked, isBookmarked, setIsBookmarked, 
    handleCopy, handleDelete, handleEdit, handleSaveEdit, handleCancelEdit, handleLike
  } = useMessageState(message, onEdited, onDeleted);
  
  const { handleBookmark } = useMessageBookmark(
    message.chatId, 
    message.id, 
    !!message.bookmarked, 
    onEdited,
    setIsBookmarked
  );

  const isUserMessage = message.role === "user";

  return (
    <div 
      className={cn(
        "py-4 sm:py-6 group transition-colors duration-300 w-full max-w-full overflow-hidden",
        isUserMessage 
          ? "bg-white dark:bg-gray-800" 
          : "bg-purple-50 dark:bg-gray-900",
        isBookmarked && "border-l-4 border-amber-400"
      )}
    >
      {!isEditing ? (
        <MessageContextMenu
          isUserMessage={isUserMessage}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          messageText={message.content}
          onCopy={handleCopy}
          onEdit={isUserMessage ? handleEdit : undefined}
          onDelete={handleDelete}
          onLike={!isUserMessage ? handleLike : undefined}
          onBookmark={handleBookmark}
        >
          <MessageBody 
            isUserMessage={isUserMessage}
            isEditing={isEditing}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            isTyping={isTyping}
            displayedContent={displayedContent}
          />
        </MessageContextMenu>
      ) : (
        <MessageBody 
          isUserMessage={isUserMessage}
          isEditing={isEditing}
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          isTyping={isTyping}
          displayedContent={displayedContent}
        />
      )}
      
      {!isEditing && (
        <div className={cn(
          "w-full max-w-full mx-auto px-3 sm:px-4 md:px-8 mt-2 sm:mt-3",
          isUserMessage ? "text-right" : "text-left"
        )}>
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
        </div>
      )}
    </div>
  );
};

export default Message;
