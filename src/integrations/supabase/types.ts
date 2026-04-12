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
      ad_settings: {
        Row: {
          ad_network: string
          created_at: string
          enabled: boolean
          id: string
          page: string
          updated_at: string
        }
        Insert: {
          ad_network: string
          created_at?: string
          enabled?: boolean
          id?: string
          page?: string
          updated_at?: string
        }
        Update: {
          ad_network?: string
          created_at?: string
          enabled?: boolean
          id?: string
          page?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      book_likes: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_likes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          category: string
          cover_image_url: string | null
          description: string | null
          downloads: number
          external_link: string | null
          file_url: string | null
          id: string
          is_public: boolean
          likes: number
          tags: string[] | null
          title: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          author: string
          category?: string
          cover_image_url?: string | null
          description?: string | null
          downloads?: number
          external_link?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean
          likes?: number
          tags?: string[] | null
          title: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          author?: string
          category?: string
          cover_image_url?: string | null
          description?: string | null
          downloads?: number
          external_link?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean
          likes?: number
          tags?: string[] | null
          title?: string
          uploaded_at?: string
          uploaded_by?: string
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
      campus_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_uid: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_uid: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "campus_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          is_ai_response: boolean
          message_type: string
          sender_uid: string
          text_content: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          is_ai_response?: boolean
          message_type?: string
          sender_uid: string
          text_content?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          is_ai_response?: boolean
          message_type?: string
          sender_uid?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "campus_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          only_admins_add_members: boolean
          only_admins_send: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          only_admins_add_members?: boolean
          only_admins_send?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          only_admins_add_members?: boolean
          only_admins_send?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      campus_messages: {
        Row: {
          author_role: string
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
          author_role?: string
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
          author_role?: string
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
          author_role: string
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
          author_role?: string
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
          author_role?: string
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
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      group_chat_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          role: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          role?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_participants: {
        Row: {
          group_id: string
          id: string
          is_active: boolean
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: number
          message_type: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: number
          message_type?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: number
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "groups"
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
      study_groups: {
        Row: {
          created_at: string
          creator_id: string
          group_system_prompt: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          group_system_prompt?: string
          id?: string
          invite_code: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          group_system_prompt?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
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
      weekly_reports: {
        Row: {
          average_accuracy: number | null
          chapters_read: number | null
          consistency_score: number | null
          created_at: string | null
          daily_breakdown: Json | null
          engagement_score: number | null
          id: string
          interactive_sessions: number | null
          notes_created: number | null
          overview_summary: string | null
          quizzes_taken: number | null
          report_type: string
          strong_areas: string[] | null
          subject_breakdown: Json | null
          top_subjects: string[] | null
          total_activities: number | null
          total_study_minutes: number | null
          user_id: string
          weak_areas: string[] | null
          week_end: string
          week_start: string
        }
        Insert: {
          average_accuracy?: number | null
          chapters_read?: number | null
          consistency_score?: number | null
          created_at?: string | null
          daily_breakdown?: Json | null
          engagement_score?: number | null
          id?: string
          interactive_sessions?: number | null
          notes_created?: number | null
          overview_summary?: string | null
          quizzes_taken?: number | null
          report_type?: string
          strong_areas?: string[] | null
          subject_breakdown?: Json | null
          top_subjects?: string[] | null
          total_activities?: number | null
          total_study_minutes?: number | null
          user_id: string
          weak_areas?: string[] | null
          week_end: string
          week_start: string
        }
        Update: {
          average_accuracy?: number | null
          chapters_read?: number | null
          consistency_score?: number | null
          created_at?: string | null
          daily_breakdown?: Json | null
          engagement_score?: number | null
          id?: string
          interactive_sessions?: number | null
          notes_created?: number | null
          overview_summary?: string | null
          quizzes_taken?: number | null
          report_type?: string
          strong_areas?: string[] | null
          subject_breakdown?: Json | null
          top_subjects?: string[] | null
          total_activities?: number | null
          total_study_minutes?: number | null
          user_id?: string
          weak_areas?: string[] | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      users_with_details: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_group_and_add_admin: {
        Args: { admin_id: string; group_name: string }
        Returns: {
          id: string
        }[]
      }
      create_study_group: {
        Args: { p_group_name: string; p_group_system_prompt?: string }
        Returns: Json
      }
      generate_invite_code: { Args: never; Returns: string }
      get_user_chats_and_groups: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          id: string
          last_message_content: string
          last_message_timestamp: string
          name: string
          type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_study_group_by_code: {
        Args: { p_invite_code: string }
        Returns: Json
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
