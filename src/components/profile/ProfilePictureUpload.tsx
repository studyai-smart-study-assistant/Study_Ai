import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Trash2, Upload, X } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { getUserInitials, getAvatarColor } from '@/components/leaderboard/utils/avatarUtils';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  userName: string;
  userId: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  userName,
  userId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया केवल image files upload करें');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size 5MB से कम होनी चाहिए');
      return;
    }

    try {
      setIsUploading(true);

      // Delete previous avatar if exists
      if (currentAvatarUrl) {
        try {
          const oldPath = currentAvatarUrl.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([`${currentUser.uid}/${oldPath}`]);
          }
        } catch (e) {
          console.warn('Previous avatar delete failed (non-blocking):', e);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: currentUser.uid,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      toast.success('Profile picture सफलतापूर्वक upload हो गई!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Profile picture upload में समस्या हुई');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteCurrentAvatar = async () => {
    if (!currentAvatarUrl || !currentUser) return;

    try {
      await supabase.functions.invoke('avatar-manager', {
        body: {
          action: 'delete',
          user_id: currentUser.uid,
          avatarUrl: currentAvatarUrl,
        },
      });
    } catch (error) {
      console.error('Error deleting previous avatar:', error);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentAvatarUrl || !currentUser) return;

    try {
      setIsDeleting(true);

      // Delete from storage
      const filePath = currentAvatarUrl.split('/').pop();
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`${currentUser.uid}/${filePath}`]);
        
        if (deleteError) {
          console.error('Storage delete error:', deleteError);
        }
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.uid);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      onAvatarUpdate(null);
      toast.success('Profile picture delete हो गई!');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Profile picture delete करने में समस्या हुई');
    } finally {
      setIsDeleting(false);
    }
  };

  const userInitials = getUserInitials(userName);
  const avatarColor = getAvatarColor(userId);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        {/* Main avatar */}
        <Avatar onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }} title="प्रोफाइल इमेज बड़ा देखें" className="relative w-36 h-36 sm:w-40 sm:h-40 cursor-zoom-in border-4 border-white dark:border-gray-800 shadow-lg">
          {currentAvatarUrl ? (
            <AvatarImage 
              src={currentAvatarUrl} 
              alt="Profile picture"
              className="object-cover object-[center_45%]"
            />
          ) : null}
          <AvatarFallback className={`${avatarColor} text-3xl sm:text-4xl font-black relative overflow-hidden transition-all duration-300 group-hover:scale-110 shadow-inner flex items-center justify-center`}>
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {/* Enhanced text */}
            <span className="relative z-10 font-black text-white drop-shadow-2xl select-none flex items-center justify-center w-full h-full" style={{ 
              textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.5), 1px 1px 3px rgba(0,0,0,1)',
              letterSpacing: '2px',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)'
            }}>
              {userInitials}
            </span>
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
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
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
      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            title="Upload or change your profile picture"
            aria-label="Upload or change profile picture"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : currentAvatarUrl ? "Change Picture" : "Upload Picture"}
          </Button>
  
          {currentAvatarUrl && (
            <Button
              onClick={handleDeleteAvatar}
              disabled={isUploading || isDeleting}
              variant="destructive"
              title="Delete your profile picture"
              aria-label="Delete profile picture"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">Hint: नीचे दिए गए बटनों से प्रोफाइल पिक्चर बदलें या डिलीट करें</p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;