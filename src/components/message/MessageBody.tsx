import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import MessageEditor from './MessageEditor';
import MessageMarkdownContent from './MessageMarkdownContent';
import ImageModal from '@/components/ui/image-modal';
import { ZoomIn, Download } from 'lucide-react';

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
  
  // Extract image from content: [IMG_DATA:base64...]text or [Image: url]
  let textContent = displayedContent;
  let imageUrl = '';
  
  // Check for inline base64 image data
  const base64Match = displayedContent.match(/^\[IMG_DATA:(data:image\/[^\]]+)\]/);
  if (base64Match) {
    imageUrl = base64Match[1];
    textContent = displayedContent.replace(base64Match[0], '').trim();
  }
  
  // Check for regular image link
  if (!imageUrl) {
    const linkMatch = displayedContent.match(/\[Image:\s*([^\]]+)\]/);
    if (linkMatch) {
      imageUrl = linkMatch[1].trim();
      textContent = displayedContent.replace(/\[Image:\s*[^\]]+\]/, '').trim();
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imagePreview = imageUrl && !isEditing && (
    <div 
      className="relative group rounded-2xl overflow-hidden border border-border/40 shadow-sm cursor-pointer bg-muted/30"
      onClick={() => setImageModalOpen(true)}
    >
      <img 
        src={imageUrl} 
        alt="Uploaded" 
        className="max-w-[280px] sm:max-w-[320px] max-h-[300px] rounded-2xl object-contain"
      />
      {/* Hover overlay with zoom & download */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
          <ZoomIn className="h-5 w-5 text-white" />
        </div>
        <button 
          onClick={handleDownload}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2 hover:bg-black/70"
        >
          <Download className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );

  if (isUserMessage) {
    return (
      <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-end">
        <div className="flex flex-col items-end gap-2 max-w-[85%]">
          {imagePreview}
          
          {/* Text bubble */}
          {(textContent || isEditing) && (
            <div className={cn(
              "bg-primary text-primary-foreground",
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
                  {textContent}
                </p>
              )}
            </div>
          )}
        </div>
        {imageUrl && (
          <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={imageUrl} />
        )}
      </div>
    );
  }

  // AI message - also parse for images
  let botTextContent = displayedContent;
  let botImageUrl = '';
  
  const botBase64Match = displayedContent.match(/^\[IMG_DATA:(data:image\/[^\]]+)\]/);
  if (botBase64Match) {
    botImageUrl = botBase64Match[1];
    botTextContent = displayedContent.replace(botBase64Match[0], '').trim();
  }

  const handleBotDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!botImageUrl) return;
    const link = document.createElement('a');
    link.href = botImageUrl;
    link.download = `generated_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[760px] mx-auto px-3 sm:px-4 md:px-8 flex justify-start">
      <div className="flex flex-col gap-2 max-w-[80%]">
        {/* Generated image preview */}
        {botImageUrl && !isEditing && (
          <div 
            className="relative group rounded-2xl overflow-hidden border border-border/40 shadow-sm cursor-pointer bg-muted/30"
            onClick={() => setImageModalOpen(true)}
          >
            <img 
              src={botImageUrl} 
              alt="Generated" 
              className="max-w-[280px] sm:max-w-[320px] max-h-[300px] rounded-2xl object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-3">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
              <button 
                onClick={handleBotDownload}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2 hover:bg-black/70"
              >
                <Download className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        )}
        
        {/* Text bubble */}
        {(botTextContent || isEditing) && (
          <div className={cn(
            "bg-muted text-foreground",
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
                content={botTextContent}
                isTyping={isTyping}
                isBot={true}
              />
            )}
          </div>
        )}
      </div>
      {botImageUrl && (
        <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} imageUrl={botImageUrl} />
      )}
    </div>
  );
};

export default MessageBody;
