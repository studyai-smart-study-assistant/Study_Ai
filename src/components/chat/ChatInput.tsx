
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || file) && !isLoading) {
      onSendMessage(message.trim(), file ? file : undefined);
      setMessage('');
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Only image files are allowed.");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => setPreviewUrl(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasContent = message.trim() || file;

  return (
    <div className="relative px-3 sm:px-4 md:px-8 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "max-w-3xl mx-auto relative",
          "bg-background/80 dark:bg-background/60 backdrop-blur-xl",
          "border border-border/60 rounded-2xl shadow-lg",
          "transition-all duration-200",
          isFocused && "border-border shadow-xl ring-1 ring-border/30"
        )}
      >
        {/* Image preview */}
        {previewUrl && (
          <div className="px-4 pt-3">
            <div className="relative inline-block">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="h-16 w-auto object-cover rounded-lg border border-border" 
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 shadow-sm"
                onClick={clearSelectedFile}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 p-2">
          {/* Image attach */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          {/* Textarea */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-foreground placeholder:text-muted-foreground/60 py-2.5 px-1"
            disabled={isLoading}
          />

          {/* Send button: B&W minimalist */}
          <Button
            type="submit"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full flex-shrink-0 transition-all duration-200",
              hasContent && !isLoading
                ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={(!message.trim() && !file) || isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick suggestions */}
        {!message.trim() && !isLoading && (
          <div className="flex gap-2 flex-wrap px-4 pb-3">
            {['समझाइए', 'क्विज़ बनाइए', 'नोट्स दीजिए'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="px-3 py-1 text-xs bg-muted/60 text-muted-foreground rounded-full border border-border/40 hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => setMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
