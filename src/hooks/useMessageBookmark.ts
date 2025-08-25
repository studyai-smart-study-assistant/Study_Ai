
import { useState } from 'react';
import { toast } from "sonner";
import { toggleMessageBookmark } from '@/lib/chat/message-operations';

export function useMessageBookmark(
  chatId: string, 
  messageId: string, 
  initialBookmarked: boolean, 
  onEdited: () => void,
  setIsBookmarked: (value: boolean) => void
) {
  const handleBookmark = async () => {
    try {
      const newBookmarkStatus = await toggleMessageBookmark(chatId, messageId);
      setIsBookmarked(newBookmarkStatus);
      
      toast.success(newBookmarkStatus 
        ? "Message saved to bookmarks" 
        : "Message removed from bookmarks"
      );
      
      // Refresh message data
      onEdited();
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark status");
    }
  };

  return { handleBookmark };
}
