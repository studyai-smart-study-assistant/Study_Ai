
// Re-export all hooks from their respective files
export { useChat, useChatData, useGroupChat } from './chat';

// Re-export the sendMessage function from firebase for convenience
export { sendMessage } from '@/lib/firebase';
