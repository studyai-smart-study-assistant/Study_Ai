
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useChatData, useGroupChat } from '@/hooks/useChat';
import { sendMessage } from '@/lib/supabase/chat-functions';
import EnhancedGroupMembersModal from './EnhancedGroupMembersModal';
import GroupMessageInput from './GroupMessageInput';
import ChatHeader from './ChatHeader';
import ChatError from './ChatError';
import ChatMessageArea from './ChatMessageArea';
import DeleteGroupDialog from './DeleteGroupDialog';
import GroupAvatar from './GroupAvatar';

interface ChatInterfaceProps {
  recipientId: string;
  chatId: string;
  isGroup: boolean;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  recipientId,
  chatId,
  isGroup,
  onBack
}) => {
  const { currentUser } = useAuth();
  const [membersModal, setMembersModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const { displayName, loadError } = useChatData(chatId);
  const { messages, isLoading, groupDetails } = useGroupChat(chatId);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    if (!currentUser) {
      toast.error('आपको संदेश भेजने के लिए लॉग इन करना होगा');
      return;
    }
    
    try {
      setIsSendingMessage(true);
      
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        text: file ? "[संदेश भेज रहे हैं...]" : text,
        sender: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        timestamp: Date.now(),
        isTemp: true
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);

      if (file) {
        const filePath = `chat_images/${chatId}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('chat_media')
          .upload(filePath, file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('chat_media')
          .getPublicUrl(filePath);
        
        await sendMessage(chatId, currentUser.uid, `[image:${urlData.publicUrl}]`, isGroup);
        toast.success("छवि भेजी गई");
      } else {
        await sendMessage(chatId, currentUser.uid, text, isGroup);
      }
      
      setLocalMessages(prev => prev.filter(msg => msg.id !== tempId));
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('संदेश भेजने में त्रुटि');
      setLocalMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      setIsSendingMessage(false);
    }
  }, [chatId, currentUser, isGroup]);

  const refreshMessages = useCallback(() => {
    console.log("Messages will refresh automatically via listener");
  }, []);

  const isAdmin = isGroup && groupDetails?.admins && groupDetails.admins[currentUser?.uid];
  const memberCount = isGroup && groupDetails?.members ? Object.keys(groupDetails.members).length : 0;

  if (loadError) {
    return <ChatError onBack={onBack} error={loadError} />;
  }

  return (
    <div className="flex flex-col h-full glass-morphism border border-purple-200 dark:border-purple-900 rounded-lg overflow-hidden bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30">
      <ChatHeader
        displayName={displayName}
        isGroup={isGroup}
        onBack={onBack}
        onManageMembers={() => setMembersModal(true)}
        isAdmin={isAdmin}
        memberAvatars={isGroup ? (
          <GroupAvatar groupName={displayName || 'Group'} memberCount={memberCount} size="md" isAdmin={isAdmin} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      />
      
      <ChatMessageArea messages={localMessages} isLoading={isLoading} chatId={chatId} isGroup={isGroup} onRefreshMessages={refreshMessages} />
      <GroupMessageInput onSendMessage={handleSendMessage} isLoading={isSendingMessage} />
      
      {isGroup && groupDetails && (
        <EnhancedGroupMembersModal isOpen={membersModal} onClose={() => setMembersModal(false)} groupId={chatId} groupName={displayName || 'Group'} currentMembers={groupDetails.members || {}} admins={groupDetails.admins || {}} />
      )}

      <DeleteGroupDialog isOpen={deleteDialog} setIsOpen={setDeleteDialog} chatId={chatId} onDeleteSuccess={onBack} currentUserId={currentUser?.uid} />
    </div>
  );
};

export default ChatInterface;
