
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, Award, Clock } from 'lucide-react';
import { getLevelColor } from '@/utils/qrCodeUtils';

interface ScanResultProps {
  scanResult: any;
  resetScan: () => void;
}

const ScanResult: React.FC<ScanResultProps> = ({ scanResult, resetScan }) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="h-4 w-4 text-yellow-500" />;
      case 'quiz': return <Award className="h-4 w-4 text-blue-500" />;
      case 'streak': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Star className="h-4 w-4 text-purple-500" />;
    }
  };
  
  const getEducationLevel = (level: string) => {
    switch (level) {
      case 'high-school': return 'हाई स्कूल';
      case 'intermediate': return 'इंटरमीडिएट';
      case 'undergraduate': return 'अंडरग्रेजुएट';
      case 'graduate': return 'ग्रेजुएट';
      default: return level;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">स्कैन परिणाम</h3>
        <Button variant="ghost" size="icon" onClick={resetScan}>
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            छात्र प्रोफाइल
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {scanResult.profileInfo && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700">
                  {scanResult.profileInfo.name ? scanResult.profileInfo.name.charAt(0) : 'S'}
                </div>
                <div>
                  <h3 className="font-bold">{scanResult.profileInfo.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3" /> {scanResult.profileInfo.points} पॉइंट्स
                    </Badge>
                    <Badge 
                      className="flex items-center gap-1 text-xs"
                      style={{ backgroundColor: getLevelColor(scanResult.profileInfo.level) + '20', color: getLevelColor(scanResult.profileInfo.level) }}
                    >
                      <Award className="h-3 w-3" /> Level {scanResult.profileInfo.level}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 border-b pb-1">
                  <span className="text-gray-500">श्रेणी:</span>
                  <span className="font-medium">{scanResult.profileInfo.category === 'student' ? 'छात्र' : scanResult.profileInfo.category}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-1">
                  <span className="text-gray-500">शिक्षा स्तर:</span>
                  <span className="font-medium">{getEducationLevel(scanResult.profileInfo.education)}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-1">
                  <span className="text-gray-500">रैंक:</span>
                  <span className="font-medium">#{scanResult.profileInfo.rank || '?'}</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-1">
                  <span className="text-gray-500">स्ट्रीक:</span>
                  <span className="font-medium">{scanResult.profileInfo.streak || 0} दिन</span>
                </div>
                <div className="grid grid-cols-2 border-b pb-1">
                  <span className="text-gray-500">शामिल हुए:</span>
                  <span className="font-medium">{new Date(scanResult.profileInfo.joinedOn).toLocaleDateString('hi-IN')}</span>
                </div>
              </div>
              
              {scanResult.profileInfo.achievements && scanResult.profileInfo.achievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-1 text-sm">
                    <Award className="h-4 w-4 text-yellow-500" /> प्रमुख उपलब्धियां
                  </h4>
                  {scanResult.profileInfo.achievements.slice(0, 3).map((achievement: any, index: number) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md"
                    >
                      {getAchievementIcon(achievement.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{achievement.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">+{achievement.points}</Badge>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={() => window.open(scanResult.profileLink, '_blank')}
              >
                पूरा प्रोफाइल देखें
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanResult;
