
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  History,
  Bookmark,
  GraduationCap,
  MessageSquare,
  ThumbsUp,
  Activity,
  Book
} from 'lucide-react';

interface ProfileNavigationProps {
  isAuthenticated: boolean;
}

const ProfileNavigation: React.FC<ProfileNavigationProps> = ({ isAuthenticated }) => {
  const navigationItems = [
    {
      title: 'Chat History',
      url: '/chat-history',
      icon: History,
      description: 'View your previous conversations'
    },
    {
      title: 'Saved Messages',
      url: '/saved-messages',
      icon: Bookmark,
      description: 'Access your bookmarked messages'
    },
    {
      title: 'पुस्तकालय',
      url: '/library',
      icon: Book,
      description: 'Browse your digital library'
    },
    {
      title: 'Teacher Chats',
      url: '/teacher-chats',
      icon: GraduationCap,
      description: 'Connect with educators'
    },
    {
      title: 'Student Activities',
      url: '/student-activities',
      icon: Activity,
      description: 'Track your learning progress'
    },
    {
      title: 'Send Feedback',
      url: '/feedback',
      icon: ThumbsUp,
      description: 'Help us improve the platform'
    }
  ];
  
  return (
    <div className="space-y-3">
      {navigationItems.map((item, index) => (
        <Button 
          key={index}
          variant="outline" 
          size="lg" 
          className="w-full justify-start bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:bg-gray-800 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 group" 
          asChild
        >
          <Link to={item.url} className="space-y-1">
            <div className="flex items-center w-full">
              <item.icon className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  {item.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  {item.description}
                </span>
              </div>
            </div>
          </Link>
        </Button>
      ))}
    </div>
  );
};

export default ProfileNavigation;
