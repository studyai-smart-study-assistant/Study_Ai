
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { createChatGroup } from '@/lib/firebase';
import { ref, get } from "firebase/database";
import { database } from '@/lib/firebase/config';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

interface FirebaseUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  points?: number;
  level?: number;
}

const GroupChatModal: React.FC<GroupChatModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<FirebaseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, fetching users...");
      fetchRealUsers();
      // Reset form when modal opens
      setGroupName('');
      setSelectedUsers({});
    }
  }, [isOpen]);

  const fetchRealUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log("Fetching users from Firebase...");
      
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        console.log("Users data from Firebase:", usersData);
        
        const usersList: FirebaseUser[] = Object.entries(usersData)
          .map(([uid, userData]: [string, any]) => ({
            uid,
            displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
            email: userData.email || '',
            photoURL: userData.photoURL,
            points: userData.points || 0,
            level: userData.level || 1
          }))
          .filter(user => user.uid !== currentUser?.uid) // Exclude current user
          .sort((a, b) => (b.points || 0) - (a.points || 0)); // Sort by points

        console.log("Processed users list:", usersList);
        setAvailableUsers(usersList);
      } else {
        console.log("No users found in Firebase");
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    console.log("User selection changed:", userId, checked);
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: checked
    }));
  };

  const handleCreateGroup = async () => {
    console.log("Creating group...", { groupName, selectedUsers });
    
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to create a group');
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating group with members:", selectedUserIds);
      
      // Include current user and selected users
      const members = {
        [currentUser.uid]: true,
        ...Object.fromEntries(selectedUserIds.map(id => [id, true]))
      };

      console.log("Final members object:", members);
      const groupId = await createChatGroup(groupName.trim(), members);
      
      if (groupId) {
        console.log("Group created successfully with ID:", groupId);
        toast.success('Group created successfully!');
        onGroupCreated(groupId);
        
        // Reset form
        setGroupName('');
        setSelectedUsers({});
        onClose();
      } else {
        throw new Error("Group creation returned no ID");
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedCount = Object.keys(selectedUsers).filter(id => selectedUsers[id]).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Group
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Members {selectedCount > 0 && `(${selectedCount} selected)`}</Label>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : availableUsers.length > 0 ? (
              <ScrollArea className="h-64 border rounded-md p-2">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.uid} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                      <Checkbox
                        id={user.uid}
                        checked={selectedUsers[user.uid] || false}
                        onCheckedChange={(checked) => handleUserSelect(user.uid, checked as boolean)}
                        disabled={isLoading}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-xs">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{user.displayName}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        {user.points !== undefined && (
                          <div className="text-xs text-purple-600">
                            {user.points} points • Level {user.level}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No other users found.</p>
                <p className="text-sm">Invite friends to join Study AI!</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={isLoading || !groupName.trim() || selectedCount === 0}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Group'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
