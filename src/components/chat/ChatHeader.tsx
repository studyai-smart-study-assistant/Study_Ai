import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Info, ArrowLeft, Users, UserPlus, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  displayName: string;
  isGroup: boolean;
  onBack: () => void;
  onManageMembers: () => void;
  isAdmin: boolean;
  memberAvatars: React.ReactNode;
  children?: ReactNode;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  displayName,
  isGroup,
  onBack,
  onManageMembers,
  isAdmin,
  memberAvatars,
  children
}) => {

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:bg-gray-800 shadow-sm">
      {/* Left Section - Back button and Profile */}
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          {memberAvatars}
          <div>
            <div className="flex items-center gap-2">
              {isGroup && <Users className="h-4 w-4 text-purple-600" />}
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{displayName}</h2>
            </div>
            <p className="text-sm text-gray-500">Last seen recently</p>
          </div>
        </div>
      </div>

      {/* Right Section - Menu */}
      <div className="flex items-center gap-2">

        {/* Group Management Button */}
        {isGroup && isAdmin && (
          <Button
            variant="outline"
            size="icon"
            onClick={onManageMembers}
            className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100"
            title="Members Manage करें"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}

        {/* Three dots menu - more visible */}
        <Button 
          variant="outline" 
          size="icon" 
          className="text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
          title="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        
        {children}
      </div>
    </div>
  );
};

export default ChatHeader;