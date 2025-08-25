
import { supabase } from "@/integrations/supabase/client";

export function getPublicImageUrl(image_path: string | null) {
  if (!image_path) return null;
  return supabase.storage.from("chat_media").getPublicUrl(image_path).data?.publicUrl;
}

export async function ensureChatMediaBucketExists() {
  try {
    const { data, error } = await supabase.storage.getBucket('chat_media');
    
    if (error) {
      console.log("Chat media bucket doesn't exist or couldn't be accessed");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking chat media bucket:", error);
    return false;
  }
}
