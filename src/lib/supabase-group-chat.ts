
// This file serves as a compatibility layer for components still using the old import path
// We should migrate all components to use the new imports in the future

export type { 
  SupaGroup, 
  SupaGroupMember, 
  SupaChatMessage 
} from './chat/types';

export { 
  getGroupDetails 
} from './chat/group-operations';

export { 
  getGroupMessages,
  sendTextMessage,
  sendImageMessage
} from './chat/message-operations';

export { 
  getPublicImageUrl,
  ensureChatMediaBucketExists
} from './chat/media-operations';

// Export realtime operations with failover support for mobile devices
import { 
  listenForGroupMessages as originalListenForGroupMessages,
  enableRealtimeForChat
} from './chat/realtime-operations';

// Enhanced listener with failover support
export function listenForGroupMessages(groupId: string, callback: (messages: any[]) => void) {
  console.log("Setting up enhanced group messages listener with failover support");
  
  // Use the original implementation with enhanced error handling
  const cleanup = originalListenForGroupMessages(groupId, callback);
  
  // Set up an additional polling mechanism as a fallback
  // This is particularly important for mobile APKs where websockets might be less reliable
  let intervalId: NodeJS.Timeout | null = null;
  let lastMessageCount = 0;
  
  const startPollingFallback = () => {
    console.log("Starting polling fallback for group messages");
    
    // Poll every 10 seconds as a fallback
    intervalId = setInterval(async () => {
      try {
        const { getGroupMessages } = await import('./chat/message-operations');
        const messages = await getGroupMessages(groupId);
        
        // Only trigger callback if message count has changed
        if (messages && (messages.length !== lastMessageCount)) {
          console.log("Polling detected new messages:", messages.length);
          lastMessageCount = messages.length;
          callback(messages);
        }
      } catch (error) {
        console.error("Error in polling fallback:", error);
      }
    }, 10000);
  };
  
  // Test if realtime is working, if not fall back to polling
  enableRealtimeForChat().then(realtimeWorking => {
    if (!realtimeWorking) {
      console.log("Realtime not working, enabling polling fallback");
      startPollingFallback();
    }
  });
  
  // Return enhanced cleanup function
  return () => {
    // Clean up the original listener
    if (cleanup) cleanup();
    
    // Clean up polling fallback if active
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export { enableRealtimeForChat };
