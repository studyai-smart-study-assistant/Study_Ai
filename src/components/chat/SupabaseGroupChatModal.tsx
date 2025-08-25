
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserCircle, Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SupabaseGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupData: { name: string; memberIds: string[] }) => void;
}

const SupabaseGroupChatModal: React.FC<SupabaseGroupChatModalProps> = ({ 
  isOpen, 
  onClose, 
  onGroupCreated 
}) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSelectedUsers(new Set());
      setGroupName("");
    }
  }, [isOpen]);

  const loadUsers = async () => {
    if (!currentUser) return;

    try {
      setLoadingUsers(true);
      
      // Create dummy users for demo since we don't have user management in place
      const dummyUsers: User[] = [
        { id: 'user1', name: 'आरव शर्मा', email: 'aarav@example.com' },
        { id: 'user2', name: 'दिव्या पटेल', email: 'divya@example.com' },
        { id: 'user3', name: 'रोहित कुमार', email: 'rohit@example.com' },
        { id: 'user4', name: 'प्रिया गुप्ता', email: 'priya@example.com' },
        { id: 'user5', name: 'अमित सिंह', email: 'amit@example.com' }
      ].filter(user => user.id !== currentUser.uid);
      
      setUsers(dummyUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsLoading(true);
    
    try {
      await onGroupCreated({
        name: groupName.trim(),
        memberIds: Array.from(selectedUsers)
      });
      
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
              <Users className="mr-2 text-purple-500" />
              Create Enhanced Group
            </span>
          </DialogTitle>
          <DialogDescription>
            Create a new group with media sharing, voice messages, and file uploads
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name (e.g., Class 12 Physics Study)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Members ({selectedUsers.size} selected)</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              {loadingUsers ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <UserCircle className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No users available</p>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isLoading || !groupName.trim() || selectedUsers.size === 0}
          >
            {isLoading ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseGroupChatModal;
