
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, User as UserIcon, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({ open, onOpenChange }) => {
  const { user, userDetails, updateUserDetails, uploadAvatar, deleteAvatar } = useUser();
  const { language } = useLanguage();

  const [displayName, setDisplayName] = useState(userDetails?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(userDetails?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userDetails) {
      setDisplayName(userDetails.full_name || '');
      setAvatarUrl(userDetails.avatar_url || null);
    }
  }, [userDetails, open]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const newAvatarUrl = await uploadAvatar(file);
      setAvatarUrl(newAvatarUrl);
      toast.success(language === 'hi' ? 'प्रोफ़ाइल फ़ोटो अपडेट हो गई है।' : 'Profile photo updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'hi' ? 'फ़ोटो अपलोड करने में विफल।' : 'Failed to upload photo.'));
    } finally {
      setIsUploading(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    setIsUploading(true); // Reuse uploading state for visual feedback
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      toast.success(language === 'hi' ? 'प्रोफ़ाइल फ़ोटो हटा दी गई है।' : 'Profile photo removed.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'hi' ? 'फ़ोटो हटाने में विफल।' : 'Failed to remove photo.'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSave = async () => {
      if (!user || !displayName.trim()) {
          toast.error(language === 'hi' ? 'नाम खाली नहीं हो सकता।' : 'Name cannot be empty.')
          return;
      }
      setIsSaving(true);
      try {
          await updateUserDetails({ full_name: displayName.trim() });
          toast.success(language === 'hi' ? 'प्रोफ़ाइल अपडेट हो गया।' : 'Profile updated successfully.');
          onOpenChange(false);
      } catch (error) {
          toast.error(error instanceof Error ? error.message : (language === 'hi' ? 'प्रोफ़ाइल अपडेट करने में विफल।' : 'Failed to update profile.'));
      } finally {
          setIsSaving(false);
      }
  }

  const t = {
    title: language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile',
    nameLabel: language === 'hi' ? 'पूरा नाम' : 'Full Name',
    save: language === 'hi' ? 'सहेजें' : 'Save Changes',
    cancel: language === 'hi' ? 'रद्द करें' : 'Cancel',
    uploading: language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...',
    saving: language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...',
    removePhoto: language === 'hi' ? 'फोटो हटाएं' : 'Remove Photo',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto py-6">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-card">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-muted">
                            <UserIcon className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleAvatarClick}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </div>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg"
                        className="hidden"
                        disabled={isUploading}
                    />
                </div>
                
                {avatarUrl && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={isUploading} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.removePhoto}
                    </Button>
                )}

                <div className="w-full px-4">
                    <label htmlFor="displayName" className="text-sm font-medium text-muted-foreground">{t.nameLabel}</label>
                    <Input 
                        id="displayName" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 text-base"
                        disabled={isSaving}
                    />
                </div>
            </div>
        </div>

        <SheetFooter className="grid grid-cols-2 gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isUploading}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? t.saving : t.save}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
