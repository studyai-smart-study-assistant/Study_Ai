import React, { useState } from 'react';
import { MessageCircle, Users, Plus, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CampusUser } from '@/hooks/useCampusUsers';
import { getAvatarProps } from '@/lib/utils/avatar';

interface ChatListProps {
  chats: any[];
  users: CampusUser[];
  activeView: 'chats' | 'users' | 'groups' | 'notifications';
  onChatSelect: (chatId: string) => void;
  onUserSelect: (user: CampusUser) => void;
  onCreateGroup: () => void;
  loading: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  users,
  activeView,
  onChatSelect,
  onUserSelect,
  onCreateGroup,
  loading
}) => {
  const [selectedImageUser, setSelectedImageUser] = useState<CampusUser | null>(null);
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderUsers = () => (
    <div className="space-y-1 p-2">
      {users.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No students found</p>
        </div>
      ) : (
        <>
          {/* Online Users Section */}
          {users.filter(user => user.status === 'online').length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2 px-2">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                <span className="text-sm font-semibold text-foreground">Online</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({users.filter(user => user.status === 'online').length})
                </span>
              </div>
              {users
                .filter(user => user.status === 'online')
                .map((user) => (
                  <div
                    key={user.firebase_uid}
                    onClick={() => onUserSelect(user)}
                    className="flex items-center p-3 rounded-xl hover:bg-secondary/60 cursor-pointer transition-all duration-200 group bg-primary/5 dark:bg-primary/10 border border-primary/20"
                  >
                    <div className="relative">
                      <Avatar 
                        className="w-12 h-12 mr-3 ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageUser(user);
                        }}
                      >
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback {...getAvatarProps(user.display_name)}>
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">
                          {user.display_name || 'Unknown User'}
                        </h4>
                        <Badge 
                          variant="default"
                          className="text-xs bg-primary hover:bg-primary/90"
                        >
                          Online
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Active now • Click to chat
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Offline Users Section */}
          {users.filter(user => user.status !== 'online').length > 0 && (
            <div>
              <div className="flex items-center mb-2 px-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-sm font-semibold text-foreground">Offline</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({users.filter(user => user.status !== 'online').length})
                </span>
              </div>
              {users
                .filter(user => user.status !== 'online')
                .map((user) => (
                  <div
                    key={user.firebase_uid}
                    onClick={() => onUserSelect(user)}
                    className="flex items-center p-3 rounded-xl hover:bg-secondary/60 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="relative">
                      <Avatar 
                        className="w-12 h-12 mr-3 ring-2 ring-transparent group-hover:ring-primary/20 transition-all cursor-pointer opacity-75"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageUser(user);
                        }}
                      >
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback {...getAvatarProps(user.display_name)}>
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">
                          {user.display_name || 'Unknown User'}
                        </h4>
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                        >
                          Offline
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.last_seen ? 
                          `Last seen ${new Date(user.last_seen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` :
                          'Last seen recently'
                        }
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderChats = () => (
    <div className="space-y-2 p-2">
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No chats yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Start a conversation with someone from the Users tab
          </p>
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className="flex items-center p-3 rounded-xl hover:bg-secondary/80 cursor-pointer transition-all duration-200 group"
          >
            <Avatar className="w-12 h-12 mr-3 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src={chat.avatar || ''} />
              <AvatarFallback {...getAvatarProps(chat.name)}>
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {chat.name}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {chat.lastMessage || 'No messages'}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between p-3">
        <h3 className="font-medium text-foreground">Groups</h3>
        <Button
          onClick={onCreateGroup}
          size="sm"
          className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </div>
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No groups yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Create a group to start chatting with multiple people
        </p>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-2 p-2">
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No notifications</p>
        <p className="text-xs text-muted-foreground mt-2">
          You'll see notifications here when you receive them
        </p>
      </div>
    </div>
  );

  return (
    <>
      {(() => {
        switch (activeView) {
          case 'chats':
            return renderChats();
          case 'users':
            return renderUsers();
          case 'groups':
            return renderGroups();
          case 'notifications':
            return renderNotifications();
          default:
            return renderUsers();
        }
      })()}
      
      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImageUser} onOpenChange={() => setSelectedImageUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedImageUser?.avatar_url || ''} />
                <AvatarFallback {...getAvatarProps(selectedImageUser?.display_name)}>
                </AvatarFallback>
              </Avatar>
              {selectedImageUser?.display_name || 'Unknown User'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImageUser?.avatar_url || ''}
              alt={`${selectedImageUser?.display_name}'s profile picture`}
              className="max-w-full max-h-96 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatList;