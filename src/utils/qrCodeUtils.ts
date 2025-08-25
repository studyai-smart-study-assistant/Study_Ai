
import QRCode from 'qrcode';

/**
 * Generate a QR code from profile data
 */
export const generateProfileQRCode = async (
  profileData: any, 
  profileLink: string
): Promise<string> => {
  try {
    // Create a combined data object with profile data and link
    const qrData = {
      profileLink: profileLink,
      profileInfo: profileData
    };
    
    // Convert the data object to a JSON string
    const qrDataString = JSON.stringify(qrData);
    
    // Generate QR code using the qrcode library
    const qrDataUrl = await QRCode.toDataURL(qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#5a287d', // Purple color for dots
        light: '#FFFFFF', // White background
      },
      errorCorrectionLevel: 'H' // Higher error correction for more reliability when scanning
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('QR कोड जनरेट करने में समस्या आई');
  }
};

/**
 * Parse QR code data string to extract student profile information
 */
export const parseQRCodeData = (qrDataString: string): { 
  profileLink: string; 
  profileInfo: any;
} | null => {
  try {
    return JSON.parse(qrDataString);
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

/**
 * Generate a dynamic color based on student level
 */
export const getLevelColor = (level: number): string => {
  const colors = [
    '#8b5cf6', // Level 1 (Purple)
    '#3b82f6', // Level 2 (Blue)
    '#10b981', // Level 3 (Green)
    '#f59e0b', // Level 4 (Amber)
    '#ef4444', // Level 5 (Red)
    '#6366f1', // Level 6 (Indigo)
    '#ec4899', // Level 7 (Pink)
    '#0ea5e9', // Level 8 (Sky)
    '#14b8a6', // Level 9 (Teal)
    '#f43f5e', // Level 10+ (Rose)
  ];
  
  // For levels above 10, cycle through colors
  return colors[Math.min((level - 1) % colors.length, colors.length - 1)];
};
