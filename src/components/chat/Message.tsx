
import React from 'react';
import { Message as MessageType } from "@/lib/db";
import MessageBody, { cleanAIResponse } from '../message/MessageBody';
import MessageActions from '../message/MessageActions';
import LongPressMenu from '../message/LongPressMenu';
import { useMessageState } from '@/hooks/useMessageState';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { downloadChatPdf, shareChatPdf } from '@/utils/generateChatPdf';
import { useTTS } from '@/contexts/TTSContext';

interface MessageProps {
  message: MessageType;
  onEdited: () => void;
  onDeleted: () => void;
  onEditImage?: (imageUrl: string, originalPrompt: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onEdited, onDeleted, onEditImage }) => {
  const { 
    isEditing, editedContent, setEditedContent, isTyping, displayedContent,
    isCopied, isLiked, isBookmarked,
    handleCopy, handleDelete, handleSaveEdit, handleCancelEdit, handleLike
  } = useMessageState(message, onEdited, onDeleted);

  const isUserMessage = message.role === "user";
  const hasQuizContent = message.content.includes('[QUIZ_DATA:');
  const { togglePlayPause } = useTTS();
  const contentElementId = `message-content-${message.id}`;

  const handleSpeak = () => {
    const speechText = cleanAIResponse(displayedContent || message.content).trim();
    if (!speechText) {
      toast.error('No text available for audio.');
      return;
    }
    togglePlayPause(speechText);
  };

  const handleShareMessage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: message.content });
      } catch {
        // User cancelled share; no toast needed.
      }
      return;
    }
    await navigator.clipboard.writeText(message.content);
    toast.success('Message copied for sharing');
  };

  const handleDownloadPdf = async () => {
    try {
      toast.info('📄 PDF बन रहा है...');
      const title = message.content.split('\n')[0]?.replace(/^#*\s*/, '').slice(0, 60) || 'Study AI Notes';
      await downloadChatPdf(message.content, title);
      toast.success('📥 PDF download हो गया!');
    } catch {
      toast.error('PDF बनाने में दिक्कत आई');
    }
  };

  const handleSharePdf = async () => {
    try {
      toast.info('📄 PDF बन रहा है...');
      const title = message.content.split('\n')[0]?.replace(/^#*\s*/, '').slice(0, 60) || 'Study AI Notes';
      const shared = await shareChatPdf(message.content, title);
      if (shared) toast.success('✅ PDF share किया गया!');
      else toast.success('📥 PDF download हो गया!');
    } catch {
      toast.error('Share नहीं हो पाया');
    }
  };

  const handleSelectText = () => {
    const target = document.getElementById(contentElementId);
    if (!target) {
      toast.error('Message text not found');
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    toast.success('Text selected');
  };

  const messageForMenu = {
    id: message.id,
    content: message.content,
    isUser: isUserMessage,
  };

  const handleCopyForMenu = (_content: string) => {
    handleCopy();
  };

  const handleDeleteForMenu = (_id: string) => {
    handleDelete();
  };

  const handleFeedbackForMenu = (_id: string, rating: 'like' | 'dislike') => {
    if (rating === 'like') {
      handleLike();
    } else {
      toast.info('Feedback recorded');
    }
  };

  const showAssistantActions = !isUserMessage && !isTyping && !isEditing && cleanAIResponse(displayedContent).trim().length > 0;

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
          contentElementId={contentElementId}
        />
      </LongPressMenu>
      
      {showAssistantActions && (
        <div className={cn(
          "max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 mt-2",
          isUserMessage ? "text-right" : "text-left"
        )}>
          <MessageActions 
            isUserMessage={isUserMessage}
            isCopied={isCopied}
            handleCopy={handleCopy}
            handleSpeak={!isUserMessage ? handleSpeak : undefined}
            handleShare={!isUserMessage ? handleShareMessage : undefined}
            handleSelectText={!isUserMessage ? handleSelectText : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default Message;
