
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  Settings,
  Headphones
} from 'lucide-react';


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
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });

  const isTTSEnabled = false;
  const isSupported = false;

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'hi-IN';

      recognitionInstance.onresult = (event) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
            setConfidence(Math.round(result[0].confidence * 100));
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          onVoiceInput(finalText);
          setInterimText('');
        } else {
          setInterimText(interimText);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      setRecognition(recognitionInstance);
    }
  }, [onVoiceInput]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening]);

  const toggleVoiceOutput = useCallback(() => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    onVoiceToggle(newState);
  }, [voiceEnabled, onVoiceToggle]);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !isSupported) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    utterance.lang = 'hi-IN';

    speechSynthesis.speak(utterance);
  }, [voiceEnabled, isSupported, voiceSettings]);

  useEffect(() => {
    if (currentMessage && voiceEnabled) {
      speakText(currentMessage);
    }
  }, [currentMessage, voiceEnabled, speakText]);

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <Headphones className="h-5 w-5" />
          Voice Interaction Manager
          <Badge className={`${voiceEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {voiceEnabled ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Voice Input</h4>
            <Button
              size="sm"
              variant={isListening ? "default" : "outline"}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? 'Stop' : 'Listen'}
            </Button>
          </div>

          {isListening && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600">Listening...</span>
              </div>
              
              {interimText && (
                <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-400">
                  <p className="text-sm text-gray-600 italic">{interimText}</p>
                </div>
              )}

              {confidence > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <Progress value={confidence} className="h-1 w-20" />
                  <span className="text-xs text-gray-500">{confidence}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Voice Output Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Voice Output</h4>
            <Button
              size="sm"
              variant={voiceEnabled ? "default" : "outline"}
              onClick={toggleVoiceOutput}
              className={`${voiceEnabled ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
              {voiceEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {voiceEnabled && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600">Speed</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">{voiceSettings.rate}x</span>
              </div>

              <div>
                <label className="text-xs text-gray-600">Pitch</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">{voiceSettings.pitch}</span>
              </div>

              <div>
                <label className="text-xs text-gray-600">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">{Math.round(voiceSettings.volume * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => speakText("Voice test करने के लिए यह message है")}>
            <Play className="h-3 w-3 mr-1" />
            Test Voice
          </Button>
          <Button size="sm" variant="outline" onClick={() => speechSynthesis.cancel()}>
            <Pause className="h-3 w-3 mr-1" />
            Stop Speaking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInteractionManager;
