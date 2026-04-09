
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupaChatMessage, Message } from "./types";
import { getChat, saveChat } from "./chat-operations";

const supabaseAny = supabase as unknown as SupabaseClient<any>;

export async function getGroupMessages(groupId: string) {
  try {
    const { data, error } = await supabaseAny
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    return data as SupaChatMessage[];
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    return [];
  }
}

export async function sendTextMessage(groupId: string, senderId: string, text: string) {
  try {
    const { data, error } = await supabaseAny
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: senderId,
        message_type: "text",
        content: text,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in sendTextMessage:", error);
    throw error;
  }
}

export async function sendImageMessage(groupId: string, senderId: string, file: File) {
  try {
    const fileName = `${groupId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9-.]/g, '_')}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat_media")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabaseAny
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: senderId,
        message_type: "image",
        file_url: fileName,
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in sendImageMessage:", error);
    throw error;
  }
}

// Enhanced message operations for local storage
export async function addMessage(chatId: string, content: string, role: "user" | "bot"): Promise<Message> {
  try {
    // Create new message object
    const message: Message = {
      id: crypto.randomUUID(),
      chatId,
      content,
      role,
      timestamp: Date.now(),
    };
  
    // Get current chat
    const chat = await getChat(chatId);
    if (!chat) {
      throw new Error(`Chat with ID ${chatId} not found`);
    }
  
    // Add message to chat
    chat.messages = chat.messages || [];
    chat.messages.push(message);
    
    // Update timestamp to mark as recently used
    chat.timestamp = Date.now();
    
    // Save updated chat
    await saveChat(chat);
    
    return message;
  } catch (error) {
    console.error("Error adding message:", error);
    throw new Error(`Failed to add message: ${error}`);
  }
}

export async function editMessage(chatId: string, messageId: string, content: string): Promise<void> {
  try {
    // Get current chat
    const chat = await getChat(chatId);
    if (!chat || !chat.messages) {
      throw new Error(`Chat with ID ${chatId} not found or has no messages`);
    }
    
    // Find and update message
    const messageIndex = chat.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      throw new Error(`Message with ID ${messageId} not found in chat ${chatId}`);
    }
    
    chat.messages[messageIndex].content = content;
    chat.messages[messageIndex].editedAt = Date.now();
    
    // Save updated chat
    await saveChat(chat);
  } catch (error) {
    console.error("Error editing message:", error);
    throw new Error(`Failed to edit message: ${error}`);
  }
}

export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  try {
    // Get current chat
    const chat = await getChat(chatId);
    if (!chat || !chat.messages) {
      throw new Error(`Chat with ID ${chatId} not found or has no messages`);
    }
    
    // Remove message
    chat.messages = chat.messages.filter(msg => msg.id !== messageId);
    
    // Save updated chat
    await saveChat(chat);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error(`Failed to delete message: ${error}`);
  }
}

export async function toggleMessageBookmark(chatId: string, messageId: string): Promise<boolean> {
  try {
    // Get current chat
    const chat = await getChat(chatId);
    if (!chat || !chat.messages) {
      throw new Error(`Chat with ID ${chatId} not found or has no messages`);
    }
    
    // Find message
    const messageIndex = chat.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      throw new Error(`Message with ID ${messageId} not found in chat ${chatId}`);
    }
    
    // Toggle bookmark status
    chat.messages[messageIndex].bookmarked = !chat.messages[messageIndex].bookmarked;
    const newBookmarkStatus = !!chat.messages[messageIndex].bookmarked;
    
    // Save updated chat
    await saveChat(chat);
    
    return newBookmarkStatus;
  } catch (error) {
    console.error("Error toggling message bookmark:", error);
    throw new Error(`Failed to toggle message bookmark: ${error}`);
  }
}
