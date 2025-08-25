
import React from 'react';
import { deleteGroup } from '@/lib/firebase';
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteGroupDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chatId: string;
  onDeleteSuccess: () => void;
  currentUserId?: string;
}

const DeleteGroupDialog: React.FC<DeleteGroupDialogProps> = ({
  isOpen,
  setIsOpen,
  chatId,
  onDeleteSuccess,
  currentUserId
}) => {
  const handleDeleteGroup = async () => {
    if (!currentUserId) return;

    try {
      await deleteGroup(chatId);
      toast.success("Group deleted successfully");
      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Group</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the group 
            and remove all messages for all members.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteGroup}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteGroupDialog;
