
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { User, Star, Award } from 'lucide-react';

interface ProfileQRHeaderProps {
  currentUser: any;
  studentPoints: number;
  studentLevel: number;
}

const ProfileQRHeader: React.FC<ProfileQRHeaderProps> = ({
  currentUser,
  studentPoints,
  studentLevel
}) => {
  return (
    <div className="mb-4">
      <div className="flex flex-col items-center gap-2">
        {currentUser?.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName} 
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-700">
            {(currentUser?.displayName || 'S').charAt(0)}
          </div>
        )}
        <div className="text-center">
          <h3 className="font-bold">{currentUser?.displayName || 'Student'}</h3>
          <div className="flex items-center gap-2 justify-center mt-1">
            <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
              <Star className="h-3 w-3" /> {studentPoints} पॉइंट्स
            </Badge>
            <Badge className="bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Award className="h-3 w-3" /> Level {studentLevel}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileQRHeader;
