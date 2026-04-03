
import React from 'react';
import { X, FileText } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name?: string;
  preview?: string;
  type: 'image' | 'pdf' | 'file';
}

interface ImagePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  const fileName = file.name || file.file?.name || 'file';
  const imageSrc = file.preview;
  const isDocument = file.type === 'pdf' || file.type === 'file';

  return (
    <div className="relative flex-shrink-0">
      {isDocument ? (
        <div className="h-16 w-32 px-2 flex items-center justify-center gap-2 bg-muted rounded-lg border border-border">
          <FileText className="h-6 w-6 text-destructive flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
        </div>
      ) : imageSrc ? (
        <img src={imageSrc} alt={fileName} className="h-16 w-auto object-cover rounded-lg border border-border" />
      ) : (
        <div className="h-16 w-32 px-2 flex items-center justify-center gap-2 bg-muted rounded-lg border border-border">
          <FileText className="h-6 w-6 text-primary flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
        </div>
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
