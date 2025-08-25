import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { User, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfilePopoverProps {
  userId: string;
  children: React.ReactNode;
  onStartChat?: (userId: string) => void;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ProfilePopover: React.FC<ProfilePopoverProps> = ({ 
  userId, 
  children, 
  onStartChat 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const displayName = profile?.display_name || `User_${userId.slice(0, 8)}`;
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-purple-200 dark:border-purple-700 shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-purple-200 dark:ring-purple-600">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white text-lg font-semibold">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User ID: {userId.slice(0, 12)}...
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>Active Study AI user</span>
              </div>
            </div>

            {/* Actions */}
            {onStartChat && (
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  onClick={() => onStartChat(userId)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ProfilePopover;