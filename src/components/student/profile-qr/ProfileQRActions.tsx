
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Share2, Link2 } from 'lucide-react';

interface ProfileQRActionsProps {
  profileUrl: string;
  copyProfileLink: () => void;
  downloadQRCode: () => void;
  shareProfile: () => Promise<void>;
}

const ProfileQRActions: React.FC<ProfileQRActionsProps> = ({
  profileUrl,
  copyProfileLink,
  downloadQRCode,
  shareProfile
}) => {
  return (
    <>
      <div className="w-full mt-4">
        <div className="flex items-center justify-between border rounded-md p-2 bg-gray-50">
          <div className="truncate flex-1 text-sm text-gray-600">
            {profileUrl}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2" 
            onClick={copyProfileLink}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-6 w-full">
        <Button 
          variant="outline" 
          onClick={downloadQRCode}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          डाउनलोड
        </Button>
        <Button 
          onClick={shareProfile}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          शेयर
        </Button>
      </div>
    </>
  );
};

export default ProfileQRActions;
