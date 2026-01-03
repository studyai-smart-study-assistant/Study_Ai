
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, Activity, Star, AlertTriangle, Target } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from '@/components/ui/progress';
import ProfileHeader from '@/components/profile/ProfileHeader';
import UserInfoCards from '@/components/profile/UserInfoCards';
import ProfileNavigation from '@/components/profile/ProfileNavigation';

import BackupCard from '@/components/backup/BackupCard';
import ActivePlansWidget from '@/components/study/ActivePlansWidget';
import DangerZone from '@/components/profile/DangerZone';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logoutUser } from '@/lib/firebase';
import { syncUserPoints } from '@/utils/points/core';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { NativeAd } from '@/components/ads';

const Profile = () => {
  const { currentUser, isLoading } = useAuth();
  const [userCategory, setUserCategory] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [studentPoints, setStudentPoints] = useState(0);
  const [studentLevel, setStudentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [userSynced, setUserSynced] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language, t } = useLanguage();

  useEffect(() => {
    console.log('Profile page loaded, user:', currentUser?.uid);
    
    if (!isLoading && !currentUser) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (currentUser && !userSynced) {
      // Sync user points from server when viewing profile
      syncUserPoints(currentUser.uid).then(() => {
        setUserSynced(true);
        loadStudentData();
      }).catch(error => {
        console.error("Error syncing user points:", error);
        loadStudentData(); // Continue with localStorage as fallback
      });
      
      setUserCategory(localStorage.getItem('userCategory') || '');
      setEducationLevel(localStorage.getItem('educationLevel') || '');
    } else if (currentUser && userSynced) {
      loadStudentData();
    }
  }, [currentUser, isLoading, navigate, userSynced]);

  const loadStudentData = () => {
    if (!currentUser) return;
    
    console.log('Loading student data for user:', currentUser.uid);
    
    const storedPoints = localStorage.getItem(`${currentUser.uid}_points`);
    const storedLevel = localStorage.getItem(`${currentUser.uid}_level`);
    
    const points = storedPoints ? parseInt(storedPoints) : 0;
    const level = storedLevel ? parseInt(storedLevel) : 1;
    
    console.log('Student data loaded - Points:', points, 'Level:', level);
    
    setStudentPoints(points);
    setStudentLevel(level);
    
    const pointsForNextLevel = level * 100;
    const pointsSinceLastLevel = points - ((level - 1) * 100);
    const progress = Math.min(Math.floor((pointsSinceLastLevel / pointsForNextLevel) * 100), 100);
    setLevelProgress(progress);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const handleBackToHome = () => {
    console.log('Navigating back to home');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please log in to view your profile</h2>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold">
                {language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile'}
              </h1>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20 transition-colors"
                onClick={handleBackToHome}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="text-sm">
                {language === 'hi' ? 'प्रोफाइल' : 'Profile'}
              </TabsTrigger>
              <TabsTrigger value="plans" className="text-sm">
                {language === 'hi' ? 'स्टडी प्लान' : 'Study Plans'}
              </TabsTrigger>
              <TabsTrigger value="nav" className="text-sm">
                {language === 'hi' ? 'नेविगेशन' : 'Navigation'}
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <TabsContent value="info" className="m-0">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Profile Header */}
                  <ProfileHeader currentUser={currentUser} />
                  
                  {/* Student Points Section */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center text-purple-700 dark:text-purple-300">
                        <Star className="h-4 w-4 text-yellow-500 mr-2" />
                        {language === 'hi' ? 'छात्र उपलब्धि' : 'Student Achievement'}
                      </h3>
                      <span className="font-bold text-purple-700 dark:text-purple-300 text-lg">
                        {studentPoints} {language === 'hi' ? 'अंक' : 'points'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-2 text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          {language === 'hi' ? `स्तर ${studentLevel}` : `Level ${studentLevel}`}
                        </span>
                        <span>
                          {language === 'hi' ? 'अगला: ' : 'Next: '}
                          {((studentLevel * 100) - studentPoints) > 0 ? ((studentLevel * 100) - studentPoints) : 0} 
                          {language === 'hi' ? ' अंक चाहिए' : ' points needed'}
                        </span>
                      </div>
                      <Progress value={levelProgress} className="h-3 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      asChild
                    >
                      <Link to="/student-activities">
                        <Activity className="h-4 w-4 mr-2" />
                        {language === 'hi' ? 'गतिविधियां देखें' : 'View Activities'}
                      </Link>
                    </Button>
                  </div>
                  
                  {/* User Info Cards */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      {language === 'hi' ? 'प्रोफाइल विवरण' : 'Profile Details'}
                    </h3>
                    <UserInfoCards 
                      userCategory={userCategory} 
                      educationLevel={educationLevel} 
                    />
                  </div>

                  {/* Danger Zone at bottom of profile */}
                  <div className="mt-8">
                    <DangerZone currentUser={currentUser} onLogout={handleLogout} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plans" className="m-0">
                <div className="p-4 sm:p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      {language === 'hi' ? 'आपके स्टडी प्लान' : 'Your Study Plans'}
                    </h3>
                    <ActivePlansWidget />
                  </div>
                </div>
              </TabsContent>

              
              <TabsContent value="nav" className="m-0">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Navigation Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                      {language === 'hi' ? 'त्वरित नेविगेशन' : 'Quick Navigation'}
                    </h3>
                    <ProfileNavigation isAuthenticated={!!currentUser} />
                  </div>
                  
                  {/* Backup Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                      {language === 'hi' ? 'डेटा प्रबंधन' : 'Data Management'}
                    </h3>
                    <BackupCard />
                  </div>
                  
                  {/* Native Ad */}
                  <div className="mt-4">
                    <p className="text-xs text-center text-muted-foreground mb-2">प्रायोजित</p>
                    <NativeAd />
                  </div>
                  
                  <Separator className="my-6" />
                  
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
