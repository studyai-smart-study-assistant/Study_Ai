
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const LeaderboardHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-8">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-2" 
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        वापस जाएं
      </Button>
      
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 pb-1">
        लीडरबोर्ड
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        स्टडी AI के शीर्ष उपयोगकर्ताओं की रैंकिंग देखें और लीडरबोर्ड में अपनी जगह बनाएँ!
      </p>
    </div>
  );
};

export default LeaderboardHeader;
