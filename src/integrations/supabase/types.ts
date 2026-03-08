export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_key_usage: {
        Row: {
          created_at: string
          endpoint: string | null
          error_code: string | null
          id: string
          key_identifier: string
          response_time_ms: number | null
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_code?: string | null
          id?: string
          key_identifier: string
          response_time_ms?: number | null
          service: string
          status?: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_code?: string | null
          id?: string
          key_identifier?: string
          response_time_ms?: number | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      campus_chats: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant1_uid: string
          participant2_uid: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant1_uid: string
          participant2_uid: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant1_uid?: string
          participant2_uid?: string
        }
        Relationships: []
      }
      campus_messages: {
        Row: {
          chat_id: string
          created_at: string
          edited_at: string | null
          id: string
          image_url: string | null
          message_type: string
          sender_uid: string
          text_content: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string
          sender_uid: string
          text_content?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string
          sender_uid?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "campus_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          firebase_uid: string
          id: string
          last_seen: string | null
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          firebase_uid: string
          id?: string
          last_seen?: string | null
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          firebase_uid?: string
          id?: string
          last_seen?: string | null
          status?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          edited_at: string | null
          id: string
          message_type: string
          reply_to_id: string | null
          sender_id: string
          text_content: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
          text_content?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          education_level: string | null
          email: string | null
          id: string
          is_blocked: boolean
          last_login: string | null
          level: number | null
          longest_streak: number | null
          photo_url: string | null
          points: number | null
          provider: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          user_category: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean
          last_login?: string | null
          level?: number | null
          longest_streak?: number | null
          photo_url?: string | null
          points?: number | null
          provider?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_category?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          id?: string
          is_blocked?: boolean
          last_login?: string | null
          level?: number | null
          longest_streak?: number | null
          photo_url?: string | null
          points?: number | null
          provider?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          user_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_memories: {
        Row: {
          category: string
          created_at: string
          id: string
          importance: number
          memory_key: string
          memory_value: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          importance?: number
          memory_key: string
          memory_value: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          importance?: number
          memory_key?: string
          memory_value?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          balance: number
          created_at: string
          credits: number
          level: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          balance?: number
          created_at?: string
          credits?: number
          level?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          balance?: number
          created_at?: string
          credits?: number
          level?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
