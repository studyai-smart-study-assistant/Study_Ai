
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLeaderboardData, createChatGroup } from "@/lib/supabase/chat-functions";
import { useAuth } from "@/contexts/AuthContext";
import { Palette } from "lucide-react";
import ColorSelector from './ColorSelector';
import UserList from './UserList';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

const colorOptions = ["bg-gradient-to-r from-pink-400 to-purple-500", "bg-gradient-to-r from-yellow-400 to-orange-500", "bg-gradient-to-r from-green-400 to-blue-500"];

const GroupChatModal: React.FC<GroupChatModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [groupColor, setGroupColor] = useState(colorOptions[0]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && currentUser) getLeaderboardData().then(data => setUsers(data.filter(u => u.id !== currentUser.uid)));
  }, [isOpen, currentUser]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error("Enter a group name");
    const selected = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    if (selected.length === 0) return toast.error("Select at least one user");
    setIsLoading(true);
    try {
      const members = { [currentUser!.uid]: true, ...selected.reduce((a, id) => ({...a, [id]: true}), {}) };
      const groupId = await createChatGroup(groupName, members);
      toast.success("Group created!");
      onGroupCreated(groupId);
      onClose();
    } catch { toast.error("Failed to create group"); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle><Palette className="mr-2 text-purple-500 inline" />Create a New Group</DialogTitle>
          <DialogDescription>Add members and choose a group color.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Group Name</Label><Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name" /></div>
          <div className="flex items-center gap-3"><Label>Color</Label><ColorSelector colorOptions={colorOptions} selectedColor={groupColor} onColorSelect={setGroupColor} /></div>
          <div><Label>Select Members</Label><UserList users={users} selectedUsers={selectedUsers} onToggleUser={(id) => setSelectedUsers(p => ({...p, [id]: !p[id]}))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateGroup} disabled={isLoading}>{isLoading ? "Creating..." : "Create Group"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
