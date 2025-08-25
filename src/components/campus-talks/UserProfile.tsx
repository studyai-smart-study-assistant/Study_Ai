import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Phone, Video, MapPin, Briefcase, Globe, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserProfileProps {
  userId: string | null;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onClose }) => {
  // Mock user data - in real implementation, fetch from API
  const userData = {
    user_id: userId,
    display_name: 'Vinod Mandal',
    avatar_url: '/api/placeholder/150/150',
    status: 'online',
    bio: 'Hey there I am using EduChat',
    location: 'Bhalpatti',
    occupation: 'Farmer',
    website: 'https://study-ai-29.lovable.app',
    birth_date: '1989-01-01',
    interests: ['work on website/Application creating'],
    key: '22C100',
    last_seen: new Date().toISOString()
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (!userId) return null;

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 border-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative"
        >
          {/* Header with gradient background */}
          <div className="relative h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-t-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Profile Avatar */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800">
                  <AvatarImage src={userData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl">
                    {getInitials(userData.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white dark:border-gray-800 ${getStatusColor(userData.status)}`} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 px-6 pb-6 space-y-4">
            {/* User Info */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userData.display_name}
              </h2>
              <p className="text-purple-600 dark:text-purple-400 font-medium">
                Key: {userData.key}
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                🟢 {userData.status} • 5 दिन पहले
              </Badge>
            </div>

            {/* Bio */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">बायो</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {userData.bio}
              </p>
            </div>

            {/* Contact Info */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">संपर्क जानकारी</h3>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{userData.location}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{userData.occupation}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-purple-600 dark:text-purple-400 truncate">
                  {userData.website}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(userData.birth_date)}
                </span>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">रुचियां</h3>
              <div className="flex flex-wrap gap-2">
                {userData.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 border-gray-300 dark:border-gray-600"
              >
                रद्द करें
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                onClick={() => {
                  // Handle message action
                  onClose();
                }}
              >
                💾 सेव करें
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;