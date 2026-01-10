import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature, canAccessFeature } from '@/utils/points/featureLocking';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import QuizGenerator from './QuizGenerator';

interface QuizGeneratorWrapperProps {
  onSendMessage?: (message: string) => void;
}

const QuizGeneratorWrapper: React.FC<QuizGeneratorWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      toast.error('कृपया लॉगिन करें');
      return;
    }

    const result = await deductPointsForFeature(currentUser.uid, 'quiz_generation');
    
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    
    toast.success(result.message);
    onSendMessage(message);
  };

  return <QuizGenerator onSendMessage={wrappedOnSendMessage} />;
};

export default QuizGeneratorWrapper;
