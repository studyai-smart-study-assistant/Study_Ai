
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

interface ChatHeaderActionsProps {
  isAdmin: boolean;
  isGroup: boolean;
  onDeleteClick: () => void;
}

const ChatHeaderActions: React.FC<ChatHeaderActionsProps> = ({
  isAdmin,
  isGroup,
  onDeleteClick
}) => {
  if (!isAdmin || !isGroup) return null;
  
  return (
    <Button
      variant="outline"
      size="sm" 
      className="ml-2 bg-red-50 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-100"
      onClick={onDeleteClick}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      Delete
    </Button>
  );
};

export default ChatHeaderActions;
