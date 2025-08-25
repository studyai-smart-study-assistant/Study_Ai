
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { getUserInitials, getAvatarColor } from './utils/avatarUtils';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { X } from "lucide-react";

interface UserAvatarProps {
  userId: string;
  userName: string;
  isCurrentUser: boolean;
  avatarUrl?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, userName, isCurrentUser, avatarUrl }) => {
  const [open, setOpen] = useState(false);
  const userInitials = getUserInitials(userName);
  const avatarColor = getAvatarColor(userId);
  const { avatarUrl: fetchedAvatarUrl } = useAvatarUrl(userId);
  const effectiveAvatarUrl = avatarUrl ?? fetchedAvatarUrl ?? null;

  return (
    <>
      <Avatar
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="प्रोफाइल इमेज बड़ा देखें"
        className={`h-12 w-12 md:h-14 md:w-14 cursor-zoom-in ${isCurrentUser ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}`}
      >
        {effectiveAvatarUrl && (
          <AvatarImage 
            src={effectiveAvatarUrl} 
            alt={`${userName} profile picture`}
            className="object-cover object-[center_45%]"
            loading="lazy"
          />
        )}
        <AvatarFallback className={`${avatarColor} font-medium text-sm`}>
          {userInitials}
        </AvatarFallback>
      </Avatar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{userName}</DialogTitle>
          </DialogHeader>
          <DialogClose aria-label="Close" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
          {effectiveAvatarUrl ? (
            <img
              src={effectiveAvatarUrl}
              alt={`${userName} profile picture large`}
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center">
              <Avatar className="w-40 h-40">
                <AvatarFallback className={`${avatarColor} text-4xl font-bold`}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserAvatar;
