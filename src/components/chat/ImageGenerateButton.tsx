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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (promptText: string) => {
    if (!promptText.trim()) {
      toast.error('कृपया image description दर्ज करें');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Image बन रही है... कृपया प्रतीक्षा करें');

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: promptText.trim() }
      });

      if (error) {
        console.error('Generate image error:', error);
        throw error;
      }

      if (!data?.imageUrl) {
        throw new Error('Image generation failed - no URL returned');
      }

      onImageGenerated(data.imageUrl);
      toast.success('Image सफलतापूर्वक बन गई!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Image बनाने में समस्या हुई');
    } finally {
      setIsGenerating(false);
    }
  };

  // This component is now just a visual indicator, actual generation happens via prompt detection
  return null;
};

export default ImageGenerateButton;