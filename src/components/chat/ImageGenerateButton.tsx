import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImageGenerateButtonProps {
  onImageGenerated: (imageUrl: string) => void;
  isDisabled?: boolean;
}

const ImageGenerateButton: React.FC<ImageGenerateButtonProps> = ({
  onImageGenerated,
  isDisabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('कृपया image description दर्ज करें');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Image बन रही है... कृपया प्रतीक्षा करें');

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim() }
      });

      if (error) {
        throw error;
      }

      if (!data?.imageUrl) {
        throw new Error('Image generation failed');
      }

      onImageGenerated(data.imageUrl);
      toast.success('Image सफलतापूर्वक बन गई!');
      setIsOpen(false);
      setPrompt('');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Image बनाने में समस्या हुई');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        disabled={isDisabled}
        className="h-10 w-10 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
        title="AI से इमेज बनाएं"
      >
        <Sparkles className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Image Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Image Description (English में)
              </label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A beautiful sunset over mountains"
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                जो भी image आप बनाना चाहते हैं उसका description English में लिखें
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-violet-600"
              >
                {isGenerating ? 'बन रही है...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGenerateButton;