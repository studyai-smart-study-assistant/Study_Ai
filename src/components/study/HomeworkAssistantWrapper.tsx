import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature, canAccessFeature } from '@/utils/points/featureLocking';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import HomeworkAssistant from './HomeworkAssistant';

interface HomeworkAssistantWrapperProps {
  onSendMessage?: (message: string) => void;
}

const HomeworkAssistantWrapper: React.FC<HomeworkAssistantWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      toast.error('कृपया लॉगिन करें');
      return;
    }

    const result = await deductPointsForFeature(currentUser.uid, 'homework');
    
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    
    toast.success(result.message);
    onSendMessage(message);
  };

  return <HomeworkAssistant onSendMessage={wrappedOnSendMessage} />;
};

export default HomeworkAssistantWrapper;
