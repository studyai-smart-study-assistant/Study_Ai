
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ChatOptimized from '@/components/ChatOptimized';
import ChatHeader from '@/components/ChatHeader';
import DailyLoginBonus from '@/components/student/DailyLoginBonus';
import LoadingScreen from '@/components/home/LoadingScreen';
import BackgroundElements from '@/components/home/BackgroundElements';
import HeaderActions from '@/components/home/HeaderActions';
import FastErrorBoundary from '@/components/common/FastErrorBoundary';
import { useAutoLoginBonus } from '@/hooks/home/useAutoLoginBonus';
import { useChatInitialization } from '@/hooks/home/useChatInitialization';
import { useHomeEffects } from '@/hooks/home/useHomeEffects';

const IndexOptimized = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  const { loginBonusPoints, streakDays } = useAutoLoginBonus();
  
  const {
    currentChatId,
    isLoading,
    initializeChat,
    handleNavigationState,
    handleNewChat,
    handleChatSelect
  } = useChatInitialization();

  useHomeEffects({
    authLoading,
    isLoading,
    location,
    initializeChat,
    handleNavigationState
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChatSelectWithMobile = (chatId: string) => {
    handleChatSelect(chatId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleNewChatWithMobile = async () => {
    await handleNewChat();
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  if (isLoading || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <FastErrorBoundary>
      <motion.div
        className="flex h-screen overflow-hidden bg-gradient-to-br from-white via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ height: '100vh', maxHeight: '100vh' }}
      >
        <BackgroundElements />

        <AnimatePresence mode="wait">
          <motion.div
            key="sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120, duration: 0.3 }}
          >
            <Sidebar 
              isOpen={isSidebarOpen || !isMobile}
              onClose={() => setIsSidebarOpen(false)}
            />
          </motion.div>
        </AnimatePresence>
        
        <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25, stiffness: 120 }}
          >
            <ChatHeader 
              onToggleSidebar={toggleSidebar} 
              onNewChat={handleNewChatWithMobile}
            >
              <HeaderActions 
                currentChatId={currentChatId}
                onSelectChat={handleChatSelectWithMobile}
              />
            </ChatHeader>
          </motion.div>
          
          <div className="flex-1 flex overflow-hidden">
            {currentChatId && (
              <motion.div 
                className="flex-1 overflow-hidden"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <ChatOptimized 
                  chatId={currentChatId} 
                  onChatUpdated={() => {}} 
                />
              </motion.div>
            )}
          </div>
        </main>
        
        {/* Daily Login Bonus - Optimized rendering */}
        {currentUser && loginBonusPoints > 0 && (
          <DailyLoginBonus 
            userId={currentUser.uid}
            points={loginBonusPoints}
            streakDays={streakDays}
          />
        )}
      </motion.div>
    </FastErrorBoundary>
  );
};

export default IndexOptimized;
