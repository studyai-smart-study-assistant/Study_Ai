
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { updateGroupMembership } from '@/lib/firebase';
import { ref, get } from "firebase/database";
import { database } from '@/lib/firebase/config';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, UserMinus, UserPlus } from 'lucide-react';

interface EnhancedGroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  currentMembers: {[uid: string]: boolean};
  admins: {[uid: string]: boolean};
}

interface FirebaseUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  points?: number;
  level?: number;
}

const EnhancedGroupMembersModal: React.FC<EnhancedGroupMembersModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentMembers,
  admins
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<FirebaseUser[]>([]);
  const [groupMembers, setGroupMembers] = useState<FirebaseUser[]>([]);
  const [nonMembers, setNonMembers] = useState<FirebaseUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { currentUser } = useAuth();

  const isCurrentUserAdmin = currentUser && admins[currentUser.uid];

  useEffect(() => {
    if (isOpen) {
      fetchAllUsers();
    }
  }, [isOpen, currentMembers]);

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: FirebaseUser[] = Object.entries(usersData)
          .map(([uid, userData]: [string, any]) => ({
            uid,
            displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
            email: userData.email || '',
            photoURL: userData.photoURL,
            points: userData.points || 0,
            level: userData.level || 1
          }))
          .sort((a, b) => (b.points || 0) - (a.points || 0));

        setAllUsers(usersList);
        
        // Separate members and non-members
        const members = usersList.filter(user => currentMembers[user.uid]);
        const nonMembersList = usersList.filter(user => !currentMembers[user.uid]);
        
        setGroupMembers(members);
        setNonMembers(nonMembersList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: checked
    }));
  };

  const handleAddMembers = async () => {
    if (!isCurrentUserAdmin) {
      toast.error('Only admins can add members');
      return;
    }

    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    if (selectedUserIds.length === 0) {
      toast.error('Please select users to add');
      return;
    }

    try {
      setIsLoading(true);
      
      for (const userId of selectedUserIds) {
        await updateGroupMembership(groupId, userId, true);
      }
      
      toast.success(`Added ${selectedUserIds.length} member(s) to the group`);
      setSelectedUsers({});
      await fetchAllUsers(); // Refresh the lists
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!isCurrentUserAdmin) {
      toast.error('Only admins can remove members');
      return;
    }

    if (userId === currentUser?.uid) {
      toast.error('You cannot remove yourself from the group');
      return;
    }

    try {
      setIsLoading(true);
      await updateGroupMembership(groupId, userId, false);
      toast.success('Member removed from group');
      await fetchAllUsers(); // Refresh the lists
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredNonMembers = nonMembers.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = groupMembers.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Manage Group Members
          </DialogTitle>
          <p className="text-sm text-gray-600">{groupName}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              disabled={isLoading}
            />
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Current Members ({filteredMembers.length})</Label>
                </div>
                <ScrollArea className="h-64 border rounded-md p-2">
                  <div className="space-y-2">
                    {filteredMembers.map((user) => (
                      <div key={user.uid} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-xs">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{user.displayName}</span>
                            {admins[user.uid] && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          {user.points !== undefined && (
                            <div className="text-xs text-purple-600">
                              {user.points} points • Level {user.level}
                            </div>
                          )}
                        </div>
                        {isCurrentUserAdmin && user.uid !== currentUser?.uid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(user.uid)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {filteredMembers.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No members found.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Available Users to Add */}
              {isCurrentUserAdmin && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Add Members ({filteredNonMembers.length})</Label>
                    {Object.keys(selectedUsers).filter(id => selectedUsers[id]).length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleAddMembers}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Selected
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-64 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredNonMembers.map((user) => (
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
                      {filteredNonMembers.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No users available to add.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedGroupMembersModal;
