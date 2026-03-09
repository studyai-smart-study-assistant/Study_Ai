
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, Play, Square, Check, Loader2, Sparkles, Mic } from 'lucide-react';
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
  color: string;
}

const TOP_VOICES: VoiceInfo[] = [
  // Female voices
  { id: 'simran', label: 'Saumya', gender: 'Female', description_hi: 'शांत, स्पष्ट और प्रोफेशनल — मुश्किल टॉपिक्स समझाने के लिए', description_en: 'Calm, clear & professional — for tough topics', badge: '⭐ Best', color: 'from-pink-500 to-rose-400' },
  { id: 'kavya', label: 'Kavya', gender: 'Female', description_hi: 'मधुर और लयबद्ध — कहानी से इतिहास समझाने के लिए', description_en: 'Sweet & expressive — storytelling & history', badge: '📖', color: 'from-purple-500 to-fuchsia-400' },
  { id: 'ishita', label: 'Ishani', gender: 'Female', description_hi: 'सॉफ्ट और धैर्यवान — छोटे बच्चों व बेसिक कॉन्सेप्ट्स के लिए', description_en: 'Soft & patient — for kids & basics', badge: '🧸', color: 'from-amber-400 to-orange-300' },
  { id: 'priya', label: 'Meera', gender: 'Female', description_hi: 'ममतामयी आवाज़ — मोटिवेशन और प्रेरणा के लिए', description_en: 'Warm & motherly — motivation & inspiration', badge: '💖', color: 'from-red-400 to-pink-300' },
  { id: 'shreya', label: 'Zara', gender: 'Female', description_hi: 'कॉन्फिडेंट और स्मार्ट — क्विज़ और गेमिफिकेशन के लिए', description_en: 'Confident & smart — quizzes & gamification', badge: '🎯', color: 'from-emerald-500 to-teal-400' },
  { id: 'tanya', label: 'Tanya', gender: 'Female', description_hi: 'फ्रेंडली और चीयरफुल — रिवीज़न और डेली प्रैक्टिस के लिए', description_en: 'Friendly & cheerful — revision & daily practice', badge: '🌟', color: 'from-sky-400 to-cyan-300' },
  // Male voices
  { id: 'ashutosh', label: 'Aman', gender: 'Male', description_hi: 'गहरी, गंभीर और भरोसेमंद — प्रतियोगी परीक्षा लेक्चर के लिए', description_en: 'Deep & trustworthy — competitive exam lectures', badge: '🎓', color: 'from-blue-600 to-indigo-500' },
  { id: 'rohan', label: 'Rohan', gender: 'Male', description_hi: 'उत्साही और तेज़ — कोडिंग और टेक टॉपिक्स, दोस्त जैसा', description_en: 'Energetic & fast — coding & tech, like a friend', badge: '💻', color: 'from-green-500 to-emerald-400' },
  { id: 'amit', label: 'Arjun', gender: 'Male', description_hi: 'कमांडिंग और स्पष्ट — लाइव टेस्ट और निर्देशों के लिए', description_en: 'Commanding & clear — live tests & instructions', badge: '📢', color: 'from-orange-500 to-amber-400' },
  { id: 'dev', label: 'Vihaan', gender: 'Male', description_hi: 'मॉडर्न और अर्बन — CS और लेटेस्ट न्यूज़ के लिए', description_en: 'Modern & urban — CS & latest news', badge: '🌐', color: 'from-violet-500 to-purple-400' },
  { id: 'kabir', label: 'Kabir', gender: 'Male', description_hi: 'क्लासिक और शुद्ध हिंदी — साहित्य व व्याकरण के लिए', description_en: 'Classic & pure Hindi — literature & grammar', badge: '📜', color: 'from-yellow-600 to-amber-500' },
  { id: 'shubh', label: 'Shubh', gender: 'Male', description_hi: 'डिफॉल्ट आवाज़ — बैलेंस्ड और सबके लिए उपयुक्त', description_en: 'Default voice — balanced & suitable for all', badge: '🔵 Default', color: 'from-slate-500 to-gray-400' },
];

const DEMO_TEXTS_HI = [
  'Study AI में आपका स्वागत है! चलो मिलकर कुछ नया सीखते हैं!',
  'नमस्ते! मैं Study AI हूँ, आपका पढ़ाई का साथी। बताइए आज क्या पढ़ना है?',
  'हेलो! मेरे साथ पढ़ाई करो, मज़ा भी आएगा और समझ भी!',
  'Study AI में आइए! आज कौन सा टॉपिक क्लियर करना है?',
  'स्वागत है दोस्त! चलो आज कुछ नया सीखते हैं, तैयार हो?',
];
const DEMO_TEXTS_EN = [
  'Welcome to Study AI! Let us learn something amazing together!',
  'Hello! I am Study AI, your study partner. What shall we learn today?',
  'Hey there! Study with me, it will be fun and easy!',
  'Welcome! Which topic should we crack today?',
  'Hi friend! Ready to learn something new with Study AI?',
];

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
        className={`group relative w-full text-left rounded-2xl transition-all duration-300 overflow-hidden ${
          isSelected
            ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
            : 'hover:shadow-md hover:scale-[1.01]'
        } ${isGenerating && !isCurrentPlaying ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {/* Gradient top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${voice.color}`} />
        
        <div className="p-3 bg-card border border-t-0 border-border rounded-b-2xl">
          {/* Selected check */}
          {isSelected && (
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-r ${voice.color} flex items-center justify-center`}>
              <Check className="h-3 w-3 text-white" />
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {/* Avatar circle */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${voice.color} flex items-center justify-center shrink-0 shadow-sm`}>
              {isCurrentGenerating ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : isCurrentlyPlaying ? (
                <Volume2 className="h-4 w-4 text-white animate-pulse" />
              ) : (
                <Mic className="h-4 w-4 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-sm text-foreground">{voice.label}</span>
                <span className="text-[10px] opacity-70">{voice.badge}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                {language === 'hi' ? voice.description_hi : voice.description_en}
              </p>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const selectedVoiceData = TOP_VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="space-y-5">
      {/* Header with current selection */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            {language === 'hi' ? 'AI टीचर की आवाज़' : 'AI Teacher Voice'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {language === 'hi' ? 'टैप करें → सुनें → पसंद आए तो सेव करें' : 'Tap → Listen → Save if you like'}
        </p>

        {/* Current selection pill */}
        {selectedVoiceData && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${selectedVoiceData.color} text-white text-sm font-medium shadow-md`}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>{selectedVoiceData.label}</span>
            <span className="opacity-80 text-xs">• {selectedVoiceData.gender === 'Female' ? '👩' : '👨'}</span>
          </div>
        )}
      </div>

      {/* Demo Language Toggle */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">
          {language === 'hi' ? 'डेमो:' : 'Demo:'}
        </span>
        <div className="inline-flex rounded-full border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setDemoLang('hi')}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
              demoLang === 'hi' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            हिन्दी
          </button>
          <button
            onClick={() => setDemoLang('en')}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
              demoLang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Female Voices */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
          <span className="text-base">👩</span>
          {language === 'hi' ? 'महिला आवाज़ें' : 'Female Voices'}
          <Badge variant="secondary" className="text-[10px] ml-auto">{femaleVoices.length}</Badge>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {femaleVoices.map(v => (
            <VoiceCard key={v.id} voice={v} />
          ))}
        </div>
      </div>

      {/* Male Voices */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
          <span className="text-base">👨</span>
          {language === 'hi' ? 'पुरुष आवाज़ें' : 'Male Voices'}
          <Badge variant="secondary" className="text-[10px] ml-auto">{maleVoices.length}</Badge>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {maleVoices.map(v => (
            <VoiceCard key={v.id} voice={v} />
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full h-12 text-base rounded-xl shadow-md" size="lg">
        {saved ? (
          <><Check className="h-5 w-5 mr-2" /> {language === 'hi' ? 'सेव हो गया!' : 'Saved!'}</>
        ) : (
          <><Sparkles className="h-5 w-5 mr-2" /> {language === 'hi' ? 'आवाज़ सेव करें' : 'Save Voice'}</>
        )}
      </Button>
    </div>
  );
};

export default VoiceSettings;
