import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Send } from 'lucide-react';

interface ImageEditDialogProps {
  isOpen: boolean;
  imageUrl: string;
  originalPrompt: string;
  onClose: () => void;
  onSubmit: (newPrompt: string, imageUrl: string) => void;
}

const ImageEditDialog: React.FC<ImageEditDialogProps> = ({
  isOpen,
  imageUrl,
  originalPrompt,
  onClose,
  onSubmit
}) => {
  const [editPrompt, setEditPrompt] = useState('');

  const handleSubmit = () => {
    if (!editPrompt.trim()) return;
    onSubmit(`इस image में ये बदलाव करो: ${editPrompt}`, imageUrl);
    setEditPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Image Edit करें
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex justify-center">
            <img 
              src={imageUrl} 
              alt="Edit preview" 
              className="max-h-[200px] object-contain"
            />
          </div>

          {/* Edit prompt input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              क्या बदलाव चाहिए? (जैसे: background बदलो, color change करो)
            </label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="बताओ image में क्या बदलना है..."
              className="resize-none min-h-[80px]"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!editPrompt.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Edit करो
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditDialog;
