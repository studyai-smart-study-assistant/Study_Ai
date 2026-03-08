
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play, Square, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const SARVAM_VOICES = [
  { id: 'priya', label: 'Priya', gender: 'Female' },
  { id: 'neha', label: 'Neha', gender: 'Female' },
  { id: 'ritu', label: 'Ritu', gender: 'Female' },
  { id: 'pooja', label: 'Pooja', gender: 'Female' },
  { id: 'simran', label: 'Simran', gender: 'Female' },
  { id: 'kavya', label: 'Kavya', gender: 'Female' },
  { id: 'ishita', label: 'Ishita', gender: 'Female' },
  { id: 'shreya', label: 'Shreya', gender: 'Female' },
  { id: 'tanya', label: 'Tanya', gender: 'Female' },
  { id: 'shruti', label: 'Shruti', gender: 'Female' },
  { id: 'suhani', label: 'Suhani', gender: 'Female' },
  { id: 'kavitha', label: 'Kavitha', gender: 'Female' },
  { id: 'rupali', label: 'Rupali', gender: 'Female' },
  { id: 'roopa', label: 'Roopa', gender: 'Female' },
  { id: 'amelia', label: 'Amelia', gender: 'Female' },
  { id: 'sophia', label: 'Sophia', gender: 'Female' },
  { id: 'aditya', label: 'Aditya', gender: 'Male' },
  { id: 'ashutosh', label: 'Ashutosh', gender: 'Male' },
  { id: 'rahul', label: 'Rahul', gender: 'Male' },
  { id: 'rohan', label: 'Rohan', gender: 'Male' },
  { id: 'amit', label: 'Amit', gender: 'Male' },
  { id: 'dev', label: 'Dev', gender: 'Male' },
  { id: 'ratan', label: 'Ratan', gender: 'Male' },
  { id: 'varun', label: 'Varun', gender: 'Male' },
  { id: 'manan', label: 'Manan', gender: 'Male' },
  { id: 'sumit', label: 'Sumit', gender: 'Male' },
  { id: 'kabir', label: 'Kabir', gender: 'Male' },
  { id: 'anand', label: 'Anand', gender: 'Male' },
  { id: 'tarun', label: 'Tarun', gender: 'Male' },
  { id: 'sunny', label: 'Sunny', gender: 'Male' },
  { id: 'vijay', label: 'Vijay', gender: 'Male' },
  { id: 'mohit', label: 'Mohit', gender: 'Male' },
  { id: 'rehan', label: 'Rehan', gender: 'Male' },
  { id: 'soham', label: 'Soham', gender: 'Male' },
];

const DEMO_TEXT_HI = 'नमस्ते! यह एक टेस्ट ऑडियो है। इस आवाज़ को सुनकर अपनी पसंदीदा आवाज़ चुनें।';
const DEMO_TEXT_EN = 'Hello! This is a test audio. Listen to this voice and choose your favorite.';

export interface VoicePreferences {
  voice: string;
  speed: number;
}

const STORAGE_KEY = 'tts_voice_preferences';

export const getVoicePreferences = (): VoicePreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { voice: 'priya', speed: 1.0 };
};

export const saveVoicePreferences = (prefs: VoicePreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

const VoiceSettings: React.FC = () => {
  const { language } = useLanguage();
  const [selectedVoice, setSelectedVoice] = useState('priya');
  const [demoLang, setDemoLang] = useState<'hi' | 'en'>(language === 'hi' ? 'hi' : 'en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const prefs = getVoicePreferences();
    setSelectedVoice(prefs.voice);
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsGenerating(false);
    setPlayingVoiceId(null);
  };

  const playDemo = async (voiceId: string) => {
    stopAudio();
    setIsGenerating(true);
    setPlayingVoiceId(voiceId);

    try {
      const demoText = language === 'hi' ? DEMO_TEXT_HI : DEMO_TEXT_EN;
      const langCode = language === 'hi' ? 'hi-IN' : 'en-IN';
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: demoText, language: langCode, voice: voiceId },
      });

      if (error || !data?.audioContent) {
        throw new Error(error?.message || 'No audio');
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setPlayingVoiceId(null);
        };
        await audioRef.current.play();
        setIsPlaying(true);
        setIsGenerating(false);
      }
    } catch (err: any) {
      console.error('Demo TTS error:', err);
      toast.error(language === 'hi' ? 'ऑडियो चलाने में समस्या हुई' : 'Failed to play demo audio');
      setIsGenerating(false);
      setPlayingVoiceId(null);
    }
  };

  const handleSave = () => {
    const prefs = getVoicePreferences();
    saveVoicePreferences({ ...prefs, voice: selectedVoice });
    setSaved(true);
    toast.success(language === 'hi' ? 'आवाज़ सेटिंग्स सेव हो गईं!' : 'Voice settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const femaleVoices = SARVAM_VOICES.filter(v => v.gender === 'Female');
  const maleVoices = SARVAM_VOICES.filter(v => v.gender === 'Male');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-primary" />
            {language === 'hi' ? 'आवाज़ चुनें' : 'Select Voice'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {language === 'hi' 
              ? 'यहां आवाज़ चुनें। स्पीड कंट्रोल ऑडियो प्लेयर में मिलेगा।' 
              : 'Select your voice here. Speed controls appear in the audio player.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {language === 'hi' ? 'वर्तमान आवाज़' : 'Current Voice'}
            </label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {language === 'hi' ? '👩 महिला आवाज़ें' : '👩 Female Voices'}
                </div>
                {femaleVoices.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">
                  {language === 'hi' ? '👨 पुरुष आवाज़ें' : '👨 Male Voices'}
                </div>
                {maleVoices.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Demo button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => playingVoiceId === selectedVoice && isPlaying ? stopAudio() : playDemo(selectedVoice)}
              disabled={isGenerating && playingVoiceId === selectedVoice}
            >
              {isGenerating && playingVoiceId === selectedVoice ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {language === 'hi' ? 'लोड हो रहा...' : 'Loading...'}</>
              ) : isPlaying && playingVoiceId === selectedVoice ? (
                <><Square className="h-4 w-4 mr-1" /> {language === 'hi' ? 'रोकें' : 'Stop'}</>
              ) : (
                <><Play className="h-4 w-4 mr-1" /> {language === 'hi' ? 'डेमो सुनें' : 'Play Demo'}</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {language === 'hi' ? 'चुनी हुई आवाज़ का टेस्ट करें' : 'Test the selected voice'}
            </span>
          </div>

          {/* Save */}
          <Button onClick={handleSave} className="w-full">
            {saved ? (
              <><Check className="h-4 w-4 mr-1" /> {language === 'hi' ? 'सेव हो गया!' : 'Saved!'}</>
            ) : (
              language === 'hi' ? 'सेटिंग्स सेव करें' : 'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Voice Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === 'hi' ? '🎧 सभी आवाज़ें आज़माएं' : '🎧 Try All Voices'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SARVAM_VOICES.map(v => (
              <Button
                key={v.id}
                variant={selectedVoice === v.id ? 'default' : 'outline'}
                size="sm"
                className="justify-between text-xs"
                onClick={() => {
                  setSelectedVoice(v.id);
                  playDemo(v.id);
                }}
                disabled={isGenerating && playingVoiceId !== v.id}
              >
                <span>{v.label}</span>
                {isGenerating && playingVoiceId === v.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isPlaying && playingVoiceId === v.id ? (
                  <Volume2 className="h-3 w-3 animate-pulse" />
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {v.gender === 'Female' ? '👩' : '👨'}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceSettings;
