
import { useState, useEffect, useRef } from 'react';
import { chatDB, Message } from '@/lib/db';
import { toast } from 'sonner';

export const useMessageState = (
  message: Message,
  onEdited: () => void,
  onDeleted: () => void
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(!!message.liked);
  const [isBookmarked, setIsBookmarked] = useState(!!message.bookmarked);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(message.content);
  
  const messageIdRef = useRef(message.id);
  const contentRef = useRef(message.content);

  // Reset editing state and update content when message changes
  useEffect(() => {
    setIsEditing(false);
    setEditedContent(message.content);
    setIsLiked(!!message.liked);
    setIsBookmarked(!!message.bookmarked);
    
    // Track if the message content or ID changed
    const contentChanged = contentRef.current !== message.content;
    const messageChanged = messageIdRef.current !== message.id;
    
    // Update refs
    contentRef.current = message.content;
    messageIdRef.current = message.id;

    // Only animate typing for new bot messages or changed bot messages
    if (message.role === 'bot' && (messageChanged || contentChanged)) {
      setIsTyping(true);
      // Start with full content - let the MessageMarkdownContent component handle the typing animation
      setDisplayedContent(message.content);
      
      // Set a timer to end typing animation
      const typingLength = Math.min(message.content.length * 5, 3000); // Max 3 seconds typing
      setTimeout(() => {
        setIsTyping(false);
      }, typingLength);
    } else {
      setIsTyping(false);
      setDisplayedContent(message.content);
    }
  }, [message]);

  // Copy message to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Delete message
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await chatDB.deleteMessage(message.chatId, message.id);
        toast.success('Message deleted');
        onDeleted();
      } catch (error) {
        console.error('Failed to delete message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  // Edit message
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    try {
      await chatDB.editMessage(message.chatId, message.id, editedContent);
      setIsEditing(false);
      toast.success('Message updated');
      onEdited();
    } catch (error) {
      console.error('Failed to update message:', error);
      toast.error('Failed to update message');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  // Toggle like status
  const handleLike = async () => {
    try {
      // Update local state immediately for responsiveness
      setIsLiked(!isLiked);
      
      // Get current message from DB to ensure we have latest state
      const chat = await chatDB.getChat(message.chatId);
      const currentMessage = chat?.messages?.find(m => m.id === message.id);
      
      if (currentMessage) {
        // Toggle liked status in DB
        currentMessage.liked = !currentMessage.liked;
        await chatDB.saveChat(chat!);
        onEdited();
      }
    } catch (error) {
      console.error('Failed to update like status:', error);
      // Revert local state if DB update fails
      setIsLiked(!!message.liked);
      toast.error('Failed to update like status');
    }
  };

  return {
    isEditing,
    editedContent,
    setEditedContent,
    isCopied,
    isLiked,
    isBookmarked,
    setIsBookmarked,
    isTyping,
    displayedContent,
    handleCopy,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleLike
  };
};
