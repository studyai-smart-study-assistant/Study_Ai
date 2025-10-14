import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Waves } from 'lucide-react';
import { useLiveConversation } from '@/hooks/useLiveConversation';
import { LiveConversationModal } from './LiveConversationModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const LiveConversationButton = () => {
  const [showModal, setShowModal] = useState(false);
  const {
    isActive,
    isListening,
    isSpeaking,
    messages,
    currentTranscript,
    startConversation,
    stopConversation
  } = useLiveConversation();

  const handleClick = async () => {
    if (!isActive) {
      await startConversation();
      setShowModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    if (isActive) {
      stopConversation();
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              size="lg"
              className={`
                relative overflow-hidden group
                ${isActive 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                  : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
                }
              `}
            >
              {/* Animated background */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Icon */}
              {isActive ? (
                <Waves className="h-5 w-5 mr-2 animate-pulse relative z-10" />
              ) : (
                <MessageCircle className="h-5 w-5 mr-2 relative z-10" />
              )}
              
              {/* Text */}
              <span className="relative z-10 font-semibold">
                {isActive ? 'Live Conversation चल रही है' : 'Live Conversation शुरू करें'}
              </span>

              {/* Pulse effect for active state */}
              {isActive && (
                <span className="absolute inset-0 rounded-md bg-red-400 animate-ping opacity-25" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {isActive 
                ? 'Conversation देखने के लिए क्लिक करें' 
                : 'AI के साथ hands-free बातचीत शुरू करें'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <LiveConversationModal
        isOpen={showModal}
        onClose={handleClose}
        isListening={isListening}
        isSpeaking={isSpeaking}
        messages={messages}
        currentTranscript={currentTranscript}
      />
    </>
  );
};
