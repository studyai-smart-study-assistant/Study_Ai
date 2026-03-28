
"use client";

import React, { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Edit3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AchievementCard } from './AchievementCard';
import { CategoryCard } from './CategoryCard';
import { EditProfileSheet } from './EditProfileSheet'; // Import the new component

const Profile: React.FC = () => {
  const { user, userDetails } = useUser();
  const { language } = useLanguage();
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const t = {
    active: language === 'hi' ? 'सक्रिय' : 'Active',
    editProfile: language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile',
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-6">
      
      {/* Avatar and User Info */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Avatar className="h-28 w-28 border-4 shadow-md border-background">
          <AvatarImage src={userDetails?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted">
            <UserIcon className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{userDetails?.full_name || 'New User'}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="flex items-center gap-4 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/60 text-emerald-700 text-sm font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                {t.active}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditSheetOpen(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              {t.editProfile}
            </Button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="w-full max-w-sm mt-8 space-y-4">
        <AchievementCard />
        <CategoryCard />
      </div>
      
      {/* Edit Profile Sheet */}
      <EditProfileSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} />

    </div>
  );
};

export default Profile;
