import React from 'react';
import { useTTS } from '@/contexts/TTSContext';
import { Play, Pause, Square, Minus, Plus, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingAudioPlayer: React.FC = () => {
  const { isGenerating, isPlaying, isAudioReady, currentText, speed, setSpeed, togglePlayPause, stop } = useTTS();
  const { language } = useLanguage();

  const isVisible = isGenerating || isPlaying || isAudioReady;

  const adjustSpeed = (delta: number) => {
    const newSpeed = Math.round(Math.max(0.5, Math.min(2.0, speed + delta)) * 10) / 10;
    setSpeed(newSpeed);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-2 right-2 z-50 mx-auto max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2">
            {/* Audio icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4 text-primary" />
              )}
            </div>

            {/* Text preview */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {isGenerating 
                  ? (language === 'hi' ? 'ऑडियो बन रहा है...' : 'Generating audio...')
                  : currentText || (language === 'hi' ? 'ऑडियो चल रहा है' : 'Playing audio')}
              </p>
            </div>

            {/* Speed control */}
            {!isGenerating && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustSpeed(-0.1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs font-mono w-8 text-center text-foreground">{speed.toFixed(1)}x</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustSpeed(0.1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => {
                if (isAudioReady || isPlaying) {
                  togglePlayPause(currentText);
                }
              }}
              disabled={isGenerating}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            {/* Stop */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
              onClick={stop}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingAudioPlayer;
