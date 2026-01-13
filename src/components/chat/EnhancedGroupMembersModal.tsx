
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { updateGroupMembership, getLeaderboardData } from '@/lib/supabase/chat-functions';
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

const EnhancedGroupMembersModal: React.FC<EnhancedGroupMembersModalProps> = ({ isOpen, onClose, groupId, groupName, currentMembers, admins }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const isCurrentUserAdmin = currentUser && admins[currentUser.uid];

  useEffect(() => {
    if (isOpen) {
      getLeaderboardData().then(users => setAllUsers(users)).catch(() => toast.error('Failed to load users'));
    }
  }, [isOpen]);

  const handleAddMembers = async () => {
    if (!isCurrentUserAdmin) return toast.error('Only admins can add members');
    const selectedUserIds = Object.keys(selectedUsers).filter(id => selectedUsers[id]);
    if (selectedUserIds.length === 0) return toast.error('Please select users to add');
    
    setIsLoading(true);
    try {
      for (const userId of selectedUserIds) await updateGroupMembership(groupId, userId, true);
      toast.success(`Added ${selectedUserIds.length} member(s)`);
      setSelectedUsers({});
    } catch (error) {
      toast.error('Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Manage Group Members</DialogTitle>
          <p className="text-sm text-gray-600">{groupName}</p>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." />
          <ScrollArea className="h-64 border rounded-md p-2">
            {allUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                <Checkbox checked={selectedUsers[user.id] || false} onCheckedChange={(c) => setSelectedUsers(p => ({...p, [user.id]: c as boolean}))} />
                <Avatar className="w-8 h-8"><AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </ScrollArea>
          <div className="flex justify-end gap-2">
            {Object.values(selectedUsers).some(Boolean) && <Button onClick={handleAddMembers} disabled={isLoading}><UserPlus className="w-4 h-4 mr-1" />Add Selected</Button>}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedGroupMembersModal;
