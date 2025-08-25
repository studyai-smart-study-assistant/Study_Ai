
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials, getAvatarColor } from '@/components/leaderboard/utils/avatarUtils';
import { supabase } from "@/integrations/supabase/client";
import ProfilePictureUpload from './ProfilePictureUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, X } from "lucide-react";

interface ProfileHeaderProps {
  currentUser: any;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ currentUser }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const userName = currentUser?.displayName || 'User';
  const userInitials = getUserInitials(userName);
  const avatarColor = getAvatarColor(currentUser?.uid || '');

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser?.uid) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', currentUser.uid)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    setShowUploadDialog(false);
  };

  return (
    <div className="flex flex-col items-center mt-8 mb-8">
      {showUploadDialog ? (
        <ProfilePictureUpload
          currentAvatarUrl={avatarUrl}
          onAvatarUpdate={handleAvatarUpdate}
          userName={userName}
          userId={currentUser?.uid || ''}
        />
      ) : (<>
        <div 
          className="relative cursor-pointer"
          onClick={() => setPreviewOpen(true)}
        >
          <Avatar className="relative w-32 h-32 sm:w-36 sm:h-36 border-4 border-white dark:border-gray-800 shadow-lg">
            {avatarUrl && (
              <AvatarImage 
                src={avatarUrl} 
                alt="Profile picture"
                className="object-cover object-[center_45%]"
              />
            )}
            <AvatarFallback className={`${avatarColor} text-3xl sm:text-4xl font-black flex items-center justify-center`}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
          
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{userName}</DialogTitle>
            </DialogHeader>
            <DialogClose aria-label="Close" className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${userName} profile picture large`}
                className="w-full h-auto rounded-xl"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center">
                <Avatar className="w-40 h-40">
                  <AvatarFallback className={`${avatarColor} text-4xl font-black`}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </DialogContent>
        </Dialog>
       </>)}
      
      <div className="text-center mt-6 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words max-w-full px-2 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in drop-shadow-sm">
          {userName}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words max-w-full px-2 font-medium">
          {currentUser?.email}
        </p>
        
        {showUploadDialog ? (
          <button
            onClick={() => setShowUploadDialog(false)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back to Profile
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUploadDialog(true)}
              aria-label="Change profile picture"
            >
              <Upload className="h-4 w-4 mr-1" /> Change
            </Button>
            {avatarUrl && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowUploadDialog(true)}
                aria-label="Delete profile picture"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        )}
        
        {/* Enhanced status indicator */}
        <div className="flex items-center justify-center space-x-2 mt-4 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-700">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          <span className="text-sm text-green-700 dark:text-green-400 font-semibold">Active</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
