import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Download, Share2, Trophy, Target, Zap, Star, Crown, Flame } from 'lucide-react';
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
    if (percentage >= 90) return { label: 'A+', emoji: '👑', text: 'Outstanding!', accent: '#34d399', glow: '#10b981' };
    if (percentage >= 80) return { label: 'A', emoji: '🔥', text: 'Excellent!', accent: '#60a5fa', glow: '#3b82f6' };
    if (percentage >= 70) return { label: 'B+', emoji: '⚡', text: 'Very Good!', accent: '#a78bfa', glow: '#8b5cf6' };
    if (percentage >= 60) return { label: 'B', emoji: '💫', text: 'Good Job!', accent: '#fbbf24', glow: '#f59e0b' };
    if (percentage >= 50) return { label: 'C', emoji: '📚', text: 'Keep Going!', accent: '#fb923c', glow: '#f97316' };
    return { label: 'D', emoji: '💪', text: 'Keep Practicing!', accent: '#f87171', glow: '#ef4444' };
  };

  const grade = getGrade();
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
      {/* The card */}
      <div
        ref={cardRef}
        className="relative w-full rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #0a0a1a 0%, #0d1117 30%, #111827 60%, #0a0a1a 100%)`,
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large gradient orb top-right */}
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-20 blur-3xl"
            style={{ background: `radial-gradient(circle, ${grade.accent}, transparent 70%)` }}
          />
          {/* Small orb bottom-left */}
          <div
            className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
          />
          {/* Mesh pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Top gradient border */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${grade.accent}, #a855f7, #ec4899, transparent)`,
          }}
        />

        <div className="relative z-10">
          {/* Header: Brand + Date */}
          <div className="flex items-center justify-between px-5 pt-5 pb-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Star className="w-5 h-5 text-white" fill="white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wider" style={{ fontFamily: 'system-ui' }}>STUDY AI</p>
                <p className="text-[10px] font-medium" style={{ color: grade.accent }}>Quiz Performance Card</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] font-medium">{date}</p>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: grade.accent, boxShadow: `0 0 6px ${grade.accent}` }} />
                <p className="text-[9px] font-medium" style={{ color: grade.accent }}>Verified</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 mt-3 mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* User Profile Row */}
          <div className="px-5 flex items-center gap-4">
            <div className="relative shrink-0">
              {/* Avatar ring */}
              <div
                className="w-16 h-16 rounded-full p-[2.5px]"
                style={{
                  background: `linear-gradient(135deg, ${grade.accent}, #a855f7, #ec4899)`,
                  boxShadow: `0 0 20px ${grade.glow}33`,
                }}
              >
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                  style={{ background: '#1a1a2e' }}
                  crossOrigin="anonymous"
                />
              </div>
              {/* Grade badge */}
              <div
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-xl border-2"
                style={{
                  background: `linear-gradient(135deg, ${grade.accent}, ${grade.glow})`,
                  borderColor: '#0d1117',
                  boxShadow: `0 2px 10px ${grade.glow}66`,
                }}
              >
                {grade.label}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{displayName}</p>
              <p className="text-gray-400 text-xs truncate mt-0.5">{topic}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: `${difficulty === 'easy' ? '#10b981' : difficulty === 'hard' ? '#ef4444' : '#f59e0b'}15`,
                    color: difficulty === 'easy' ? '#34d399' : difficulty === 'hard' ? '#f87171' : '#fbbf24',
                    border: `1px solid ${difficulty === 'easy' ? '#10b98133' : difficulty === 'hard' ? '#ef444433' : '#f59e0b33'}`,
                  }}
                >
                  {difficulty === 'easy' ? '🟢' : difficulty === 'hard' ? '🔴' : '🟡'} {difficulty}
                </span>
                <span className="text-gray-600 text-[10px]">•</span>
                <span className="text-gray-500 text-[10px] font-medium">{total} Qs</span>
              </div>
            </div>
          </div>

          {/* Score Ring - Hero Section */}
          <div className="flex justify-center py-6 relative">
            {/* Glow behind ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full blur-2xl opacity-20"
              style={{ background: grade.accent }}
            />
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background track */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="#1e1e3a" strokeWidth="8" />
                {/* Animated score arc */}
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={`url(#scoreGrad-${percentage})`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: `drop-shadow(0 0 8px ${grade.glow}66)` }}
                />
                <defs>
                  <linearGradient id={`scoreGrad-${percentage}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={grade.accent} />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white" style={{ textShadow: `0 0 20px ${grade.glow}44` }}>
                  {percentage}%
                </span>
                <span className="text-[11px] text-gray-400 font-semibold mt-0.5">{score}/{total} correct</span>
                <span className="text-lg mt-0.5">{grade.emoji}</span>
              </div>
            </div>
          </div>

          {/* Grade Label */}
          <div className="text-center -mt-2 mb-4">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
              style={{
                background: `linear-gradient(135deg, ${grade.accent}20, ${grade.glow}10)`,
                color: grade.accent,
                border: `1px solid ${grade.accent}33`,
                boxShadow: `0 0 15px ${grade.glow}15`,
              }}
            >
              {grade.emoji} {grade.text}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
            {[
              { icon: Trophy, label: 'Score', value: `${score}/${total}`, color: '#fbbf24' },
              { icon: Target, label: 'Accuracy', value: `${percentage}%`, color: '#a78bfa' },
              { icon: Flame, label: 'Grade', value: grade.label, color: '#f472b6' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-3 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <stat.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                <p className="text-white text-sm font-extrabold">{stat.value}</p>
                <p className="text-gray-500 text-[9px] font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bottom divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          {/* Footer */}
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                <Star className="w-2.5 h-2.5 text-white" fill="white" />
              </div>
              <p className="text-gray-500 text-[9px] font-medium">Study AI • studyai.app</p>
            </div>
            <p className="text-gray-600 text-[9px]">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
