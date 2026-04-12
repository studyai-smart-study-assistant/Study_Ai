
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/use-media-query';
import StudentActivitiesContainer from './student-activities/StudentActivitiesContainer';
import StudentActivitiesLoading from './student-activities/StudentActivitiesLoading';
import { supabase } from '@/integrations/supabase/client';
import { safeInvokeWithAuthRetry } from '@/lib/auth/sessionRecovery';

const StudentActivities = () => {
  const { currentUser, isLoading } = useAuth();
  const [studentPoints, setStudentPoints] = useState(0);
  const [studentLevel, setStudentLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!currentUser) return;

    const loadPoints = async () => {
      const { data } = await safeInvokeWithAuthRetry(
        (body) => supabase.functions.invoke('points-balance', { body }),
        { userId: currentUser.uid }
      );
      setStudentPoints(data?.balance || 0);
      setStudentLevel(data?.level || 1);
    };

    void loadPoints();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`user-points-${currentUser.uid}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_points',
        filter: `user_id=eq.${currentUser.uid}`,
      }, (payload) => {
        const latest = payload.new as { balance?: number; level?: number };
        setStudentPoints(latest.balance || 0);
        setStudentLevel(latest.level || 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
  };

  const handleOpenQRDialog = () => {
    console.log('Opening QR dialog');
  };

  if (isLoading) {
    return <StudentActivitiesLoading />;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">कृपया लॉगिन करें</h2>
          <p className="text-gray-600">छात्र गतिविधियों तक पहुंचने के लिए आपको लॉगिन करना होगा।</p>
        </div>
      </div>
    );
  }

  return (
    <StudentActivitiesContainer
      currentUser={currentUser}
      studentPoints={studentPoints}
      setStudentPoints={setStudentPoints}
      studentLevel={studentLevel}
      setStudentLevel={setStudentLevel}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSendMessage={handleSendMessage}
      handleOpenQRDialog={handleOpenQRDialog}
      isMobile={isMobile}
    />
  );
};

export default StudentActivities;
