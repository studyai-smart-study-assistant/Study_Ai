
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Square, Check, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceInfo {
  id: string;
  label: string;
  gender: 'Female' | 'Male';
  description_hi: string;
  description_en: string;
  badge: string;
}

const TOP_VOICES: VoiceInfo[] = [
  // Female voices
  { id: 'simran', label: 'Saumya', gender: 'Female', description_hi: 'शांत, स्पष्ट और प्रोफेशनल — मुश्किल टॉपिक्स समझाने के लिए', description_en: 'Calm, clear & professional — for explaining tough topics', badge: '⭐ Best' },
  { id: 'kavya', label: 'Kavya', gender: 'Female', description_hi: 'मधुर और लयबद्ध — कहानी से इतिहास समझाने के लिए', description_en: 'Sweet & expressive — for storytelling & history', badge: '📖' },
  { id: 'ishita', label: 'Ishani', gender: 'Female', description_hi: 'सॉफ्ट और धैर्यवान — छोटे बच्चों व बेसिक कॉन्सेप्ट्स के लिए', description_en: 'Soft & patient — for kids & basic concepts', badge: '🧸' },
  { id: 'priya', label: 'Meera', gender: 'Female', description_hi: 'ममतामयी आवाज़ — मोटिवेशन और प्रेरणा के लिए', description_en: 'Warm & motherly — for motivation & inspiration', badge: '💖' },
  { id: 'shreya', label: 'Zara', gender: 'Female', description_hi: 'कॉन्फिडेंट और स्मार्ट — क्विज़ और गेमिफिकेशन के लिए', description_en: 'Confident & smart — for quizzes & gamification', badge: '🎯' },
  // Male voices
  { id: 'ashutosh', label: 'Aman', gender: 'Male', description_hi: 'गहरी, गंभीर और भरोसेमंद — प्रतियोगी परीक्षा लेक्चर के लिए', description_en: 'Deep & trustworthy — for competitive exam lectures', badge: '🎓' },
  { id: 'rohan', label: 'Rohan', gender: 'Male', description_hi: 'उत्साही और तेज़ — कोडिंग और टेक टॉपिक्स, दोस्त जैसा', description_en: 'Energetic & fast — coding & tech, like a friend', badge: '💻' },
  { id: 'amit', label: 'Arjun', gender: 'Male', description_hi: 'कमांडिंग और स्पष्ट — लाइव टेस्ट और निर्देशों के लिए', description_en: 'Commanding & clear — for live tests & instructions', badge: '📢' },
  { id: 'dev', label: 'Vihaan', gender: 'Male', description_hi: 'मॉडर्न और अर्बन — CS और लेटेस्ट न्यूज़ के लिए', description_en: 'Modern & urban — for CS & latest news', badge: '🌐' },
  { id: 'kabir', label: 'Kabir', gender: 'Male', description_hi: 'क्लासिक और शुद्ध हिंदी — साहित्य व व्याकरण के लिए', description_en: 'Classic & pure Hindi — for literature & grammar', badge: '📜' },
  { id: 'shubh', label: 'Shubh', gender: 'Male', description_hi: 'डिफॉल्ट आवाज़ — बैलेंस्ड और सबके लिए उपयुक्त', description_en: 'Default voice — balanced & suitable for all', badge: '🔵 Default' },
];

const DEMO_TEXT_HI = 'नमस्ते! मैं आपकी AI टीचर हूँ। आइए आज कुछ नया सीखते हैं!';
const DEMO_TEXT_EN = 'Hello! I am your AI teacher. Let us learn something new today!';

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
  return { voice: 'shubh', speed: 1.1 };
};

export const saveVoicePreferences = (prefs: VoicePreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

const VoiceSettings: React.FC = () => {
  const { language } = useLanguage();
  const [selectedVoice, setSelectedVoice] = useState('shubh');
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
      const demoText = demoLang === 'hi' ? DEMO_TEXT_HI : DEMO_TEXT_EN;
      const langCode = demoLang === 'hi' ? 'hi-IN' : 'en-IN';
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

  const femaleVoices = TOP_VOICES.filter(v => v.gender === 'Female');
  const maleVoices = TOP_VOICES.filter(v => v.gender === 'Male');

  const VoiceCard = ({ voice }: { voice: VoiceInfo }) => {
    const isSelected = selectedVoice === voice.id;
    const isCurrentPlaying = playingVoiceId === voice.id;
    const isCurrentGenerating = isGenerating && isCurrentPlaying;
    const isCurrentlyPlaying = isPlaying && isCurrentPlaying;

    return (
      <button
        onClick={() => {
          setSelectedVoice(voice.id);
          if (isCurrentlyPlaying) {
            stopAudio();
          } else {
            playDemo(voice.id);
          }
        }}
        disabled={isGenerating && !isCurrentPlaying}
        className={`relative w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
          isSelected
            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
            : 'border-border hover:border-primary/40 hover:bg-accent/50'
        } ${isGenerating && !isCurrentPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">{voice.label}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                {voice.badge}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
              {language === 'hi' ? voice.description_hi : voice.description_en}
            </p>
          </div>
          <div className="shrink-0 mt-1">
            {isCurrentGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : isCurrentlyPlaying ? (
              <Volume2 className="h-4 w-4 animate-pulse text-primary" />
            ) : (
              <Play className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-primary" />
            {language === 'hi' ? 'AI टीचर की आवाज़ चुनें' : 'Choose AI Teacher Voice'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {language === 'hi'
              ? 'अपनी पसंदीदा आवाज़ पर टैप करें — सुनें और चुनें!'
              : 'Tap any voice to preview — listen and choose!'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Language Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {language === 'hi' ? 'डेमो भाषा:' : 'Demo:'}
            </span>
            <Button
              variant={demoLang === 'hi' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setDemoLang('hi')}
            >
              हिन्दी
            </Button>
            <Button
              variant={demoLang === 'en' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setDemoLang('en')}
            >
              English
            </Button>
          </div>

          {/* Current Selection */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-foreground">
              {language === 'hi' ? 'चुनी हुई आवाज़:' : 'Selected:'}{' '}
              <strong>{TOP_VOICES.find(v => v.id === selectedVoice)?.label || selectedVoice}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Female Voices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            👩 {language === 'hi' ? 'महिला आवाज़ें' : 'Female Voices'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {femaleVoices.map(v => (
              <VoiceCard key={v.id} voice={v} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Male Voices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            👨 {language === 'hi' ? 'पुरुष आवाज़ें' : 'Male Voices'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {maleVoices.map(v => (
              <VoiceCard key={v.id} voice={v} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full" size="lg">
        {saved ? (
          <><Check className="h-4 w-4 mr-2" /> {language === 'hi' ? 'सेव हो गया!' : 'Saved!'}</>
        ) : (
          language === 'hi' ? '✅ सेटिंग्स सेव करें' : '✅ Save Settings'
        )}
      </Button>
    </div>
  );
};

export default VoiceSettings;
