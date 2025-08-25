
import React, { useState, useEffect } from 'react';
import { CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Medal, Star, Share2, MessageCircle, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { observeLeaderboardData, startChat } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Student {
  id: string;
  name: string;
  points: number;
  level: number;
  rank: number;
  photoURL?: string;
  isCurrentUser?: boolean;
  streak?: number;
}

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
    "bg-purple-500 text-white", // Primary purple
    "bg-indigo-500 text-white", // Indigo
    "bg-blue-500 text-white",   // Blue
    "bg-green-500 text-white",  // Green
    "bg-yellow-500 text-white", // Yellow
    "bg-orange-500 text-white", // Orange
    "bg-red-500 text-white",    // Red
    "bg-pink-500 text-white",   // Pink
    "bg-violet-500 text-white", // Violet
    "bg-emerald-500 text-white", // Emerald
    "bg-teal-500 text-white",   // Teal
    "bg-cyan-500 text-white",   // Cyan
  ];
  
  // Use the sum of character codes to pick a color
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum += userId.charCodeAt(i);
  }
  
  return colors[sum % colors.length];
};

const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = observeLeaderboardData((leaderboardData) => {
        const studentsWithCurrentUser = leaderboardData.map(student => {
          // Get streak information directly from Firebase - no localStorage needed
          const streakValue = student.currentStreak || student.streak || 0;
          
          console.log(`🔥 Leaderboard - User ${student.name}: Firebase streak=${streakValue}`);
          
          return {
            ...student,
            // Ensure name is never undefined
            name: student.name || 'Unknown',
            isCurrentUser: student.id === currentUser.uid,
            streak: streakValue
          }
        });
        
        setStudents(studentsWithCurrentUser);
        
        const currentUserRecord = studentsWithCurrentUser.find(s => s.isCurrentUser);
        if (currentUserRecord) {
          setCurrentUserRank(currentUserRecord.rank);
          
          if (currentUserRecord.rank <= 10 && leaderboardData.length > 5) {
            const bonusKey = `${currentUser.uid}_top10_bonus`;
            if (!localStorage.getItem(bonusKey)) {
              localStorage.setItem(bonusKey, 'true');
              
              import('@/utils/points').then(({ addPointsToUser }) => {
                addPointsToUser(
                  currentUser.uid,
                  20,
                  'achievement',
                  language === 'hi' ? 'टॉप 10 लीडरबोर्ड बोनस' : 'Top 10 Leaderboard Bonus'
                );
                toast.success(language === 'hi' ? 'आप टॉप 10 में हैं! +20 पॉइंट्स मिले' : 'You are in Top 10! +20 points awarded');
              });
            }
          }
        }
        
        setLoading(false);
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [currentUser, language]);
  
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
  
  const handleMessageStudent = async (studentId: string) => {
    if (!currentUser) {
      toast.error(language === 'hi' ? 'आपको मैसेज भेजने के लिए लॉगिन करना होगा' : 'You need to login to send messages');
      return;
    }
    
    if (studentId === currentUser.uid) {
      toast.error(language === 'hi' ? 'आप अपने आप को मैसेज नहीं भेज सकते' : 'You cannot message yourself');
      return;
    }
    
    try {
      const chatId = await startChat(currentUser.uid, studentId);
      navigate('/chat', { state: { activeChatId: chatId, recipientId: studentId, isGroup: false } });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error(language === 'hi' ? 'चैट शुरू करने में त्रुटि' : 'Error starting chat');
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
        
        {currentUserRank && (
          <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium">
              {language === 'hi' ? 'आपका रैंक:' : 'Your Rank:'} <Badge className="ml-2">{currentUserRank}</Badge>
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : students.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center p-2 sm:p-4">{language === 'hi' ? 'रैंक' : 'Rank'}</TableHead>
                  <TableHead className="p-2 sm:p-4">{language === 'hi' ? 'छात्र' : 'Student'}</TableHead>
                  <TableHead className="text-right p-2 sm:p-4">{language === 'hi' ? 'पॉइंट्स' : 'Points'}</TableHead>
                  <TableHead className="text-right w-20 p-2 sm:p-4">{language === 'hi' ? 'लेवल' : 'Level'}</TableHead>
                  <TableHead className="text-center w-24 p-2 sm:p-4">{language === 'hi' ? 'स्ट्रीक' : 'Streak'}</TableHead>
                  <TableHead className="w-20 p-2 sm:p-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow 
                    key={student.id}
                    className={student.isCurrentUser ? "bg-purple-50 dark:bg-purple-900/20" : ""}
                  >
                    <TableCell className="text-center p-2 sm:p-4">
                      <div className="flex justify-center">
                        {getRankIcon(student.rank)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium p-2 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className={`w-6 h-6 sm:w-7 sm:h-7 ${student.isCurrentUser ? 'ring-1 ring-purple-500' : ''}`}>
                          <AvatarFallback className={`${getAvatarColor(student.id)} text-xs`}>
                            {getUserInitials(student.name || 'S')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className={`block truncate ${student.isCurrentUser ? "font-bold" : ""}`}>
                            {student.name || (language === 'hi' ? 'अज्ञात छात्र' : 'Unknown Student')}
                          </span>
                          {student.isCurrentUser && (
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
                        {student.points}
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2 sm:p-4">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {student.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-4">
                      {student.streak && student.streak > 0 ? (
                        <Badge className={`${student.streak >= 7 ? 'bg-orange-500' : 'bg-amber-400'} text-white`}>
                          <Flame className="h-3.5 w-3.5 mr-1" /> {student.streak}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="p-2 sm:p-4">
                      {!student.isCurrentUser && currentUser && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full flex items-center justify-center gap-1"
                          onClick={() => handleMessageStudent(student.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            {language === 'hi' ? 'मैसेज' : 'Message'}
                          </span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
