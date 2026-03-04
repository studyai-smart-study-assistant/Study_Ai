
import React, { useState } from 'react';
import { Message as MessageType } from "@/lib/db";
import MessageBody from '../message/MessageBody';
import MessageActions from '../message/MessageActions';
import LongPressMenu from '../message/LongPressMenu';
import AudioPlayer from '../message/AudioPlayer';
import { useMessageState } from '@/hooks/useMessageState';
import { useMessageBookmark } from '@/hooks/useMessageBookmark';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

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

  const tts = useTextToSpeech();
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const isUserMessage = message.role === "user";

  const handleListen = () => {
    setShowAudioPlayer(true);
    tts.generateAudio(message.content);
  };

  const handleDislike = () => {
    toast.info('Feedback recorded');
  };

  const handleCancelAudio = () => {
    tts.cancel();
    setShowAudioPlayer(false);
  };

  return (
    <div 
      className={cn(
        "py-5 sm:py-7 group transition-colors duration-200 w-full max-w-full overflow-hidden",
        isBookmarked && "border-l-4 border-amber-400"
      )}
    >
      <LongPressMenu
        isUserMessage={isUserMessage}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onLike={!isUserMessage ? handleLike : undefined}
        onDislike={!isUserMessage ? handleDislike : undefined}
        onListen={!isUserMessage ? handleListen : undefined}
        isLiked={isLiked}
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
      </LongPressMenu>

      {/* Audio Player */}
      {!isUserMessage && showAudioPlayer && (
        <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8">
          <AudioPlayer
            isGenerating={tts.isGenerating}
            isPlaying={tts.isPlaying}
            audioReady={tts.audioReady}
            progress={tts.progress}
            duration={tts.duration}
            currentTime={tts.currentTime}
            onTogglePlay={tts.togglePlayPause}
            onCancel={handleCancelAudio}
          />
        </div>
      )}
      
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
          />
        </div>
      )}
    </div>
  );
};

export default Message;
