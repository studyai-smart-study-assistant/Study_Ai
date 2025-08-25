
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap, Globe, BarChart3 } from 'lucide-react';
import { chatHandler } from '@/utils/enhancedChatHandler';

interface ChatStatsDisplayProps {
  className?: string;
}

const ChatStatsDisplay: React.FC<ChatStatsDisplayProps> = ({ className = '' }) => {
  const [stats, setStats] = useState(chatHandler.getStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(chatHandler.getStats());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (stats.totalQueries === 0 && !isVisible) {
    return null;
  }

  return (
    <Card className={`${className} border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-600" />
          Chat Performance Stats
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                कस्टम रिस्पांस
              </span>
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">
              {stats.customResponses}
            </div>
          </div>
          
          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Globe className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                API Calls
              </span>
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {stats.apiCalls}
            </div>
          </div>
        </div>
        
        <div className="text-center p-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
              Optimization Rate
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
            {stats.customResponsePercentage}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            फास्ट रिस्पांस रेट
          </div>
        </div>
        
        <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => chatHandler.resetStats()}
            className="w-full text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50"
          >
            Reset Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatStatsDisplay;
