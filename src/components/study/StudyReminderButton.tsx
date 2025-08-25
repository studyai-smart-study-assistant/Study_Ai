
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";

const StudyReminderButton: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleOpenActivities = () => {
    navigate("/student-activities");
  };
  
  // अब सिर्फ़ एक्टिविटीज़ पेज के लिए बटन दिखाएंगे
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="mb-6"
    >
      <Button 
        onClick={handleOpenActivities}
        className="w-full font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md h-auto py-4 rounded-lg border-0 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/10 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <div className="flex items-center justify-center space-x-3 z-10 relative">
          <BookOpen className="h-6 w-6 text-yellow-300" />
          <div className="flex flex-col items-start">
            <span className="text-lg">विद्यार्थी गतिविधियाँ</span>
            <span className="text-xs text-gray-200">अपनी गतिविधियों का प्रबंधन करें</span>
          </div>
        </div>
      </Button>
    </motion.div>
  );
};

export default StudyReminderButton;
