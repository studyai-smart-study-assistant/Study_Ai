
import { useEffect, useRef, useState, useCallback } from 'react';

interface VoiceCommandsConfig {
  enabled: boolean;
  triggerPhrases: string[];
  onCommand: (command: string) => void;
  onListening?: (isListening: boolean) => void;
}

export const useVoiceCommands = ({
  enabled,
  triggerPhrases = ['hey study ai', 'ok study ai', 'study ai'],
  onCommand,
  onListening
}: VoiceCommandsConfig) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [lastCommand, setLastCommand] = useState<string>('');

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !enabled) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      onListening?.(true);
    } catch (error) {
      console.log('Voice recognition already active');
    }
  }, [enabled, onListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
    onListening?.(false);
  }, [onListening]);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    
    if (!enabled) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Hindi language

    recognition.addEventListener('start', () => {
      setIsListening(true);
      onListening?.(true);
    });

    recognition.addEventListener('end', () => {
      setIsListening(false);
      onListening?.(false);
      
      // Auto-restart if enabled
      if (enabled) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.log('Auto-restart failed');
          }
        }, 1000);
      }
    });

    recognition.addEventListener('result', (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log('Voice input:', transcript);
      
      // Check if any trigger phrase is detected
      const triggerDetected = triggerPhrases.some(phrase => 
        transcript.includes(phrase.toLowerCase())
      );

      if (triggerDetected) {
        // Extract command after trigger phrase
        let command = transcript;
        triggerPhrases.forEach(phrase => {
          command = command.replace(phrase.toLowerCase(), '').trim();
        });
        
        if (command) {
          setLastCommand(command);
          onCommand(command);
        }
      }
    });

    recognition.addEventListener('error', (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
    });

    recognitionRef.current = recognition;

    // Auto-start listening
    if (enabled) {
      startListening();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enabled, triggerPhrases, onCommand, onListening, startListening]);

  return {
    isListening,
    isSupported,
    lastCommand,
    startListening,
    stopListening,
    toggleListening: isListening ? stopListening : startListening
  };
};
