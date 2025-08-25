
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLeaderboardData, createChatGroup } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Palette } from "lucide-react";

import ColorSelector from './ColorSelector';
import UserList from './UserList';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

const colorOptions = [
  "bg-gradient-to-r from-pink-400 to-purple-500",
  "bg-gradient-to-r from-yellow-400 to-orange-500",
  "bg-gradient-to-r from-green-400 to-blue-500",
  "bg-gradient-to-r from-purple-600 to-indigo-500",
  "bg-gradient-to-r from-red-400 to-yellow-400",
];

const GroupChatModal: React.FC<GroupChatModalProps> = ({ 
  isOpen, 
  onClose, 
  onGroupCreated 
}) => {
  const [groupName, setGroupName] = useState("");
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const [groupColor, setGroupColor] = useState(colorOptions[0]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getLeaderboardData();
        // Filter out current user
        const filteredUsers = users.filter(user => user.id !== currentUser?.uid);
        setLeaderboardUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      }
    };

    if (isOpen && currentUser) {
      fetchUsers();
      setSelectedUsers({});
    }
  }, [isOpen, currentUser]);

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsLoading(true);
    
    try {
      if (!currentUser) {
        throw new Error("You must be logged in to create a group");
      }

      // Add current user to the group members
      const members = {
        [currentUser.uid]: true,
        ...selectedUserIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
      };

      // You can use groupColor for visual styling, to be saved or passed as needed
      const groupId = await createChatGroup(groupName, members);

      toast.success("Group created successfully!");
      onGroupCreated(groupId);
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md animate-fade-in">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center">
              <Palette className="mr-2 text-purple-500" />
              Create a New Group
            </span>
          </DialogTitle>
          <DialogDescription>
            Add members from the leaderboard to your new chat group. Choose a group color too!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label>Group Color</Label>
            <ColorSelector 
              colorOptions={colorOptions}
              selectedColor={groupColor}
              onColorSelect={setGroupColor}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Members</Label>
            <UserList 
              users={leaderboardUsers}
              selectedUsers={selectedUsers}
              onToggleUser={handleToggleUser}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
