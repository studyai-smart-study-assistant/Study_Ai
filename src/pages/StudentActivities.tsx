
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import StudentActivitiesContainer from './student-activities/StudentActivitiesContainer';
import StudentActivitiesLoading from './student-activities/StudentActivitiesLoading';
import { syncUserPoints } from '@/utils/points/core';

const StudentActivities = () => {
  const { currentUser, isLoading } = useAuth();
  const [studentPoints, setStudentPoints] = useState(0);
  const [studentLevel, setStudentLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Load user points and level from localStorage
  useEffect(() => {
    if (currentUser) {
      const savedPoints = localStorage.getItem(`${currentUser.uid}_points`);
      const savedLevel = localStorage.getItem(`${currentUser.uid}_level`);
      
      if (savedPoints) {
        setStudentPoints(parseInt(savedPoints));
      }
      if (savedLevel) {
        setStudentLevel(parseInt(savedLevel));
      }

      // Sync user points from server
      syncUserPoints(currentUser.uid);
    }
  }, [currentUser]);

  // Update points and level when localStorage changes
  useEffect(() => {
    if (!currentUser) return;

    const handleStorageChange = () => {
      const savedPoints = localStorage.getItem(`${currentUser.uid}_points`);
      const savedLevel = localStorage.getItem(`${currentUser.uid}_level`);
      
      if (savedPoints) {
        setStudentPoints(parseInt(savedPoints));
      }
      if (savedLevel) {
        setStudentLevel(parseInt(savedLevel));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check for changes every second
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
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
