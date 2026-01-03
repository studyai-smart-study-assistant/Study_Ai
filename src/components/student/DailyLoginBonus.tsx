
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, PartyPopper, Sparkles, Crown, Zap, Star, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NativeAd } from '@/components/ads';

interface DailyLoginBonusProps {
  userId: string;
  points: number;
  streakDays: number;
}

const DailyLoginBonus: React.FC<DailyLoginBonusProps> = ({ userId, points, streakDays }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bonusAlreadyShown, setBonusAlreadyShown] = useState(false);
  
  useEffect(() => {
    const bonusShownKey = `${userId}_bonus_shown_${new Date().toDateString()}`;
    const bonusShown = localStorage.getItem(bonusShownKey);
    
    if (!bonusShown && points > 0) {
      setIsOpen(true);
      localStorage.setItem(bonusShownKey, 'true');
      setBonusAlreadyShown(true);
    } else {
      setBonusAlreadyShown(true);
    }
  }, [userId, points]);
  
  if (bonusAlreadyShown && !isOpen) return null;

  // Determine the streak milestone and icon
  const getStreakInfo = () => {
    if (streakDays % 7 === 0 && streakDays > 0) {
      return { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30', title: 'साप्ताहिक स्ट्रीक बोनस!' };
    } else if (streakDays >= 3) {
      return { icon: Trophy, color: 'text-purple-500', bgColor: 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30', title: 'स्ट्रीक बोनस!' };
    } else {
      return { icon: Star, color: 'text-blue-500', bgColor: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30', title: 'दैनिक लॉगिन बोनस!' };
    }
  };

  const streakInfo = getStreakInfo();
  const StreakIcon = streakInfo.icon;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg border-0 bg-transparent p-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            duration: 0.6
          }}
          className="relative"
        >
          {/* Background with animated glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-pink-600/20 rounded-3xl blur-xl animate-pulse" />
          
          {/* Main content container */}
          <div className={`relative ${streakInfo.bgColor} backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl overflow-hidden`}>
            {/* Animated particles background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-2 h-2 ${streakInfo.color.replace('text-', 'bg-')} rounded-full opacity-40`}
                  initial={{ x: Math.random() * 400, y: Math.random() * 300, scale: 0 }}
                  animate={{ 
                    x: Math.random() * 400, 
                    y: Math.random() * 300, 
                    scale: [0, 1, 0],
                    rotate: 360 
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2 
                  }}
                />
              ))}
            </div>

            <DialogHeader className="relative pt-8 pb-2">
              <DialogTitle className="text-center text-xl sm:text-2xl font-bold">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2 text-gradient"
                >
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" />
                  {streakInfo.title}
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" />
                </motion.div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="relative px-8 py-6 flex flex-col items-center">
              {/* Main points display */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15, 
                  delay: 0.2 
                }}
                className="relative mb-6"
              >
                <div className={`h-32 w-32 rounded-full ${streakInfo.bgColor} border-4 border-white/30 dark:border-gray-700/30 flex items-center justify-center shadow-2xl relative overflow-hidden`}>
                  {/* Animated glow ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                      className="text-4xl font-bold text-gradient mb-1"
                    >
                      +{points}
                    </motion.div>
                    <div className="text-sm font-medium opacity-80">पॉइंट्स</div>
                  </div>
                </div>

                {/* Streak badge */}
                {streakDays > 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="absolute -bottom-3 -right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-3 py-2 text-sm font-bold flex items-center shadow-lg border-2 border-white dark:border-gray-800"
                  >
                    <StreakIcon className="h-4 w-4 mr-1" />
                    {streakDays}
                  </motion.div>
                )}
              </motion.div>
              
              {/* Description text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-6 space-y-2"
              >
                <p className="text-lg font-semibold">
                  🎉 बधाई हो! आपको {points} पॉइंट्स मिले हैं
                </p>
                {streakDays > 1 && (
                  <motion.p
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-base text-purple-700 dark:text-purple-300 font-medium"
                  >
                    🔥 आपकी {streakDays} दिन की लगातार स्ट्रीक चल रही है!
                  </motion.p>
                )}
                <p className="text-sm opacity-70">
                  रोज़ लॉगिन करते रहें और अधिक पॉइंट्स पाएं
                </p>
              </motion.div>
              
              {/* Native Ad - Sponsored content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="w-full mb-4"
              >
                <p className="text-xs text-center text-muted-foreground mb-2">प्रायोजित</p>
                <NativeAd className="rounded-lg overflow-hidden" />
              </motion.div>
              
              {/* Action button */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="w-full"
              >
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 text-lg"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Zap className="h-5 w-5" />
                    धन्यवाद! 🚀
                  </motion.div>
                </Button>
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 left-4">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Award className="h-6 w-6 text-yellow-500 opacity-60" />
              </motion.div>
            </div>
            <div className="absolute top-4 right-4">
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              >
                <PartyPopper className="h-6 w-6 text-pink-500 opacity-60" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyLoginBonus;
