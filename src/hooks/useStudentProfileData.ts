
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserPointsHistory, getLeaderboardData } from '@/lib/firebase';
import { generateProfileQRCode } from '@/utils/qrCodeUtils';

interface ProfileData {
  id: string;
  name: string;
  level: number;
  points: number;
  category: string;
  education: string;
  joinedOn: string;
  streak?: number;
  rank?: number;
  photoURL?: string;
  achievements: any[];
}

interface UseStudentProfileDataProps {
  currentUser: any;
  studentPoints: number;
  studentLevel: number;
}

interface UseStudentProfileDataReturn {
  profileData: ProfileData | null;
  qrCodeUrl: string;
  profileUrl: string;
  downloadQRCode: () => void;
  shareProfile: () => Promise<void>;
  copyProfileLink: () => void;
}

export const useStudentProfileData = ({
  currentUser,
  studentPoints,
  studentLevel
}: UseStudentProfileDataProps): UseStudentProfileDataReturn => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);
  const [userStreak, setUserStreak] = useState<number>(0);
  
  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser, studentPoints, studentLevel]);
  
  const loadProfileData = async () => {
    if (!currentUser) return;
    
    try {
      // Get user streak from localStorage
      const streak = localStorage.getItem(`${currentUser.uid}_streak`) || '0';
      setUserStreak(parseInt(streak));
      
      // Get user rank from leaderboard
      try {
        const leaderboardData = await getLeaderboardData();
        const userOnLeaderboard = leaderboardData.find((user: any) => user.id === currentUser.uid);
        if (userOnLeaderboard) {
          setUserRank(userOnLeaderboard.rank);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
      
      // Create profile data object with complete student information
      const achievements = await getTopAchievements();
      
      // Get education level and category
      const category = localStorage.getItem(`userCategory`) || 'student';
      const education = localStorage.getItem(`educationLevel`) || 'high-school';
      
      // Create profile data object
      const profileInfo = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Student',
        level: studentLevel,
        points: studentPoints,
        category: category,
        education: education,
        joinedOn: currentUser.metadata?.creationTime || new Date().toISOString(),
        photoURL: currentUser.photoURL,
        streak: parseInt(streak),
        rank: userRank,
        achievements: achievements
      };
      
      setProfileData(profileInfo);
      
      // Generate profile URL
      const baseUrl = window.location.origin;
      const profileLink = `${baseUrl}/student-profile/${currentUser.uid}`;
      setProfileUrl(profileLink);
      
      // Generate QR code with embedded profile data
      try {
        const qrCode = await generateProfileQRCode(profileInfo, profileLink);
        setQrCodeUrl(qrCode);
      } catch (error) {
        toast.error('QR कोड जनरेट करने में समस्या आई');
      }
    } catch (error) {
      console.error('Error generating profile data:', error);
      toast.error('प्रोफाइल डेटा जनरेट करने में समस्या आई');
    }
  };
  
  const getTopAchievements = async () => {
    if (!currentUser) return [];
    
    try {
      // Try to get history from Firebase
      const firebaseHistory = await getUserPointsHistory(currentUser.uid);
      
      if (firebaseHistory && firebaseHistory.length > 0) {
        // Filter achievements and sort by points
        return firebaseHistory
          .filter((item: any) => ['achievement', 'quiz', 'streak'].includes(item.type))
          .sort((a: any, b: any) => b.points - a.points)
          .slice(0, 3); // Get top 3
      }
      
      // Fallback to localStorage
      const history = JSON.parse(localStorage.getItem(`${currentUser.uid}_points_history`) || '[]');
      
      // Filter achievements and sort by points
      return history
        .filter((item: any) => ['achievement', 'quiz', 'streak'].includes(item.type))
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 3); // Get top 3
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  };
  
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `${currentUser?.displayName || 'student'}-profile-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('QR कोड डाउनलोड किया गया');
  };
  
  const shareProfile = async () => {
    if (!navigator.share) {
      navigator.clipboard.writeText(profileUrl);
      toast.success('प्रोफाइल लिंक कॉपी किया गया');
      return;
    }
    
    try {
      await navigator.share({
        title: `${currentUser?.displayName || 'Student'} का अध्ययन प्रोफाइल`,
        text: `देखें ${currentUser?.displayName || 'Student'} का अध्ययन प्रोफाइल! वर्तमान स्तर: ${studentLevel}, अर्जित अंक: ${studentPoints}`,
        url: profileUrl,
      });
      toast.success('प्रोफाइल सफलतापूर्वक शेयर किया गया');
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('प्रोफाइल शेयर करने में त्रुटि');
    }
  };
  
  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success('प्रोफाइल लिंक कॉपी किया गया');
  };
  
  return {
    profileData,
    qrCodeUrl,
    profileUrl,
    downloadQRCode,
    shareProfile,
    copyProfileLink
  };
};
