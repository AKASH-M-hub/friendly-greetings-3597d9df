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
      credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          entry_type: string
          id: string
          metadata: Json | null
          partner_user_id: string | null
          role: string | null
          session_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          entry_type: string
          id?: string
          metadata?: Json | null
          partner_user_id?: string | null
          role?: string | null
          session_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          entry_type?: string
          id?: string
          metadata?: Json | null
          partner_user_id?: string | null
          role?: string | null
          session_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_requests: {
        Row: {
          created_at: string
          expertise_id: string | null
          id: string
          learner_id: string
          message: string | null
          scheduled_at: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expertise_id?: string | null
          id?: string
          learner_id: string
          message?: string | null
          scheduled_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expertise_id?: string | null
          id?: string
          learner_id?: string
          message?: string | null
          scheduled_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_requests_expertise_id_fkey"
            columns: ["expertise_id"]
            isOneToOne: false
            referencedRelation: "teacher_expertise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_rooms: {
        Row: {
          actual_duration_seconds: number | null
          created_at: string
          id: string
          learner_id: string | null
          learner_joined_at: string | null
          room_code: string
          session_ended_at: string | null
          session_id: string
          session_started_at: string | null
          status: string
          teacher_id: string
          teacher_joined_at: string | null
          updated_at: string
        }
        Insert: {
          actual_duration_seconds?: number | null
          created_at?: string
          id?: string
          learner_id?: string | null
          learner_joined_at?: string | null
          room_code: string
          session_ended_at?: string | null
          session_id: string
          session_started_at?: string | null
          status?: string
          teacher_id: string
          teacher_joined_at?: string | null
          updated_at?: string
        }
        Update: {
          actual_duration_seconds?: number | null
          created_at?: string
          id?: string
          learner_id?: string | null
          learner_joined_at?: string | null
          room_code?: string
          session_ended_at?: string | null
          session_id?: string
          session_started_at?: string | null
          status?: string
          teacher_id?: string
          teacher_joined_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rooms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_transactions: {
        Row: {
          completed_at: string | null
          consistency_hash: string | null
          created_at: string
          credits_amount: number
          duration_minutes: number
          error_message: string | null
          id: string
          learner_confirmed: boolean
          learner_confirmed_at: string | null
          learner_id: string
          recovery_data: Json | null
          session_id: string
          status: string
          teacher_confirmed: boolean
          teacher_confirmed_at: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          consistency_hash?: string | null
          created_at?: string
          credits_amount?: number
          duration_minutes?: number
          error_message?: string | null
          id?: string
          learner_confirmed?: boolean
          learner_confirmed_at?: string | null
          learner_id: string
          recovery_data?: Json | null
          session_id: string
          status?: string
          teacher_confirmed?: boolean
          teacher_confirmed_at?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          consistency_hash?: string | null
          created_at?: string
          credits_amount?: number
          duration_minutes?: number
          error_message?: string | null
          id?: string
          learner_confirmed?: boolean
          learner_confirmed_at?: string | null
          learner_id?: string
          recovery_data?: Json | null
          session_id?: string
          status?: string
          teacher_confirmed?: boolean
          teacher_confirmed_at?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_expertise: {
        Row: {
          created_at: string
          domain_tag: Database["public"]["Enums"]["domain_tag"]
          expertise_text: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain_tag?: Database["public"]["Enums"]["domain_tag"]
          expertise_text: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain_tag?: Database["public"]["Enums"]["domain_tag"]
          expertise_text?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teaching_reviews: {
        Row: {
          created_at: string
          experience_rating: number
          feedback: string | null
          id: string
          session_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          experience_rating: number
          feedback?: string | null
          id?: string
          session_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          experience_rating?: number
          feedback?: string | null
          id?: string
          session_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_sessions: {
        Row: {
          actual_minutes: number | null
          created_at: string
          credits_earned: number | null
          ended_at: string | null
          id: string
          learner_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          teacher_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string
          credits_earned?: number | null
          ended_at?: string | null
          id?: string
          learner_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string
          credits_earned?: number | null
          ended_at?: string | null
          id?: string
          learner_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transaction_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          new_status: string
          previous_status: string | null
          transaction_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_status: string
          previous_status?: string | null
          transaction_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_status?: string
          previous_status?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_audit_log_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "session_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credit_balances: {
        Row: {
          created_at: string
          current_balance: number
          held_credits: number
          id: string
          last_ledger_entry_id: string | null
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          held_credits?: number
          id?: string
          last_ledger_entry_id?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          held_credits?: number
          id?: string
          last_ledger_entry_id?: string | null
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      domain_tag:
        | "cs"
        | "math"
        | "design"
        | "science"
        | "language"
        | "music"
        | "business"
        | "other"
      request_status: "pending" | "accepted" | "declined" | "scheduled"
      session_status:
        | "pending"
        | "accepted"
        | "declined"
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
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
      domain_tag: [
        "cs",
        "math",
        "design",
        "science",
        "language",
        "music",
        "business",
        "other",
      ],
      request_status: ["pending", "accepted", "declined", "scheduled"],
      session_status: [
        "pending",
        "accepted",
        "declined",
        "scheduled",
        "active",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
