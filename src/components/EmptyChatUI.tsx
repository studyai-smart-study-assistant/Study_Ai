
import React, { useState } from 'react';
import SuggestionButton from './SuggestionButton';
import { MessageSquare, Code, FileText, BookOpen, Bell, Calculator, Brain, GraduationCap, Clock, Award } from 'lucide-react';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useAuth } from '@/contexts/AuthContext';
import StudyTimer from './study/StudyTimer';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface EmptyChatUIProps {
  onCreateImage: () => void;
  onSurpriseMe: () => void;
  onAnalyzeImages: () => void;
  onSummarizeText: () => void;
  onMore: () => void;
}

const EmptyChatUI: React.FC<EmptyChatUIProps> = ({
  onCreateImage,
  onSurpriseMe,
  onAnalyzeImages,
  onSummarizeText,
  onMore
}) => {
  const greeting = getTimeBasedGreeting();
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || '';
  const navigate = useNavigate();
  const [showTimer, setShowTimer] = useState(false);
  
  const handleStudySessionComplete = () => {
    toast.success("Great job completing your study session!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-8 bg-gradient-to-b from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
      <div className="text-center animate-fade-in">
        <h1 className="text-3xl font-medium text-gray-800 dark:text-gray-200 mb-2">
          {greeting}{displayName ? `, ${displayName}` : ''}
        </h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-400">
          How can Study AI assist you today?
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
        <div className="col-span-1 md:col-span-2 mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Examples</h2>
            {!showTimer && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTimer(true)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <Clock className="h-4 w-4 mr-1" />
                Study Timer
              </Button>
            )}
          </div>
        </div>
        
        {showTimer ? (
          <div className="col-span-1 md:col-span-2 mb-4">
            <StudyTimer onComplete={handleStudySessionComplete} />
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setShowTimer(false)}
              className="mt-2 text-purple-600 dark:text-purple-400"
            >
              Hide Timer
            </Button>
          </div>
        ) : (
          <>
            <SuggestionButton 
              icon={<MessageSquare size={16} />} 
              label="Explain quantum computing in simple terms" 
              onClick={onSurpriseMe}
              className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-900/50 dark:hover:to-blue-900/50"
            />
            
            <SuggestionButton 
              icon={<Code size={16} />} 
              label="Generate a React component for a contact form" 
              onClick={onCreateImage}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50"
            />
            
            <SuggestionButton 
              icon={<FileText size={16} />} 
              label="Summarize this article for a 2nd grader" 
              onClick={onSummarizeText}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50"
            />
            
            <SuggestionButton 
              icon={<BookOpen size={16} />} 
              label="Give me ideas for my next vacation" 
              onClick={onAnalyzeImages}
              className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/30 dark:to-teal-900/30 hover:from-cyan-100 hover:to-teal-100 dark:hover:from-cyan-900/50 dark:hover:to-teal-900/50"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl px-4">
        <Button 
          variant="outline" 
          className="flex flex-col items-center gap-2 p-4 h-auto border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          onClick={() => navigate('/teacher-chats')}
        >
          <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <span className="text-sm">Teacher Chats</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex flex-col items-center gap-2 p-4 h-auto border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          onClick={() => navigate('/student-activities')}
        >
          <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <span className="text-sm">Student Activities</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex flex-col items-center gap-2 p-4 h-auto border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          onClick={() => navigate('/leaderboard')}
        >
          <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <span className="text-sm">Leaderboard</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex flex-col items-center gap-2 p-4 h-auto border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          onClick={() => navigate('/feedback')}
        >
          <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <span className="text-sm">Give Feedback</span>
        </Button>
      </div>

      <div className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-md bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
        Study AI can make mistakes. Consider checking important information.
      </div>
    </div>
  );
};

export default EmptyChatUI;
