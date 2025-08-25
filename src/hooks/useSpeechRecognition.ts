
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";

export function useSpeechRecognition(language: string) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error(language === 'hi' ? 'वाक् पहचान विफल हो गई। कृपया पुनः प्रयास करें।' : 'Speech recognition failed. Please try again.');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);
  
  // Update recognition language when app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    }
  }, [language]);

  const toggleListening = (inputFieldId: string) => {
    if (!recognitionRef.current) {
      toast.error(language === 'hi' ? 'आपके ब्राउज़र में वाक् पहचान समर्थित नहीं है' : 'Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Set up onresult callback for specific input field
      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        const questionField = document.getElementById(inputFieldId) as HTMLInputElement;
        if (questionField) {
          questionField.value = currentTranscript;
        }
      };

      recognitionRef.current.start();
      setIsListening(true);
      toast.success(language === 'hi' ? 'सुन रहा है... अब बोलें' : 'Listening... Speak now');
    }
  };

  return {
    isListening,
    toggleListening
  };
}
