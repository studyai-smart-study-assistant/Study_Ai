
import { useState, useEffect } from 'react';
import { ProfileData, Achievement } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';

interface UseProfileDataReturn {
  profileData: ProfileData | null;
  achievements: Achievement[];
  levelProgress: number;
  loading: boolean;
}

export const useProfileData = (userId: string): UseProfileDataReturn => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levelProgress, setLevelProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userId) {
      loadProfileData(userId);
    }
  }, [userId]);
  
  const loadProfileData = async (id: string) => {
    setLoading(true);
    
    try {
      // Get profile data from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Get user points from Supabase
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      
      // Get points history for achievements
      const { data: historyData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (profile) {
        // Sort achievements from points history
        let topAchievements: Achievement[] = [];
        
        if (historyData && historyData.length > 0) {
          topAchievements = historyData
            .filter((item) => item.transaction_type === 'earn')
            .map((item) => ({
              id: item.id,
              title: item.reason,
              description: item.reason,
              points: item.amount,
              type: 'achievement' as const,
              timestamp: new Date(item.created_at).getTime()
            }))
            .slice(0, 5);
        }
        
        const userPoints = pointsData?.balance || profile.points || 0;
        const userLevel = pointsData?.level || profile.level || 1;
        
        // Create profile data object
        const profileInfo: ProfileData = {
          id,
          name: profile.display_name || `Student_${id.substring(0, 5)}`,
          level: userLevel,
          points: userPoints,
          category: profile.user_category || 'student',
          education: profile.education_level || 'high-school',
          joinedOn: profile.created_at || new Date().toISOString(),
          photoURL: profile.photo_url || profile.avatar_url
        };
        
        // Calculate level progress
        const pointsForNextLevel = profileInfo.level * 100;
        const pointsSinceLastLevel = profileInfo.points - ((profileInfo.level - 1) * 100);
        const progress = Math.min(Math.floor((pointsSinceLastLevel / pointsForNextLevel) * 100), 100);
        
        setProfileData(profileInfo);
        setAchievements(topAchievements);
        setLevelProgress(progress);
      } else {
        // Fallback to localStorage for backward compatibility
        fallbackToLocalStorage(id);
      }
    } catch (error) {
      console.error('Error loading profile from Supabase:', error);
      // Fallback to localStorage
      fallbackToLocalStorage(id);
    } finally {
      setLoading(false);
    }
  };
  
  const fallbackToLocalStorage = (id: string) => {
    try {
      const points = localStorage.getItem(`${id}_points`);
      const level = localStorage.getItem(`${id}_level`);
      const userCategory = localStorage.getItem('userCategory');
      const educationLevel = localStorage.getItem('educationLevel');
      const history = JSON.parse(localStorage.getItem(`${id}_points_history`) || '[]');
      
      // Sort achievements by points (highest first)
      const topAchievements = history
        .filter((item: any) => ['achievement', 'quiz'].includes(item.type))
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 5);
      
      if (points && level) {
        const profileInfo: ProfileData = {
          id,
          name: `Student_${id.substring(0, 5)}`,
          level: parseInt(level),
          points: parseInt(points),
          category: userCategory || 'student',
          education: educationLevel || 'high-school',
          joinedOn: new Date().toISOString()
        };
        
        // Calculate level progress
        const pointsForNextLevel = profileInfo.level * 100;
        const pointsSinceLastLevel = profileInfo.points - ((profileInfo.level - 1) * 100);
        const progress = Math.min(Math.floor((pointsSinceLastLevel / pointsForNextLevel) * 100), 100);
        
        setProfileData(profileInfo);
        setAchievements(topAchievements);
        setLevelProgress(progress);
      }
    } catch (error) {
      console.error('Error fallback to localStorage:', error);
    }
  };
  
  return {
    profileData,
    achievements,
    levelProgress,
    loading
  };
};
