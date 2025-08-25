import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Bell, Settings, ArrowLeft, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChatList from '@/components/campus-talks/ChatList';
import CampusChatWindow from '@/components/campus-talks/CampusChatWindow';
import UserProfile from '@/components/campus-talks/UserProfile';
import CreateGroupModal from '@/components/campus-talks/CreateGroupModal';
import SettingsModal from '@/components/campus-talks/SettingsModal';
import { useCampusChats } from '@/hooks/useCampusChats';
import { useUserPresence } from '@/hooks/useUserPresence';
import { CampusUser } from '@/hooks/useCampusUsers';


const CampusTalks = () => {
  const [activeView, setActiveView] = useState<'chats' | 'users' | 'groups' | 'notifications'>('users');
  const [selectedUser, setSelectedUser] = useState<CampusUser | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, users, loading } = useCampusChats(searchQuery);
  
  // Update user presence
  useUserPresence();

  // Handle direct user selection from navigation state
  useEffect(() => {
    if (location.state?.selectUserId && users.length > 0) {
      const userToSelect = users.find(user => user.firebase_uid === location.state.selectUserId);
      if (userToSelect) {
        setSelectedUser(userToSelect);
        // Clear the navigation state
        navigate('/campus-talks', { replace: true });
      }
    }
  }, [location.state, users, navigate]);

  const handleChatSelect = (chatId: string) => {
    // Will be implemented when chat list is ready
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const handleUserSelect = (user: CampusUser) => {
    setSelectedUser(user);
  };

  const showChatList = !isMobile || !selectedUser;
  const showChatWindow = selectedUser && (!isMobile || selectedUser);

  return (
      <div className="flex h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10">
      {/* Sidebar - Chat List */}
      <AnimatePresence mode="wait">
        {showChatList && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col bg-background/90 backdrop-blur-xl border-r border-border/50`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="rounded-full hover:bg-secondary/80 transition-all duration-200"
                  title="Go to Home"
                >
                  <Home className="w-5 h-5" />
                </Button>
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <MessageCircle className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Campus Talks</h1>
                  <p className="text-sm text-muted-foreground">Connect with students</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-full hover:bg-secondary/80 transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary/20 border-border/30 rounded-full transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <ChatList
                  chats={chats}
                  users={users}
                  activeView={activeView}
                  onChatSelect={handleChatSelect}
                  onUserSelect={handleUserSelect}
                  onCreateGroup={() => setShowCreateGroup(true)}
                  loading={loading}
                />
            </ScrollArea>

            {/* Bottom Navigation - Mobile Only */}
            {isMobile && (
              <div className="flex border-t border-border/30 bg-background/90 backdrop-blur-sm">
                {[
                  { key: 'users', label: 'All Users', icon: Users },
                  { key: 'chats', label: 'Chats', icon: MessageCircle },
                  { key: 'groups', label: 'Groups', icon: Users },
                  { key: 'notifications', label: 'Notifications', icon: Bell }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key as any)}
                    className={`flex-1 p-3 text-center transition-all duration-200 ${
                      activeView === key
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">{label}</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence mode="wait">
        {showChatWindow && selectedUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <CampusChatWindow
              otherUser={selectedUser}
              onBack={handleBackToList}
              showBackButton={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!selectedUser && !isMobile && (
        <div className="flex-1 flex items-center justify-center bg-background/30">
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <MessageCircle className="w-12 h-12 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              Welcome to Campus Talks
            </h3>
            <p className="text-muted-foreground text-lg mb-4">
              Connect with your fellow students
            </p>
            <p className="text-sm text-muted-foreground">
              Select a student from the Users tab to start a conversation
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserProfile
        userId={showUserProfile}
        onClose={() => setShowUserProfile(null)}
      />
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      </div>
  );
};

export default CampusTalks;