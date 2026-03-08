import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Download, Share2, Trophy, Target, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/useAuth';

interface QuizResultCardProps {
  score: number;
  total: number;
  topic: string;
  difficulty: string;
  percentage: number;
  timeText?: string;
}

const QuizResultCard: React.FC<QuizResultCardProps> = ({
  score, total, topic, difficulty, percentage, timeText
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';
  const photoURL = currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'default'}`;

  const getGrade = () => {
    if (percentage >= 90) return { label: 'A+', color: 'from-emerald-400 to-emerald-600', text: 'Outstanding!' };
    if (percentage >= 80) return { label: 'A', color: 'from-blue-400 to-blue-600', text: 'Excellent!' };
    if (percentage >= 70) return { label: 'B+', color: 'from-violet-400 to-violet-600', text: 'Very Good!' };
    if (percentage >= 60) return { label: 'B', color: 'from-amber-400 to-amber-600', text: 'Good Job!' };
    if (percentage >= 50) return { label: 'C', color: 'from-orange-400 to-orange-600', text: 'Keep Going!' };
    return { label: 'D', color: 'from-red-400 to-red-600', text: 'Keep Practicing!' };
  };

  const grade = getGrade();
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `StudyAI_Quiz_${topic.replace(/\s+/g, '_')}_${Date.now()}.png`;
      a.click();
      toast.success('Card downloaded! 🎉');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'quiz-result.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            text: `I scored ${score}/${total} (${percentage}%) on ${topic} quiz on Study AI! 🎯`,
            files: [file],
          });
        } else {
          const text = `I scored ${score}/${total} (${percentage}%) on ${topic} quiz on Study AI! 🎯`;
          await navigator.clipboard.writeText(text);
          toast.success('Result copied to clipboard!');
        }
      }, 'image/png');
    } catch {
      toast.error('Share failed');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)',
          padding: '1px',
        }}
      >
        {/* Inner glow border */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)',
          }}
        >
          {/* Top accent line */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)' }} />

          {/* Header with brand */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <img
                src="/images/study-ai-logo.png"
                alt="Study AI"
                className="w-8 h-8 rounded-lg"
                crossOrigin="anonymous"
              />
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Study AI</p>
                <p className="text-gray-500 text-[10px]">Quiz Performance Card</p>
              </div>
            </div>
            <p className="text-gray-500 text-[10px]">{date}</p>
          </div>

          {/* User + Score */}
          <div className="px-5 py-4 flex items-center gap-4">
            {/* User avatar */}
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 rounded-full p-[2px]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}
              >
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover bg-gray-900"
                  crossOrigin="anonymous"
                />
              </div>
              {/* Grade badge */}
              <div
                className={cn("absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg bg-gradient-to-br", grade.color)}
              >
                {grade.label}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{displayName}</p>
              <p className="text-gray-400 text-xs truncate mt-0.5">{topic}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                  difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                  difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                )}>{difficulty}</span>
              </div>
            </div>
          </div>

          {/* Big score circle */}
          <div className="flex justify-center py-3">
            <div className="relative w-28 h-28">
              {/* Outer ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e3a" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{percentage}%</span>
                <span className="text-[10px] text-gray-400 font-medium">{score}/{total} correct</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 px-5 pb-4">
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <p className="text-white text-sm font-bold">{score}/{total}</p>
              <p className="text-gray-500 text-[9px]">Score</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <Target className="w-4 h-4 mx-auto mb-1 text-violet-400" />
              <p className="text-white text-sm font-bold">{percentage}%</p>
              <p className="text-gray-500 text-[9px]">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-pink-400" />
              <p className="text-white text-sm font-bold">{grade.text.replace('!', '')}</p>
              <p className="text-gray-500 text-[9px]">Rating</p>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <p className="text-gray-600 text-[9px]">Generated by Study AI • studyai.app</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-gray-600 text-[9px]">Verified Result</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons (outside card for clean download) */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 gap-2 border-border text-foreground hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex-1 gap-2 border-border text-foreground hover:bg-muted"
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
};

export default QuizResultCard;
