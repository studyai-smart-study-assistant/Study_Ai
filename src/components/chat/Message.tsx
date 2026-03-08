
import React from 'react';
import { Message as MessageType } from "@/lib/db";
import MessageBody from '../message/MessageBody';
import MessageActions from '../message/MessageActions';
import LongPressMenu from '../message/LongPressMenu';
import { useMessageState } from '@/hooks/useMessageState';
import { useMessageBookmark } from '@/hooks/useMessageBookmark';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { downloadChatPdf, shareChatPdf } from '@/utils/generateChatPdf';

interface MessageProps {
  message: MessageType;
  onEdited: () => void;
  onDeleted: () => void;
  onEditImage?: (imageUrl: string, originalPrompt: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onEdited, onDeleted, onEditImage }) => {
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
  const hasQuizContent = message.content.includes('[QUIZ_DATA:');

  const handleDislike = () => {
    toast.info('Feedback recorded');
  };

  const handleDownloadPdf = () => {
    try {
      const title = message.content.split('\n')[0]?.replace(/^#*\s*/, '').slice(0, 60) || 'Study AI Notes';
      downloadChatPdf(message.content, title);
      toast.success('📥 PDF download हो गया!');
    } catch {
      toast.error('PDF बनाने में दिक्कत आई');
    }
  };

  const handleSharePdf = async () => {
    try {
      const title = message.content.split('\n')[0]?.replace(/^#*\s*/, '').slice(0, 60) || 'Study AI Notes';
      const shared = await shareChatPdf(message.content, title);
      if (shared) toast.success('✅ PDF share किया गया!');
      else toast.success('📥 PDF download हो गया!');
    } catch {
      toast.error('Share नहीं हो पाया');
    }
  };

  const messageForMenu = {
    id: message.id,
    content: message.content,
    isUser: isUserMessage,
  };

  const handleCopyForMenu = (content: string) => {
    handleCopy();
  };

  const handleDeleteForMenu = (id: string) => {
    handleDelete();
  };

  const handleFeedbackForMenu = (id: string, rating: 'like' | 'dislike') => {
    if (rating === 'like') {
      handleLike();
    } else {
      handleDislike();
    }
  };

  return (
    <div 
      className={cn(
        "py-5 sm:py-7 group transition-colors duration-200 w-full max-w-full overflow-hidden select-none",
        isBookmarked && "border-l-4 border-amber-400"
      )}
    >
      <LongPressMenu
        message={messageForMenu}
        onCopy={handleCopyForMenu}
        onDelete={handleDeleteForMenu}
        onFeedback={!isUserMessage ? handleFeedbackForMenu : undefined}
        onDownloadPdf={!isUserMessage ? handleDownloadPdf : undefined}
        onSharePdf={!isUserMessage ? handleSharePdf : undefined}
        isLiked={isLiked}
        hasInteractiveContent={hasQuizContent}
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
          onEditImage={!isUserMessage ? onEditImage : undefined}
          hasQuizContent={hasQuizContent}
        />
      </LongPressMenu>
      
      {!isEditing && (
        <div className={cn(
          "max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 mt-2",
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
            handleDownloadPdf={!isUserMessage ? handleDownloadPdf : undefined}
            handleSharePdf={!isUserMessage ? handleSharePdf : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default Message;
