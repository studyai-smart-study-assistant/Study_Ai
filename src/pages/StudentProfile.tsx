
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProfileData } from '@/hooks/useProfileData';
import ProfileHeader from '@/components/student/profile/ProfileHeader';
import ProfileBanner from '@/components/student/profile/ProfileBanner';
import AchievementsList from '@/components/student/profile/AchievementsList';
import ProfileDetails from '@/components/student/profile/ProfileDetails';
import ProfileNotFound from '@/components/student/profile/ProfileNotFound';

const StudentProfile = () => {
  const { userId } = useParams();
  const { profileData, achievements, levelProgress, loading } = useProfileData(userId || '');
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!profileData) {
    return <ProfileNotFound />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="max-w-md mx-auto">
        <ProfileHeader />
        <ProfileBanner profileData={profileData} levelProgress={levelProgress} />
        <AchievementsList achievements={achievements} />
        <ProfileDetails profileData={profileData} />
      </div>
    </div>
  );
};

export default StudentProfile;
