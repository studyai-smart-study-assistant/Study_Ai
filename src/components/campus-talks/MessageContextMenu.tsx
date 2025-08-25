import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Forward, Copy, Edit3, Trash2, ThumbsUp, Heart, Laugh, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

interface MessageContextMenuProps {
  messageId: string;
  messageContent: string;
  x: number;
  y: number;
  onClose: () => void;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onForward: (messageId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  messageId,
  messageContent,
  x,
  y,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onForward,
  canEdit,
  canDelete
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast.success('Message copied to clipboard');
      onClose();
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy message');
    }
  };

  const handleEditSubmit = () => {
    if (editContent.trim()) {
      onEdit(messageId, editContent.trim());
      setEditMode(false);
      onClose();
    }
  };

  const reactions = [
    { emoji: '👍', icon: ThumbsUp, label: 'Like' },
    { emoji: '❤️', icon: Heart, label: 'Love' },
    { emoji: '😂', icon: Laugh, label: 'Laugh' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '🙏', label: 'Pray' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex: 1000
        }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Quick Reactions */}
        <div className="flex p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          {reactions.slice(0, 6).map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => {
                onReaction(messageId, emoji);
                onClose();
              }}
              className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 text-lg transition-colors"
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <button
            onClick={() => {
              onReply(messageId);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Reply className="w-4 h-4 mr-3 text-blue-500" />
            Reply
          </button>

          <button
            onClick={() => {
              onForward(messageId);
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Forward className="w-4 h-4 mr-3 text-green-500" />
            Forward
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4 mr-3 text-purple-500" />
            Copy
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setEditMode(true);
                setEditContent(messageContent);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-3 text-orange-500" />
              Edit
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => {
                onDelete(messageId);
                onClose();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Delete
            </button>
          )}
        </div>

        {/* Edit Mode */}
        {editMode && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEditSubmit();
                } else if (e.key === 'Escape') {
                  setEditMode(false);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="Edit message..."
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MessageContextMenu;