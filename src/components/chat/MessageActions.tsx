
import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMessage, toggleSaveMessage } from '@/lib/firebase';

interface MessageActionsProps {
  messageId: string;
  chatId: string;
  isGroup: boolean;
  isSaved: boolean;
  onActionComplete: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageId, 
  chatId, 
  isGroup,
  isSaved,
  onActionComplete 
}) => {
  const [showActions, setShowActions] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  
  const handleDelete = async () => {
    try {
      await deleteMessage(chatId, messageId, isGroup);
      toast.success('Message deleted');
      onActionComplete();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };
  
  const handleToggleSave = async () => {
    try {
      const newSaveStatus = await toggleSaveMessage(chatId, messageId, isGroup);
      toast.success(newSaveStatus ? 'Message saved' : 'Message unsaved');
      onActionComplete();
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast.error('Failed to update message');
    }
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
      <div className={`flex space-x-2 p-1 rounded-lg bg-white dark:bg-gray-800 shadow-md transition-all ${
        showActions ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
      }`}>
        <button 
          className="text-amber-500 hover:text-amber-600 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={handleToggleSave}
          title={isSaved ? "Unsave message" : "Save message"}
        >
          <Bookmark className={isSaved ? "fill-amber-500" : ""} size={16} />
        </button>
        <button 
          className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
          onClick={handleDelete}
          title="Delete message"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default MessageActions;
