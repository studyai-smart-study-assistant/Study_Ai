
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading?: boolean;
}

const GroupMessageInput: React.FC<GroupMessageInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((message.trim() || file) && !isLoading && !isSending) {
      try {
        setIsSending(true);
        await onSendMessage(message.trim(), file ? file : undefined);
        setMessage('');
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('संदेश भेजने में त्रुटि');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size - 5MB limit
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("फ़ाइल बहुत बड़ी है। अधिकतम साइज़ 5MB है।");
        return;
      }
      
      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("केवल छवि फ़ाइलें स्वीकृत हैं।");
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t flex flex-col gap-2 bg-white dark:bg-gray-800 shadow-lg">
      {previewUrl && (
        <div className="relative inline-block max-w-[150px] mr-2">
          <img 
            src={previewUrl} 
            alt="पूर्वावलोकन" 
            className="h-20 w-auto object-cover rounded-lg border border-gray-300" 
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
            onClick={clearSelectedFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${currentUser?.displayName || 'आप'} के रूप में संदेश लिखें...`}
          className="min-h-[50px] max-h-[120px] flex-1 resize-none"
          disabled={isLoading || isSending}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{display:'none'}}
          onChange={onFileChange}
        />
        <Button
          type="button"
          size="icon"
          className="self-end h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isSending}
          title="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          size="icon"
          className="self-end h-10 w-10"
          disabled={(!message.trim() && !file) || isLoading || isSending}
        >
          {isSending ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default GroupMessageInput;
