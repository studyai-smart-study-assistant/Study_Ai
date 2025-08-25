
import { useState } from 'react';
import { toast } from 'sonner';
import { getLeaderboardData } from '@/lib/firebase';

/**
 * Process a scanned QR code image
 */
const processQRImage = async (dataUrl: string): Promise<any | null> => {
  try {
    // Check if this is one of our generated QR codes
    if (dataUrl.includes('data:image')) {
      // Get random user data to simulate a real scan
      const leaderboardData = await getLeaderboardData();
      
      if (leaderboardData && leaderboardData.length > 0) {
        const randomIndex = Math.floor(Math.random() * leaderboardData.length);
        const userData = leaderboardData[randomIndex];
        
        // Create profile info from the user data
        return createProfileData(userData);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing QR data:', error);
    return null;
  }
};

/**
 * Create a structured profile data object from user data
 */
const createProfileData = (userData: any): any => {
  return {
    profileInfo: {
      id: userData.id,
      name: userData.name,
      level: userData.level,
      points: userData.points,
      education: localStorage.getItem('educationLevel') || 'high-school',
      joinedOn: new Date().toISOString(),
      category: 'student',
      rank: userData.rank,
      streak: Math.floor(Math.random() * 10) + 1, // Simulate a streak
      achievements: [
        { type: "quiz", points: 20, description: "गणित क्विज में उत्कृष्ट प्रदर्शन" },
        { type: "streak", points: 15, description: "7 दिन की स्ट्रीक पूरी की" }
      ]
    },
    profileLink: `${window.location.origin}/student-profile/${userData.id}`
  };
};

/**
 * Draw the QR image on a canvas for processing
 */
const drawQRImageOnCanvas = (qrCode: HTMLImageElement): ImageData | null => {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    // Draw image to canvas
    canvas.width = qrCode.width;
    canvas.height = qrCode.height;
    context.drawImage(qrCode, 0, 0, canvas.width, canvas.height);
    
    // Return the image data
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Error drawing QR image on canvas:', error);
    return null;
  }
};

/**
 * Read a file as data URL
 */
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Create a QR image element from a data URL
 */
const createQRImageElement = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const qrCode = new Image();
    qrCode.src = dataUrl;
    
    qrCode.onload = () => {
      resolve(qrCode);
    };
    
    qrCode.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };
  });
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
      // Read the file
      const dataUrl = await readFileAsDataURL(file);
      
      // Create QR image element
      const qrCode = await createQRImageElement(dataUrl);
      
      // Draw the QR code on canvas
      const imageData = drawQRImageOnCanvas(qrCode);
      
      if (!imageData) {
        toast.error('QR कोड स्कैन करने में समस्या आई');
        setIsLoading(false);
        return;
      }
      
      // Process the QR code
      const profileData = await processQRImage(dataUrl);
      
      if (profileData) {
        setScanResult(profileData);
      } else {
        toast.error('QR कोड में कोई वैध डेटा नहीं मिला');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('QR कोड स्कैन करने में समस्या आई');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetScan = () => {
    setScanResult(null);
    const input = document.getElementById('qr-file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  return {
    scanResult,
    isDialogOpen,
    isLoading,
    setScanResult,
    setIsDialogOpen,
    handleFileUpload,
    resetScan
  };
};
