import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const useLiveConversation = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('आपका ब्राउज़र voice recognition support नहीं करता');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';
    
    return recognition;
  }, []);

  // Text to speech function
  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        synthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, []);

  // Send message to AI and get response
  const getAIResponse = useCallback(async (userMessage: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const conversationHistory = [
        ...messages,
        { role: 'user' as const, content: userMessage, timestamp: Date.now() }
      ];

      setMessages(conversationHistory);

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: 'तुम एक helpful Hindi AI assistant हो जो students की मदद करता है। संक्षिप्त और स्पष्ट उत्तर दो। बातचीत को natural और friendly रखो।'
        }
      });

      if (error) throw error;

      const aiMessage = data.text || data.content || 'मुझे समझने में दिक्कत हुई, कृपया फिर से बोलें।';
      
      const newMessages = [
        ...conversationHistory,
        { role: 'assistant' as const, content: aiMessage, timestamp: Date.now() }
      ];
      
      setMessages(newMessages);
      
      // Speak the response
      await speak(aiMessage);
      
    } catch (error) {
      console.error('AI response error:', error);
      const errorMsg = 'क्षमा करें, मुझे कुछ technical problem हो रही है।';
      await speak(errorMsg);
    } finally {
      isProcessingRef.current = false;
    }
  }, [messages, speak]);

  // Handle silence detection and trigger AI response
  const handleSilence = useCallback(() => {
    if (currentTranscript.trim() && !isProcessingRef.current && !isSpeaking) {
      const userMessage = currentTranscript.trim();
      setCurrentTranscript('');
      getAIResponse(userMessage);
    }
  }, [currentTranscript, isSpeaking, getAIResponse]);

  // Setup recognition handlers
  const setupRecognition = useCallback(() => {
    const recognition = initRecognition();
    if (!recognition) return null;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Listening started...');
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if conversation is still active and not processing
      if (isActive && !isProcessingRef.current && !isSpeaking) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart delayed');
          }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('कृपया माइक permission दें');
        setIsActive(false);
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update current transcript
      if (finalTranscript) {
        setCurrentTranscript(prev => prev + finalTranscript);
        
        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        // Detect silence after 1.5 seconds of no speech
        silenceTimerRef.current = setTimeout(() => {
          handleSilence();
        }, 1500);
      } else if (interimTranscript) {
        // Show interim results
        setCurrentTranscript(prev => prev + interimTranscript);
      }
    };

    return recognition;
  }, [initRecognition, isActive, isSpeaking, handleSilence]);

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately, just needed for permission

      const recognition = setupRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.start();
      
      setIsActive(true);
      setMessages([]);
      setCurrentTranscript('');
      
      // Welcome message
      await speak('नमस्ते! मैं आपकी मदद के लिए तैयार हूं। आप कुछ भी पूछ सकते हैं।');
      
      toast.success('Conversation शुरू हो गई!');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('माइक access नहीं मिल पाया। कृपया permission दें।');
    }
  }, [setupRecognition, speak]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    window.speechSynthesis.cancel();
    
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentTranscript('');
    isProcessingRef.current = false;
    
    toast.success('Conversation समाप्त हो गई');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isActive,
    isListening,
    isSpeaking,
    messages,
    currentTranscript,
    startConversation,
    stopConversation
  };
};
