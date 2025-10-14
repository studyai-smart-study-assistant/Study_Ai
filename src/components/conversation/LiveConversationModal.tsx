import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Phone, Waves } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LiveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  currentTranscript: string;
}

export const LiveConversationModal = ({
  isOpen,
  onClose,
  isListening,
  isSpeaking,
  messages,
  currentTranscript
}: LiveConversationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary animate-pulse" />
            Live Conversation
          </DialogTitle>
        </DialogHeader>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg">
          <div className="flex items-center gap-2">
            {isListening ? (
              <>
                <Mic className="h-6 w-6 text-red-500 animate-pulse" />
                <span className="text-sm font-medium">सुन रहा हूं...</span>
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="h-6 w-6 text-blue-500 animate-pulse" />
                <span className="text-sm font-medium">बोल रहा हूं...</span>
              </>
            ) : (
              <>
                <MicOff className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">इंतजार में...</span>
              </>
            )}
          </div>
          
          {/* Visual Indicator */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-primary rounded-full transition-all ${
                  isListening || isSpeaking ? 'animate-pulse' : ''
                }`}
                style={{
                  height: isListening || isSpeaking ? `${Math.random() * 20 + 10}px` : '10px',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">आप बोल रहे हैं:</p>
            <p className="text-sm font-medium">{currentTranscript}</p>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>बातचीत शुरू करें...</p>
                <p className="text-sm mt-2">आप कुछ भी पूछ सकते हैं</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'आप' : 'AI Teacher'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('hi-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Controls */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Phone className="h-5 w-5" />
            Conversation समाप्त करें
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground">
          बोलना बंद करने के 1.5 सेकंड बाद AI स्वचालित रूप से जवाब देगा
        </p>
      </DialogContent>
    </Dialog>
  );
};
