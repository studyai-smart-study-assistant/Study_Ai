
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Medal, Star, Share2, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabaseLeaderboard } from '@/hooks/useSupabaseLeaderboard';

interface StudentLeaderboardProps {
  currentUser: any;
}

// Function to get user initials
const getUserInitials = (name: string): string => {
  const nameParts = name.split(" ");
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Function to generate a deterministic color based on user id
const getAvatarColor = (userId: string): string => {
  const colors = [
    "bg-purple-500 text-white",
    "bg-indigo-500 text-white",
    "bg-blue-500 text-white",
    "bg-green-500 text-white",
    "bg-yellow-500 text-white",
    "bg-orange-500 text-white",
    "bg-red-500 text-white",
    "bg-pink-500 text-white",
    "bg-violet-500 text-white",
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-cyan-500 text-white",
  ];
  
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum += userId.charCodeAt(i);
  }
  
  return colors[sum % colors.length];
};

const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ currentUser }) => {
  const { t, language } = useLanguage();
  const { users, isLoading, currentUserData } = useSupabaseLeaderboard(currentUser?.uid);
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };
  
  const shareLeaderboard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: language === 'hi' ? 'अध्ययन लीडरबोर्ड' : 'Study Leaderboard',
          text: language === 'hi' ? 'देखें कौन है सबसे आगे!' : 'See who is ahead!',
          url: window.location.href,
        });
        toast.success(language === 'hi' ? 'लीडरबोर्ड शेयर किया गया' : 'Leaderboard shared');
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success(language === 'hi' ? 'लिंक कॉपी किया गया' : 'Link copied');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error(language === 'hi' ? 'शेयर करने में त्रुटि' : 'Error sharing');
    }
  };
  
  return (
    <CardContent className="p-2 sm:p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            {t('leaderboard')}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={shareLeaderboard}
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4 hidden sm:block" />
            <span className="sm:ml-1">{language === 'hi' ? 'शेयर' : 'Share'}</span>
          </Button>
        </div>
        
        {currentUserData && (
          <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium">
              {language === 'hi' ? 'आपका रैंक:' : 'Your Rank:'} <Badge className="ml-2">{currentUserData.rank}</Badge>
            </p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center p-2 sm:p-4">{language === 'hi' ? 'रैंक' : 'Rank'}</TableHead>
                  <TableHead className="p-2 sm:p-4">{language === 'hi' ? 'छात्र' : 'Student'}</TableHead>
                  <TableHead className="text-right p-2 sm:p-4">{language === 'hi' ? 'XP' : 'XP'}</TableHead>
                  <TableHead className="text-right w-20 p-2 sm:p-4">{language === 'hi' ? 'लेवल' : 'Level'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.uid;
                  return (
                    <TableRow 
                      key={user.id}
                      className={isCurrentUser ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                    >
                      <TableCell className="text-center p-2 sm:p-4">
                        <div className="flex justify-center">
                          {getRankIcon(user.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className={`w-6 h-6 sm:w-7 sm:h-7 ${isCurrentUser ? 'ring-1 ring-purple-500' : ''}`}>
                            {user.avatar && <AvatarImage src={user.avatar} />}
                            <AvatarFallback className={`${getAvatarColor(user.id)} text-xs`}>
                              {getUserInitials(user.name || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className={`block truncate ${isCurrentUser ? "font-bold" : ""}`}>
                              {user.name || (language === 'hi' ? 'अज्ञात छात्र' : 'Unknown Student')}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs text-purple-600 dark:text-purple-400">
                                {language === 'hi' ? '(आप)' : '(You)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                          {user.xp}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {user.level}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              {language === 'hi' ? 'अभी कोई छात्र रजिस्टर नहीं हुआ है' : 'No students registered yet'}
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default StudentLeaderboard;
