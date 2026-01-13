
import { useState, useEffect } from 'react';
import { ProfileData, Achievement } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';

interface UseProfileDataReturn { profileData: ProfileData | null; achievements: Achievement[]; levelProgress: number; loading: boolean; }

export const useProfileData = (userId: string): UseProfileDataReturn => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levelProgress, setLevelProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { if (userId) loadProfileData(userId); }, [userId]);
  
  const loadProfileData = async (id: string) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', id).maybeSingle();
      const { data: pointsData } = await supabase.from('user_points').select('*').eq('user_id', id).maybeSingle();
      const { data: historyData } = await supabase.from('points_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10);
      
      if (profile) {
        let topAchievements: Achievement[] = [];
        if (historyData?.length) {
          topAchievements = historyData.filter(item => item.transaction_type === 'earn').map((item, index) => ({
            id: index + 1,
            description: item.reason,
            points: item.amount,
            type: 'achievement' as const,
            timestamp: item.created_at
          })).slice(0, 5);
        }
        
        const userPoints = pointsData?.balance || profile.points || 0;
        const userLevel = pointsData?.level || profile.level || 1;
        
        const profileInfo: ProfileData = { id, name: profile.display_name || `Student_${id.substring(0, 5)}`, level: userLevel, points: userPoints, category: profile.user_category || 'student', education: profile.education_level || 'high-school', joinedOn: profile.created_at || new Date().toISOString(), photoURL: profile.photo_url || profile.avatar_url };
        
        const progress = Math.min(Math.floor(((profileInfo.points - ((profileInfo.level - 1) * 100)) / (profileInfo.level * 100)) * 100), 100);
        setProfileData(profileInfo);
        setAchievements(topAchievements);
        setLevelProgress(progress);
      } else { fallbackToLocalStorage(id); }
    } catch { fallbackToLocalStorage(id); }
    finally { setLoading(false); }
  };
  
  const fallbackToLocalStorage = (id: string) => {
    try {
      const points = localStorage.getItem(`${id}_points`);
      const level = localStorage.getItem(`${id}_level`);
      const history = JSON.parse(localStorage.getItem(`${id}_points_history`) || '[]');
      const topAchievements = history.filter((item: any) => ['achievement', 'quiz'].includes(item.type)).sort((a: any, b: any) => b.points - a.points).slice(0, 5).map((item: any, index: number) => ({...item, id: index + 1}));
      if (points && level) {
        const profileInfo: ProfileData = { id, name: `Student_${id.substring(0, 5)}`, level: parseInt(level), points: parseInt(points), category: localStorage.getItem('userCategory') || 'student', education: localStorage.getItem('educationLevel') || 'high-school', joinedOn: new Date().toISOString() };
        const progress = Math.min(Math.floor(((profileInfo.points - ((profileInfo.level - 1) * 100)) / (profileInfo.level * 100)) * 100), 100);
        setProfileData(profileInfo);
        setAchievements(topAchievements);
        setLevelProgress(progress);
      }
    } catch {}
  };
  
  return { profileData, achievements, levelProgress, loading };
};
