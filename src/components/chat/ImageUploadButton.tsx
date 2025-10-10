import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadButtonProps {
  onImageSelect: (file: File) => void;
  isDisabled?: boolean;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageSelect,
  isDisabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया केवल image files upload करें');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size 10MB से कम होनी चाहिए');
      return;
    }

    onImageSelect(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={isDisabled}
        className="h-10 w-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
        title="इमेज अपलोड करें"
      >
        <ImageIcon className="h-5 w-5" />
      </Button>
    </>
  );
};

export default ImageUploadButton;