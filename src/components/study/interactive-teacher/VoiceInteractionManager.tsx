
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Headphones
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSarvamSTT } from '@/hooks/useSarvamSTT';


interface VoiceInteractionManagerProps {
  onVoiceInput: (text: string) => void;
  onVoiceToggle: (enabled: boolean) => void;
  isProcessing?: boolean;
  currentMessage?: string;
}

const VoiceInteractionManager: React.FC<VoiceInteractionManagerProps> = ({
  onVoiceInput,
  onVoiceToggle,
  isProcessing = false,
  currentMessage = ''
}) => {
  const { language } = useLanguage();
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const { isRecording, isProcessing: isSttProcessing, toggleRecording } = useSarvamSTT({
    language,
    onTranscript: (text) => {
      // Show interim text
    },
    onAutoSend: (text) => {
      // Auto-send transcribed text to teacher
      onVoiceInput(text);
    },
    silenceThreshold: 25000
  });

  const toggleVoiceOutput = useCallback(() => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    onVoiceToggle(newState);
  }, [voiceEnabled, onVoiceToggle]);

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <Headphones className="h-5 w-5" />
          Voice Mode (Sarvam AI)
          <Badge className={`${isRecording ? 'bg-red-100 text-red-800 animate-pulse' : voiceEnabled ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
            {isRecording ? '🔴 Recording' : voiceEnabled ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">
                {language === 'hi' ? 'बोलकर जवाब दें' : 'Speak Your Answer'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {language === 'hi' 
                  ? 'माइक दबाएं और बोलें — चुप होने पर अपने आप भेज देगा' 
                  : 'Press mic and speak — auto-sends when you stop talking'}
              </p>
            </div>
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={toggleRecording}
              disabled={isProcessing || isSttProcessing}
              className={`rounded-full w-14 h-14 ${isRecording ? 'animate-pulse' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
            >
              {isSttProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {language === 'hi' ? '🎤 सुन रहा हूं... बोलते रहें' : '🎤 Listening... keep speaking'}
              </span>
            </div>
          )}

          {isSttProcessing && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                {language === 'hi' ? 'टेक्स्ट में बदल रहा है...' : 'Converting to text...'}
              </span>
            </div>
          )}
        </div>

        {/* Voice Output Toggle */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <h4 className="font-medium text-sm">
              {language === 'hi' ? 'आवाज़ आउटपुट' : 'Voice Output'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {language === 'hi' ? 'टीचर की आवाज़ सुनें' : 'Listen to teacher voice'}
            </p>
          </div>
          <Button
            size="sm"
            variant={voiceEnabled ? "default" : "outline"}
            onClick={toggleVoiceOutput}
            className={voiceEnabled ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
            {voiceEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInteractionManager;
