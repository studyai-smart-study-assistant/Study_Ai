
import { useState, useEffect } from 'react';
import { ProfileData, Achievement } from '@/types/student';
import { getDatabase, ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';

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
      // Try to get profile data from Firebase
      const userRef = ref(database, `users/${id}`);
      const userSnapshot = await get(userRef);
      
      // Get points history
      const historyRef = ref(database, `users/${id}/pointsHistory`);
      const historySnapshot = await get(historyRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        
        // Sort achievements from points history
        let topAchievements: Achievement[] = [];
        
        if (historySnapshot.exists()) {
          const history = Object.values(historySnapshot.val()) as Achievement[];
          
          // Sort achievements by points (highest first)
          topAchievements = history
            .filter((item: any) => ['achievement', 'quiz'].includes(item.type))
            .sort((a: any, b: any) => b.points - a.points)
            .slice(0, 5); // Get top 5
        }
        
        // Create profile data object
        const profileInfo: ProfileData = {
          id,
          name: userData.displayName || `छात्र_${id.substring(0, 5)}`,
          level: userData.level || 1,
          points: userData.points || 0,
          category: userData.userCategory || 'student',
          education: userData.educationLevel || 'high-school',
          joinedOn: userData.createdAt || new Date().toISOString(),
          photoURL: userData.photoURL
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
      console.error('Error loading profile from Firebase:', error);
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
        .slice(0, 5); // Get top 5
      
      if (points && level) {
        const profileInfo: ProfileData = {
          id,
          name: `छात्र_${id.substring(0, 5)}`, // Default name if we can't get actual name
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
