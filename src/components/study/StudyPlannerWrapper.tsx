import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deductPointsForFeature, canAccessFeature } from '@/utils/points/featureLocking';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import StudyPlanner from './StudyPlanner';

interface StudyPlannerWrapperProps {
  onSendMessage: (message: string) => void;
}

const StudyPlannerWrapper: React.FC<StudyPlannerWrapperProps> = ({ onSendMessage }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const access = canAccessFeature(currentUser.uid, 'study_plan');
      setHasAccess(access);
    }
  }, [currentUser]);

  const handleUnlock = async () => {
    if (!currentUser) {
      toast.error('कृपया लॉगिन करें');
      return;
    }

    setIsUnlocking(true);
    const result = await deductPointsForFeature(currentUser.uid, 'study_plan');
    
    if (result.success) {
      toast.success(result.message);
      setHasAccess(true);
    } else {
      toast.error(result.message);
    }
    setIsUnlocking(false);
  };

  const wrappedOnSendMessage = async (message: string) => {
    if (!hasAccess) {
      toast.error('कृपया पहले Study Planner को अनलॉक करें');
      return;
    }
    onSendMessage(message);
  };

  if (!currentUser) {
    return (
      <div className="w-full p-6 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <Lock className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
        <h3 className="text-lg font-semibold mb-2">कृपया लॉगिन करें</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Study Planner का उपयोग करने के लिए पहले लॉगिन करें
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    const currentPoints = parseInt(localStorage.getItem(`${currentUser.uid}_points`) || '0');
    return (
      <div className="w-full p-6 text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <Lock className="h-12 w-12 mx-auto mb-4 text-purple-600" />
        <h3 className="text-lg font-semibold mb-2">Study Planner अनलॉक करें</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Study Planner का उपयोग करने के लिए 5 पॉइंट्स चाहिए।<br />
          आपके पास: {currentPoints} पॉइंट्स
        </p>
        <Button onClick={handleUnlock} disabled={isUnlocking} className="mr-2">
          {isUnlocking ? 'अनलॉक हो रहा है...' : '5 Points से अनलॉक करें'}
        </Button>
        <Button onClick={() => window.location.href = '/points-wallet'} variant="outline">
          Points Wallet देखें
        </Button>
      </div>
    );
  }

  return <StudyPlanner onSendMessage={wrappedOnSendMessage} />;
};

export default StudyPlannerWrapper;
