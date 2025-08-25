
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, Share2, LinkIcon } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { ProfileData } from '@/types/student';
import { getUserInitials, getAvatarColor } from '@/components/leaderboard/utils/avatarUtils';

interface ProfileBannerProps {
  profileData: ProfileData;
  levelProgress: number;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({ profileData, levelProgress }) => {
  // Ensure we have valid data
  const name = profileData?.name || 'Student';
  const points = profileData?.points || 0;
  const level = profileData?.level || 1;
  const userInitials = getUserInitials(name);
  const avatarColor = getAvatarColor(profileData?.id || '');
  
  const shareProfile = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${name} का अध्ययन प्रोफाइल`,
          text: `देखें ${name} का अध्ययन प्रोफाइल! वर्तमान स्तर: ${level}, अर्जित अंक: ${points}`,
          url: window.location.href,
        });
        toast.success('प्रोफाइल शेयर किया गया');
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(window.location.href);
        toast.success('प्रोफाइल लिंक कॉपी किया गया');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('शेयर करने में त्रुटि');
    }
  };
  
  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('प्रोफाइल लिंक कॉपी किया गया');
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-24"></div>
      <CardContent className="pt-0 relative">
        <div className="flex flex-col items-center -mt-12">
          <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-lg">
            <div className={`w-full h-full rounded-full ${avatarColor} flex items-center justify-center text-2xl font-bold relative overflow-hidden`}>
              <span className="relative z-10 text-white font-black select-none" style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.4)',
                letterSpacing: '1px'
              }}>
                {userInitials}
              </span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mt-4">{name}</h2>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
              <Star className="h-3 w-3" />
              {points} पॉइंट्स
            </Badge>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Level {level}
            </Badge>
          </div>
          
          <div className="w-full mt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">अगले लेवल तक</span>
              <span className="text-sm font-medium">{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 w-full gap-2 mt-6">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={copyProfileLink}
            >
              <LinkIcon className="h-4 w-4" />
              लिंक कॉपी करें
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={shareProfile}
            >
              <Share2 className="h-4 w-4" />
              शेयर करें
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileBanner;
