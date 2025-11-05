
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PointsWallet from '@/components/student/PointsWallet';
import { motion } from 'framer-motion';

const PointsWalletPage = () => {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    if (currentUser) {
      const savedPoints = localStorage.getItem(`${currentUser.uid}_points`);
      if (savedPoints) {
        setCurrentPoints(parseInt(savedPoints));
      }
    }
  }, [currentUser]);

  // Update points when they change
  useEffect(() => {
    if (!currentUser) return;

    const handleStorageChange = () => {
      const savedPoints = localStorage.getItem(`${currentUser.uid}_points`);
      if (savedPoints) {
        setCurrentPoints(parseInt(savedPoints));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950">
      <div className="max-w-4xl mx-auto p-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            वापस जाएं
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            पॉइंट्स वॉलेट
          </h1>
          <p className="text-muted-foreground mt-2">
            अपने पॉइंट्स प्रबंधित करें और दोस्तों को आमंत्रित करें
          </p>
        </motion.div>

        {/* Wallet Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PointsWallet userId={currentUser.uid} currentPoints={currentPoints} />
        </motion.div>
      </div>
    </div>
  );
};

export default PointsWalletPage;
