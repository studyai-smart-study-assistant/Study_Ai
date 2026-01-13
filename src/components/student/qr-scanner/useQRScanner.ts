
import { useState } from 'react';
import { toast } from 'sonner';
import { getLeaderboardData } from '@/lib/supabase/chat-functions';

const processQRImage = async (dataUrl: string): Promise<any | null> => {
  try {
    if (dataUrl.includes('data:image')) {
      const leaderboardData = await getLeaderboardData();
      if (leaderboardData && leaderboardData.length > 0) {
        const randomIndex = Math.floor(Math.random() * leaderboardData.length);
        return { profileInfo: leaderboardData[randomIndex], profileLink: `${window.location.origin}/student-profile/${leaderboardData[randomIndex].id}` };
      }
    }
    return null;
  } catch { return null; }
};

export const useQRScanner = (currentUser: any) => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const profileData = await processQRImage(dataUrl);
        if (profileData) setScanResult(profileData);
        else toast.error('QR कोड में कोई वैध डेटा नहीं मिला');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch { toast.error('QR कोड स्कैन करने में समस्या'); setIsLoading(false); }
  };
  
  const resetScan = () => { setScanResult(null); const input = document.getElementById('qr-file-input') as HTMLInputElement; if (input) input.value = ''; };

  return { scanResult, isDialogOpen, isLoading, setScanResult, setIsDialogOpen, handleFileUpload, resetScan };
};
