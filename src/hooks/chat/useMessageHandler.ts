
import { useCallback } from 'react';

interface UseMessageHandlerProps {
  chatId: string;
  loadMessages: () => Promise<void>;
  onChatUpdated?: () => void;
  scrollToBottom: () => void;
  sendMessage: (input: string) => void;
}

export const useMessageHandler = ({
  chatId,
  loadMessages,
  onChatUpdated,
  scrollToBottom,
  sendMessage
}: UseMessageHandlerProps) => {
  
  const handleSend = useCallback((input: string) => {
    sendMessage(input);
    scrollToBottom();
  }, [sendMessage, scrollToBottom]);

  const handleMessageEdited = useCallback(async () => {
    await loadMessages();
    if (onChatUpdated) onChatUpdated();
    scrollToBottom();
  }, [loadMessages, onChatUpdated, scrollToBottom]);

  const handleMessageDeleted = useCallback(async () => {
    await loadMessages();
    if (onChatUpdated) onChatUpdated();
  }, [loadMessages, onChatUpdated]);

  return {
    handleSend,
    handleMessageEdited,
    handleMessageDeleted
  };
};
