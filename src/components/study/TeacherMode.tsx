
import React, { useState, useEffect } from 'react';
import { TeacherModeProps } from './teacher/types';
import TeacherModeHeader from './teacher/TeacherModeHeader';
import TeacherModeTabs from './teacher/TeacherModeTabs';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature, canAccessFeature } from '@/utils/points/featureLocking';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const TeacherMode: React.FC<TeacherModeProps> = ({ onSendMessage }) => {
  const [useVoiceResponse, setUseVoiceResponse] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [learningMode, setLearningMode] = useState('interactive');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const { currentUser } = useAuth();

  const handleSendMessage = async (message: string) => {
    if (!currentUser) {
      toast.error('कृपया लॉगिन करें');
      return;
    }

    // Check and deduct points before allowing access
    const result = await deductPointsForFeature(currentUser.uid, 'teacher_mode');
    
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    
    toast.success(result.message);
    // Track the start time of interaction
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }

    // Track interactive teaching activity
    if (currentUser) {
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 30;
      ComprehensiveActivityTracker.trackInteractiveTeaching(
        currentUser.uid, 
        message, 
        timeSpent
      );
    }

    // Send the message
    onSendMessage(message);
    
    console.log('Interactive teaching message tracked:', {
      user: currentUser?.uid,
      message: message.substring(0, 50) + '...',
      timeSpent: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 30
    });
  };

  // Reset session time when component unmounts or user changes
  useEffect(() => {
    setSessionStartTime(Date.now());
    
    return () => {
      setSessionStartTime(null);
    };
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="w-full p-6 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <Lock className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
        <h3 className="text-lg font-semibold mb-2">कृपया लॉगिन करें</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Teacher Mode का उपयोग करने के लिए पहले लॉगिन करें
        </p>
      </div>
    );
  }


  return (
    <div className="w-full space-y-6">
      <TeacherModeHeader />
      
      <TeacherModeTabs
        onSendMessage={handleSendMessage}
        useVoiceResponse={useVoiceResponse}
        setUseVoiceResponse={setUseVoiceResponse}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        learningMode={learningMode}
        setLearningMode={setLearningMode}
      />
    </div>
  );
};

export default TeacherMode;
