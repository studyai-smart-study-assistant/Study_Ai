
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLeaderboardData, updateGroupMembership } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, UserMinus } from "lucide-react";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentMembers: { [uid: string]: boolean };
  admins: { [uid: string]: boolean };
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  groupId,
  currentMembers,
  admins,
}) => {
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [selectedAddIds, setSelectedAddIds] = useState<{ [key: string]: boolean }>({});
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const users = await getLeaderboardData();
          setLeaderboardUsers(users.filter((u) => u.id !== currentUser?.uid));
        } catch (err) {
          toast.error("Failed to load users.");
        }
      };
      fetchUsers();
      setSelectedAddIds({});
      setSelectedRemoveIds({});
    }
  }, [isOpen, currentUser]);

  const isAdmin = admins && currentUser?.uid && admins[currentUser.uid];

  const handleToggleAddMember = (uid: string) => {
    setSelectedAddIds((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleToggleRemoveMember = (uid: string) => {
    setSelectedRemoveIds((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleAddMembers = async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      await Promise.all(
        Object.keys(selectedAddIds)
          .filter(uid => selectedAddIds[uid] && !currentMembers[uid])
          .map(uid => updateGroupMembership(groupId, uid, true))
      );
      toast.success("Members added!");
      onClose();
    } catch {
      toast.error("Error adding members");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMembers = async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      await Promise.all(
        Object.keys(selectedRemoveIds)
          .filter(uid => selectedRemoveIds[uid] && currentMembers[uid])
          .map(uid => updateGroupMembership(groupId, uid, false))
      );
      toast.success("Members removed!");
      onClose();
    } catch {
      toast.error("Error removing members");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg animate-fade-in">
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
          <DialogDescription>
            Add or remove members in your group.<br />
            <span className="text-xs text-purple-500">You can only modify members if you are group admin.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <h3 className="font-semibold mb-2 flex items-center">
            <UserPlus className="h-4 w-4 mr-1 text-green-500" /> Add Members
          </h3>
          <div className="max-h-40 overflow-auto border rounded-md p-2 mb-2 space-y-2">
            {leaderboardUsers
              .filter(u => !currentMembers[u.id])
              .map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`add-user-${user.id}`}
                    checked={!!selectedAddIds[user.id]}
                    onCheckedChange={() => handleToggleAddMember(user.id)}
                  />
                  <Label htmlFor={`add-user-${user.id}`} className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs">
                      {user.photoURL ? (
                        <img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt={user.name || 'User'}/>
                      ) : (user.name || 'U').charAt(0)}
                    </div>
                    <span>{user.name || 'Unknown User'} {user.level ? `(Level ${user.level})` : ''}</span>
                  </Label>
                </div>
              ))}
            {leaderboardUsers.filter(u => !currentMembers[u.id]).length === 0 && (
              <span className="text-gray-400 text-xs">All users are already in the group.</span>
            )}
          </div>
          <Button
            disabled={Object.keys(selectedAddIds).filter(uid => selectedAddIds[uid]).length === 0 || isLoading}
            onClick={handleAddMembers}
            className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Selected
          </Button>
          <h3 className="font-semibold flex items-center mt-6 mb-2">
            <UserMinus className="h-4 w-4 mr-1 text-red-500" /> Remove Members
          </h3>
          <div className="max-h-40 overflow-auto border rounded-md p-2 mb-2 space-y-2">
            {leaderboardUsers
              .filter(u => currentMembers[u.id])
              .map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`remove-user-${user.id}`}
                    checked={!!selectedRemoveIds[user.id]}
                    onCheckedChange={() => handleToggleRemoveMember(user.id)}
                  />
                  <Label htmlFor={`remove-user-${user.id}`} className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-xs">
                      {user.photoURL ? (
                        <img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt={user.name || 'User'}/>
                      ) : (user.name || 'U').charAt(0)}
                    </div>
                    <span>{user.name || 'Unknown User'} {user.level ? `(Level ${user.level})` : ''}</span>
                  </Label>
                </div>
              ))}
            {leaderboardUsers.filter(u => currentMembers[u.id]).length === 0 && (
              <span className="text-gray-400 text-xs">No removable members found.</span>
            )}
          </div>
          <Button
            disabled={Object.keys(selectedRemoveIds).filter(uid => selectedRemoveIds[uid]).length === 0 || isLoading}
            onClick={handleRemoveMembers}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg"
          >
            <UserMinus className="h-4 w-4 mr-1" />
            Remove Selected
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersModal;
