import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature, canAccessFeature } from '@/utils/points/featureLocking';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import StudyPlanner from './StudyPlanner';

interface StudyPlannerWrapperProps {
  onSendMessage?: (message: string) => void;
}

const StudyPlannerWrapper: React.FC<StudyPlannerWrapperProps> = ({ onSendMessage }) => {
  const { currentUser } = useAuth();

  const wrappedOnSendMessage = async (message: string) => {
    if (!currentUser) {
      toast.error('कृपया लॉगिन करें');
      return;
    }

    const result = await deductPointsForFeature(currentUser.uid, 'study_plan');
    
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    
    toast.success(result.message);
    onSendMessage(message);
  };

  return <StudyPlanner onSendMessage={wrappedOnSendMessage} />;
};

export default StudyPlannerWrapper;
