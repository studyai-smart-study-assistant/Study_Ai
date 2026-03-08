import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import MessageEditor from './MessageEditor';
import MessageMarkdownContent from './MessageMarkdownContent';
import ImageModal from '@/components/ui/image-modal';

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  // Extract image from content like [IMG_BASE64]text or [Image: url]
  const hasBase64Marker = displayedContent.startsWith('[IMG_BASE64]');
  const hasImageLink = displayedContent.includes('[Image:') && displayedContent.includes(']');
  
  let textContent = displayedContent;
  let imageUrl = '';
  
  if (hasBase64Marker) {
    textContent = displayedContent.replace('[IMG_BASE64]', '').trim();
  }
  
  if (hasImageLink) {
    const match = displayedContent.match(/\[Image:\s*([^\]]+)\]/);
    if (match) {
      imageUrl = match[1].trim();
      textContent = displayedContent.replace(/\[Image:\s*[^\]]+\]/, '').trim();
    }
  }

  // Check if there's a _imageData attached (from same session)
  // This is handled via the content itself for base64

  if (isUserMessage) {
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
            <>
              {imageUrl && (
                <div className="mb-2">
                  <img 
                    src={imageUrl} 
                    alt="Uploaded" 
                    className="max-w-full max-h-48 rounded-lg cursor-pointer object-cover"
                    onClick={() => setImageModalOpen(true)}
                  />
                </div>
              )}
              {textContent && (
                <p className="text-[15px] leading-relaxed font-normal whitespace-pre-wrap break-words">
                  {textContent}
                </p>
              )}
            </>
          )}
        </div>
        {imageUrl && (
          <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={imageUrl} />
        )}
      </div>
    );
  }

  // AI message
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
