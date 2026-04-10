
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { LogOut, Activity, Star, Target, Volume2, Brain } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Progress } from '@/components/ui/progress';
import ProfileHeader from '@/components/profile/ProfileHeader';
import UserInfoCards from '@/components/profile/UserInfoCards';
import ProfileNavigation from '@/components/profile/ProfileNavigation';
import BackupCard from '@/components/backup/BackupCard';
import ActivePlansWidget from '@/components/study/ActivePlansWidget';
import DangerZone from '@/components/profile/DangerZone';
import VoiceSettings from '@/components/profile/VoiceSettings';
import MindVault from '@/components/profile/MindVault';
import ChangePassword from '@/components/profile/ChangePassword';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logoutUser } from '@/lib/supabase/chat-functions';
import { syncUserPoints } from '@/utils/points/core';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import MonetagInterstitial from '@/components/ads/MonetagInterstitial';

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
  const { language } = useLanguage();

  useEffect(() => {
    if (!isLoading && !currentUser) { navigate('/login'); return; }

    const refreshProfileData = async () => {
      if (!currentUser) return;
      await syncUserPoints(currentUser.uid);
      loadStudentData();
    };

    if (currentUser && !userSynced) {
      refreshProfileData().finally(() => setUserSynced(true));
      setUserCategory(localStorage.getItem('userCategory') || '');
      setEducationLevel(localStorage.getItem('educationLevel') || '');
    } else if (currentUser && userSynced) {
      loadStudentData();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        refreshProfileData();
      }
    };

    const handleFocus = () => {
      if (currentUser) refreshProfileData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, isLoading, navigate, userSynced]);

  const loadStudentData = () => {
    if (!currentUser) return;
    const points = parseInt(localStorage.getItem(`${currentUser.uid}_points`) || '0');
    const level = parseInt(localStorage.getItem(`${currentUser.uid}_level`) || '1');
    setStudentPoints(points);
    setStudentLevel(level);
    const progress = Math.min(Math.floor(((points - ((level - 1) * 100)) / (level * 100)) * 100), 100);
    setLevelProgress(progress);
  };

  const handleLogout = async () => {
    try { await logoutUser(); toast.success('Successfully logged out'); navigate('/login'); } catch { toast.error('Failed to log out'); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>;
  if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-xl font-semibold mb-4">Please log in</h2><Button asChild><Link to="/login">Login</Link></Button></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950">
      <MonetagInterstitial page="profile" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between"><h1 className="text-xl sm:text-2xl font-bold">{language === 'hi' ? 'मेरी प्रोफाइल' : 'My Profile'}</h1><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/')}><LogOut className="h-5 w-5" /></Button></div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-1 px-1">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-5 sm:w-full gap-1 p-1">
                <TabsTrigger value="info" className="text-xs sm:text-sm px-2.5 sm:px-3 whitespace-nowrap">{language === 'hi' ? 'प्रोफाइल' : 'Profile'}</TabsTrigger>
                <TabsTrigger value="mindvault" className="flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3 whitespace-nowrap"><Brain className="h-3 w-3 shrink-0" /><span>Mind Vault</span></TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-1 text-xs sm:text-sm px-2.5 sm:px-3 whitespace-nowrap"><Volume2 className="h-3 w-3 shrink-0" /><span>{language === 'hi' ? 'आवाज़' : 'Voice'}</span></TabsTrigger>
                <TabsTrigger value="plans" className="text-xs sm:text-sm px-2.5 sm:px-3 whitespace-nowrap">{language === 'hi' ? 'प्लान' : 'Plans'}</TabsTrigger>
                <TabsTrigger value="nav" className="text-xs sm:text-sm px-2.5 sm:px-3 whitespace-nowrap">{language === 'hi' ? 'नेवि.' : 'Nav'}</TabsTrigger>
              </TabsList>
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <TabsContent value="info" className="m-0 p-4 sm:p-6 space-y-6">
                <ProfileHeader currentUser={currentUser} />
                <AdsterraBanner page="profile" />
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold flex items-center text-purple-700"><Star className="h-4 w-4 text-yellow-500 mr-2" />{language === 'hi' ? 'छात्र उपलब्धि' : 'Achievement'}</h3><span className="font-bold text-purple-700 text-lg">{studentPoints} {language === 'hi' ? 'अंक' : 'points'}</span></div>
                  <div className="mb-3"><div className="flex items-center justify-between text-xs mb-2 text-gray-600"><span className="font-medium">{language === 'hi' ? `स्तर ${studentLevel}` : `Level ${studentLevel}`}</span></div><Progress value={levelProgress} className="h-3 bg-gray-200" /></div>
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild><Link to="/student-activities"><Activity className="h-4 w-4 mr-2" />{language === 'hi' ? 'गतिविधियां देखें' : 'View Activities'}</Link></Button>
                </div>
                <UserInfoCards userCategory={userCategory} educationLevel={educationLevel} />
                <AdsterraBanner page="profile" />
                <div className="mt-6"><ChangePassword /></div>
                <div className="mt-8"><DangerZone currentUser={currentUser} onLogout={handleLogout} /></div>
              </TabsContent>
              <TabsContent value="voice" className="m-0 p-4 sm:p-6"><VoiceSettings /></TabsContent>
              <TabsContent value="mindvault" className="m-0 p-4 sm:p-6"><MindVault /></TabsContent>
              <TabsContent value="plans" className="m-0 p-4 sm:p-6"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-purple-600" />{language === 'hi' ? 'आपके स्टडी प्लान' : 'Your Study Plans'}</h3><ActivePlansWidget /></TabsContent>
              <TabsContent value="nav" className="m-0 p-4 sm:p-6 space-y-6"><ProfileNavigation isAuthenticated={!!currentUser} /><BackupCard /><Separator className="my-6" /></TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
