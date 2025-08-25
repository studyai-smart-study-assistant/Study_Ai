import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Camera } from 'lucide-react';

interface ProfileManagerProps {
  onProfileUpdated?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onProfileUpdated }) => {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (currentUser?.uid) {
      loadProfile();
    }
  }, [currentUser?.uid]);

  const loadProfile = async () => {
    if (!currentUser?.uid) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.uid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileData(data);
        setAvatarPreview(data.avatar_url || '');
      } else {
        // Create profile if doesn't exist
        await createProfile();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const createProfile = async () => {
    if (!currentUser?.uid) return;

    try {
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: currentUser.uid,
          avatar_url: defaultAvatar
        })
        .select()
        .single();

      if (error) throw error;

      setProfileData(data);
      setAvatarPreview(data.avatar_url || '');
      toast.success('Profile created successfully');
      onProfileUpdated?.();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !currentUser?.uid) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.uid}/${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const updateProfile = async () => {
    if (!currentUser?.uid || !profileData) return;

    try {
      setIsLoading(true);

      let avatarUrl = profileData.avatar_url;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl
        })
        .eq('user_id', currentUser.uid);

      if (error) throw error;

      setProfileData({ ...profileData, avatar_url: avatarUrl });
      setAvatarFile(null);
      toast.success('Profile updated successfully');
      onProfileUpdated?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>{currentUser.displayName?.slice(0, 2) || currentUser.email?.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={currentUser.email || ''} disabled />
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input value={currentUser.displayName || ''} disabled />
          </div>

          <Button 
            onClick={updateProfile} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileManager;