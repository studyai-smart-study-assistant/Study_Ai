
import React from 'react';
import { X, FileText } from 'lucide-react';

// The props now receive a single 'file' object
interface UploadedFile {
  id: string;
  data: string;
  name: string;
  type: 'image' | 'pdf';
}

interface ImagePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  return (
    <div className="relative flex-shrink-0">
      {file.type === 'pdf' ? (
        <div className="h-16 w-32 px-2 flex items-center justify-center gap-2 bg-muted rounded-lg border border-border">
          <FileText className="h-6 w-6 text-destructive flex-shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
        </div>
      ) : (
        <img src={file.data} alt={file.name} className="h-16 w-auto object-cover rounded-lg border border-border" />
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
