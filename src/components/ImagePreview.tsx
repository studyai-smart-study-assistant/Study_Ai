
import React from 'react';
import { X, FileText } from 'lucide-react';
import type { UploadedFile } from './ChatFooterActions';

interface ImagePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  return (
    <div className="relative flex-shrink-0">
      {file.type === 'file' ? (
        <div className="h-16 w-32 px-2 flex items-center justify-center gap-2 bg-muted rounded-lg border border-border">
          <FileText className="h-6 w-6 text-destructive flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{file.file.name}</p>
        </div>
      ) : file.preview ? (
        <img src={file.preview} alt={file.file.name} className="h-16 w-auto object-cover rounded-lg border border-border" />
      ) : (
        <div className="h-16 w-20 bg-muted rounded-lg border border-border" />
      )}
      <button 
        onClick={onRemove} 
        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10 hover:bg-destructive/80 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ImagePreview;
