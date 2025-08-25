import { supabase } from "@/integrations/supabase/client";
import { SupaChatMessage } from "./types";
import { getGroupMessages } from "./message-operations";
import { RealtimeChannel } from "@supabase/supabase-js";

// Keep track of processed message IDs to avoid duplicates
const processedMessageIds = new Set<string>();

// Clear processed IDs periodically to prevent memory leaks
setInterval(() => {
  // Only keep messages from the last 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  processedMessageIds.forEach((idWithTimestamp) => {
    const [, timestamp] = idWithTimestamp.split('-timestamp-');
    if (parseInt(timestamp) < fiveMinutesAgo) {
      processedMessageIds.delete(idWithTimestamp);
    }
  });
}, 60000); // Run cleanup every minute

export function listenForGroupMessages(groupId: string, callback: (messages: SupaChatMessage[]) => void) {
  try {
    let cancel = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    // Initial fetch of messages
    const fetchInitialMessages = async () => {
      try {
        console.log("Initial fetch of messages for group:", groupId);
        const messages = await getGroupMessages(groupId);
        if (!cancel) {
          if (messages && messages.length > 0) {
            callback(messages);
          } else {
            callback([]);
          }
        }
      } catch (error) {
        console.error("Error in initial fetch of messages:", error);
        callback([]);
        
        // Retry initial fetch on failure
        if (retryCount < MAX_RETRIES && !cancel) {
          console.log(`Retrying initial fetch (${retryCount + 1}/${MAX_RETRIES})...`);
          retryCount++;
          setTimeout(fetchInitialMessages, 2000); // Retry after 2 seconds
        }
      }
    };

    fetchInitialMessages();

    // Set up the realtime listener
    const channelName = `group-${groupId}`;
    console.log(`Setting up realtime channel: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    channel
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `group_id=eq.${groupId}` 
        },
        (payload) => {
          if (!cancel) {
            // Generate a unique ID for this message using the ID and current timestamp
            const messageId = `${payload.new.id}-timestamp-${Date.now()}`;
            
            // Check if we've already processed this message in the last few minutes
            if (!processedMessageIds.has(messageId)) {
              console.log('New message received via realtime:', payload);
              
              // Mark as processed to avoid duplicates
              processedMessageIds.add(messageId);
              
              // Always fetch fresh messages to ensure we have the latest data
              getGroupMessages(groupId)
                .then(callback)
                .catch(error => {
                  console.error("Error in realtime listener:", error);
                });
            } else {
              console.log('Duplicate message detected, ignoring:', payload);
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`Subscription status for ${channelName}:`, status);
        
        // Handle subscription failures using string literal comparison
        if (status === "SUBSCRIPTION_ERROR" && retryCount < MAX_RETRIES && !cancel) {
          console.log(`Retrying subscription (${retryCount + 1}/${MAX_RETRIES})...`);
          retryCount++;
          
          // Unsubscribe and try again
          supabase.removeChannel(channel);
          
          // Wait before retrying
          setTimeout(() => {
            if (!cancel) {
              const newChannel = supabase.channel(channelName);
              newChannel
                .on('postgres_changes', 
                  { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'chat_messages', 
                    filter: `group_id=eq.${groupId}` 
                  },
                  (payload) => {
                    if (!cancel) {
                      const messageId = `${payload.new.id}-timestamp-${Date.now()}`;
                      if (!processedMessageIds.has(messageId)) {
                        console.log('New message received via realtime (retry):', payload);
                        processedMessageIds.add(messageId);
                        getGroupMessages(groupId).then(callback).catch(console.error);
                      }
                    }
                  }
                )
                .subscribe();
            }
          }, 2000);
        }
      });

    return () => {
      console.log(`Cleaning up realtime listener for group: ${groupId}`);
      cancel = true;
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error("Error in listenForGroupMessages:", error);
    return () => {}; // Return empty cleanup function in case of error
  }
}

export async function enableRealtimeForChat() {
  try {
    console.log("Enabling realtime for chat - testing connection...");
    
    // Test the realtime connection
    const channel = supabase.channel('connection-test');
    
    return new Promise<boolean>((resolve) => {
      channel
        .subscribe((status: string) => {
          console.log("Realtime connection test status:", status);
          
          // Clean up test channel
          supabase.removeChannel(channel);
          
          if (status === "SUBSCRIBED") {
            console.log("Realtime subscriptions are working");
            resolve(true);
          } else {
            console.warn("Realtime subscription test failed:", status);
            resolve(false);
          }
        });
      
      // Set timeout for connection test
      setTimeout(() => {
        supabase.removeChannel(channel);
        console.warn("Realtime connection test timed out");
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    console.error("Error testing realtime connection:", error);
    return false;
  }
}
