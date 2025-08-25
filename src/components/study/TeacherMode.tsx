
import React, { useState, useEffect } from 'react';
import { TeacherModeProps } from './teacher/types';
import TeacherModeHeader from './teacher/TeacherModeHeader';
import TeacherModeTabs from './teacher/TeacherModeTabs';
import { ComprehensiveActivityTracker } from '@/utils/comprehensiveActivityTracker';
import { useAuth } from '@/contexts/AuthContext';

const TeacherMode: React.FC<TeacherModeProps> = ({ onSendMessage }) => {
  const [useVoiceResponse, setUseVoiceResponse] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [learningMode, setLearningMode] = useState('interactive');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const { currentUser } = useAuth();

  const handleSendMessage = (message: string) => {
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
