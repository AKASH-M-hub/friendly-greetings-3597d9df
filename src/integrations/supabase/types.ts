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
      mcq_questions: {
        Row: {
          id: string
          session_id: string | null
          topic: string
          skill_level: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          explanation: string | null
          difficulty_score: number
          times_answered: number
          times_correct: number
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          session_id?: string | null
          topic: string
          skill_level: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          explanation?: string | null
          difficulty_score?: number
          times_answered?: number
          times_correct?: number
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          session_id?: string | null
          topic?: string
          skill_level?: string
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: string
          explanation?: string | null
          difficulty_score?: number
          times_answered?: number
          times_correct?: number
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      mcq_attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_option: string
          is_correct: boolean
          time_taken_seconds: number | null
          attempted_at: string
          credits_earned: number
          ip_address: string | null
          session_fingerprint: string | null
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          selected_option: string
          is_correct: boolean
          time_taken_seconds?: number | null
          attempted_at?: string
          credits_earned?: number
          ip_address?: string | null
          session_fingerprint?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          selected_option?: string
          is_correct?: boolean
          time_taken_seconds?: number | null
          attempted_at?: string
          credits_earned?: number
          ip_address?: string | null
          session_fingerprint?: string | null
        }
        Relationships: []
      }
      mcq_daily_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          questions_attempted: number
          questions_correct: number
          credits_earned_today: number
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          questions_attempted?: number
          questions_correct?: number
          credits_earned_today?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          questions_attempted?: number
          questions_correct?: number
          credits_earned_today?: number
        }
        Relationships: []
      }
      knowledge_progression: {
        Row: {
          id: string
          user_id: string
          topic: string
          skill_confidence_level: number
          questions_answered: number
          questions_correct: number
          mastery_score: number
          last_practiced_at: string | null
          teaching_readiness: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          skill_confidence_level?: number
          questions_answered?: number
          questions_correct?: number
          mastery_score?: number
          last_practiced_at?: string | null
          teaching_readiness?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          skill_confidence_level?: number
          questions_answered?: number
          questions_correct?: number
          mastery_score?: number
          last_practiced_at?: string | null
          teaching_readiness?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recovery_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: Database["public"]["Enums"]["recovery_activity_type"]
          credits_earned: number
          description: string | null
          verification_status: string
          verified_by: string | null
          verified_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: Database["public"]["Enums"]["recovery_activity_type"]
          credits_earned: number
          description?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: Database["public"]["Enums"]["recovery_activity_type"]
          credits_earned?: number
          description?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      institutional_support_fund: {
        Row: {
          id: string
          recipient_user_id: string
          credits_granted: number
          reason: string
          granted_by: string
          grant_source: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_user_id: string
          credits_granted: number
          reason: string
          granted_by: string
          grant_source?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_user_id?: string
          credits_granted?: number
          reason?: string
          granted_by?: string
          grant_source?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_eligible_mcq_questions: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          topic: string
          skill_level: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          difficulty_score: number
        }[]
      }
      record_mcq_attempt: {
        Args: {
          p_user_id: string
          p_question_id: string
          p_selected_option: string
          p_time_taken_seconds: number
          p_ip_address?: string | null
          p_session_fingerprint?: string | null
        }
        Returns: Json
      }
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
      recovery_activity_type:
        | "peer_teaching"
        | "micro_contribution"
        | "assisted_teaching"
        | "institutional_support"
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
      recovery_activity_type: [
        "peer_teaching",
        "micro_contribution",
        "assisted_teaching",
        "institutional_support",
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
