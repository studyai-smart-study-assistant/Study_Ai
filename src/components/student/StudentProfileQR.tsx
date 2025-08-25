
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, User, Star, Clock, Award, Trophy } from 'lucide-react';
import ProfileQRHeader from './profile-qr/ProfileQRHeader';
import QRCodeDisplay from './profile-qr/QRCodeDisplay';
import ProfileQRActions from './profile-qr/ProfileQRActions';
import { useStudentProfileData } from '@/hooks/useStudentProfileData';
import { getLevelColor } from '@/utils/qrCodeUtils';

interface StudentProfileQRProps {
  currentUser: any;
  studentPoints: number;
  studentLevel: number;
}

const StudentProfileQR: React.FC<StudentProfileQRProps> = ({ 
  currentUser, 
  studentPoints, 
  studentLevel 
}) => {
  const {
    profileData,
    qrCodeUrl,
    profileUrl,
    downloadQRCode,
    shareProfile,
    copyProfileLink
  } = useStudentProfileData({
    currentUser,
    studentPoints,
    studentLevel
  });
  
  const getEducationLevel = (level: string | undefined) => {
    switch (level) {
      case 'high-school': return 'हाई स्कूल';
      case 'intermediate': return 'इंटरमीडिएट';
      case 'undergraduate': return 'अंडरग्रेजुएट';
      case 'graduate': return 'ग्रेजुएट';
      default: return level || 'अज्ञात';
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger id="qr-dialog" className="hidden">Open QR</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">अपना प्रोफाइल शेयर करें</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <ProfileQRHeader 
            currentUser={currentUser} 
            studentPoints={studentPoints} 
            studentLevel={studentLevel} 
          />
          
          <QRCodeDisplay qrCodeUrl={qrCodeUrl} />
          
          {profileData && (
            <div className="w-full mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <User className="h-4 w-4 text-purple-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">श्रेणी</div>
                    <div className="font-medium">{profileData.category === 'student' ? 'छात्र' : profileData.category}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <Award className="h-4 w-4 text-indigo-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">लेवल</div>
                    <div className="font-medium">
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: getLevelColor(profileData.level) + '20', color: getLevelColor(profileData.level) }}
                      >
                        {profileData.level}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">पॉइंट्स</div>
                    <div className="font-medium">{profileData.points}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">स्ट्रीक</div>
                    <div className="font-medium">{profileData.streak || 0} दिन</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <Trophy className="h-4 w-4 text-green-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">रैंक</div>
                    <div className="font-medium">#{profileData.rank || '?'}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md flex items-center">
                  <QrCode className="h-4 w-4 text-blue-500 mr-2" />
                  <div>
                    <div className="text-xs text-gray-500">शिक्षा</div>
                    <div className="font-medium">{getEducationLevel(profileData.education)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-center mt-4 text-gray-600">
            इस QR कोड को स्कैन करके अपने दोस्तों के साथ अपना अध्ययन प्रोफाइल शेयर करें
          </p>
          
          <ProfileQRActions 
            profileUrl={profileUrl}
            copyProfileLink={copyProfileLink}
            downloadQRCode={downloadQRCode}
            shareProfile={shareProfile}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileQR;
