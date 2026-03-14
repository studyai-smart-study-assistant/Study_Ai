
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Share2, CheckCircle, Trophy, Target, Award, User, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const QuizResultCard = ({ results, quiz, onClose, language }) => {
  const cardRef = useRef(null);
  const { currentUser } = useAuth();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#10142C',
        onclone: (document) => {
          const images = document.getElementsByTagName('img');
          for (let img of images) {
            img.setAttribute('crossOrigin', 'anonymous');
          }
        }
      });
      const link = document.createElement('a');
      link.download = 'quiz-performance-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(language === 'hi' ? 'कार्ड सफलतापूर्वक डाउनलोड हो गया!' : 'Card downloaded successfully!');
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error(language === 'hi' ? 'कार्ड डाउनलोड करने में विफल।' : 'Failed to download card.');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: '#10142C' });
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'quiz-performance.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: language === 'hi' ? `${quiz.title} क्विज़ परिणाम` : `${quiz.title} Quiz Results`,
              text: language === 'hi' ? `मैंने ${quiz.title} क्विज़ में ${results.score}% स्कोर किया! • mystudyai.online` : `I scored ${results.score}% on the ${quiz.title} quiz! • mystudyai.online`,
            });
          } else {
            handleDownload();
            toast.info(language === 'hi' ? 'छवि डाउनलोड की गई। अब आप इसे साझा कर सकते हैं।' : 'Image downloaded. You can now share it.');
          }
        }
      });
    } catch (error) {
      console.error('Error sharing card:', error);
      toast.error(language === 'hi' ? 'कार्ड साझा करने में विफल।' : 'Failed to share card.');
    }
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400', label: 'Outstanding' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500', label: 'Excellent' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400', label: 'Good' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-400', label: 'Average' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-400', label: 'Needs Improvement' };
    return { grade: 'F', color: 'text-red-400', label: 'Needs Practice' };
  };

  const { grade, color, label } = getGrade(results.score);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4 z-50 font-sans">
      <div className="relative w-full max-w-sm">
        <div ref={cardRef} className="bg-[#10142C] text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-blue-900/50">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-bold text-lg">STUDY AI</p>
              <p className="text-sm text-blue-400">Quiz Performance Card</p>
            </div>
            <div className="text-right text-xs">
              <p>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} {new Date().getFullYear()}</p>
              <p className="flex items-center justify-end gap-1 text-green-400 mt-1">
                <CheckCircle className="w-3 h-3" /> Verified
              </p>
            </div>
          </div>

          {/* User Info & Chapter */}
          <div className="text-center my-6">
            <div className="relative inline-block">
              <img
                src={currentUser?.photoURL || '/images/default-avatar.png'}
                alt="User"
                className="w-24 h-24 rounded-full border-4 border-blue-600 object-cover shadow-lg mx-auto"
                crossOrigin="anonymous"
              />
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 border-2 border-blue-500 ${color}`}>
                <span className="font-bold text-sm">{grade}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mt-4">{currentUser?.displayName || 'Student'}</h2>
            <p className="text-gray-400 text-sm mt-1">{quiz.title || 'भारतीय संस्कृति और विरासत'}</p>
          </div>

          {/* Score Circle */}
          <div className="relative text-center my-8">
            <div className="w-48 h-48 mx-auto relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-blue-900/50" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  strokeWidth="8"
                  strokeDasharray={`${(results.score / 100) * 2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  stroke="#4F46E5"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  transform="rotate(-90 50 50)"
                  style={{ filter: "drop-shadow(0 0 6px #4F46E5)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-white" style={{ textShadow: '0 0 10px #4F46E5' }}>{results.score}%</span>
                <span className="text-sm text-gray-300">{results.correctAnswers}/{quiz.questions.length} correct</span>
                <Trophy className="w-5 h-5 mt-2 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`font-semibold px-4 py-2 rounded-full ${results.score >= 80 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <BookOpen className="w-4 h-4 inline-block mr-2" />
                {results.score >= 80 ? 'Outstanding!' : 'Needs Practice'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <p className="font-bold text-lg">{results.correctAnswers}/{quiz.questions.length}</p>
              <p className="text-xs text-gray-400">SCORE</p>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <p className="font-bold text-lg">{results.score}%</p>
              <p className="text-xs text-gray-400">ACCURACY</p>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg">
               <div className={`font-bold text-lg ${color}`}>{grade}</div>
               <p className="text-xs text-gray-400">GRADE</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-blue-400/70 pt-4 mt-6 border-t border-blue-900/50">
            Created with Study AI • <span className="font-semibold text-blue-300">mystudyai.online</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around mt-4">
          <Button onClick={handleDownload} className="flex-1 mx-2 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 rounded-full">
            <Download className="h-4 w-4" /> {language === 'hi' ? 'डाउनलोड' : 'Download'}
          </Button>
          <Button onClick={handleShare} className="flex-1 mx-2 bg-green-600 hover:bg-green-700 text-white font-bold gap-2 rounded-full">
            <Share2 className="h-4 w-4" /> {language === 'hi' ? 'शेयर' : 'Share'}
          </Button>
          <Button onClick={onClose} variant="ghost" className="flex-1 mx-2 text-gray-300 hover:text-white rounded-full">
            {language === 'hi' ? 'बंद' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultCard;
