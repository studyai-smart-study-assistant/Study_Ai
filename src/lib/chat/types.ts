
export type SupaGroup = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type SupaGroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  is_admin: boolean;
  joined_at: string;
};

export type SupaChatMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  message_type: "text" | "image";
  text_content?: string | null;
  image_path?: string | null;
  created_at: string;
};

// Add the missing Chat and Message types that were used in the old implementation
export type Chat = {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
};

export type Message = {
  id: string;
  chatId: string;
  role: "user" | "bot";
  content: string;
  timestamp: number;
  bookmarked?: boolean;
  liked?: boolean;
  editedAt?: number;
};
