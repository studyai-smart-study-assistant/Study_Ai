
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserPointsHistory, getLeaderboardData } from '@/lib/supabase/chat-functions';
import { generateProfileQRCode } from '@/utils/qrCodeUtils';

interface ProfileData { id: string; name: string; level: number; points: number; category: string; education: string; joinedOn: string; streak?: number; rank?: number; photoURL?: string; achievements: any[]; }

export const useStudentProfileData = ({ currentUser, studentPoints, studentLevel }: { currentUser: any; studentPoints: number; studentLevel: number; }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);
  
  useEffect(() => { if (currentUser) loadProfileData(); }, [currentUser, studentPoints, studentLevel]);
  
  const loadProfileData = async () => {
    if (!currentUser) return;
    try {
      const streak = parseInt(localStorage.getItem(`${currentUser.uid}_streak`) || '0');
      try { const data = await getLeaderboardData(); const user = data.find((u: any) => u.id === currentUser.uid); if (user) setUserRank(user.rank); } catch {}
      
      const history = await getUserPointsHistory(currentUser.uid);
      const achievements = history.filter((item: any) => ['achievement', 'quiz', 'streak'].includes(item.type)).slice(0, 3);
      
      const profileInfo = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Student',
        level: studentLevel,
        points: studentPoints,
        category: localStorage.getItem('userCategory') || 'student',
        education: localStorage.getItem('educationLevel') || 'high-school',
        joinedOn: currentUser.metadata?.creationTime || new Date().toISOString(),
        photoURL: currentUser.photoURL,
        streak,
        rank: userRank,
        achievements
      };
      
      setProfileData(profileInfo);
      setProfileUrl(`${window.location.origin}/student-profile/${currentUser.uid}`);
      try { const qrCode = await generateProfileQRCode(profileInfo, `${window.location.origin}/student-profile/${currentUser.uid}`); setQrCodeUrl(qrCode); } catch { toast.error('QR कोड जनरेट करने में समस्या'); }
    } catch { toast.error('प्रोफाइल डेटा जनरेट करने में समस्या'); }
  };
  
  const downloadQRCode = () => { if (!qrCodeUrl) return; const a = document.createElement('a'); a.href = qrCodeUrl; a.download = `${currentUser?.displayName || 'student'}-qr.png`; a.click(); toast.success('QR कोड डाउनलोड किया गया'); };
  const shareProfile = async () => { if (navigator.share) { try { await navigator.share({ title: `${currentUser?.displayName || 'Student'} का प्रोफाइल`, url: profileUrl }); toast.success('प्रोफाइल शेयर किया गया'); } catch {} } else { navigator.clipboard.writeText(profileUrl); toast.success('लिंक कॉपी किया गया'); } };
  const copyProfileLink = () => { navigator.clipboard.writeText(profileUrl); toast.success('लिंक कॉपी किया गया'); };
  
  return { profileData, qrCodeUrl, profileUrl, downloadQRCode, shareProfile, copyProfileLink };
};
