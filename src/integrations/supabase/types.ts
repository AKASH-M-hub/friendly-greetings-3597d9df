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
      chat_conversations: {
        Row: {
          context_mode: string | null
          context_session_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_mode?: string | null
          context_session_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_mode?: string | null
          context_session_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_scores: {
        Row: {
          block_reason: string | null
          created_at: string
          energy_compatibility: number | null
          id: string
          intent_compatibility: number | null
          is_blocked: boolean | null
          overall_score: number | null
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          energy_compatibility?: number | null
          id?: string
          intent_compatibility?: number | null
          is_blocked?: boolean | null
          overall_score?: number | null
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          energy_compatibility?: number | null
          id?: string
          intent_compatibility?: number | null
          is_blocked?: boolean | null
          overall_score?: number | null
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      decision_reliability: {
        Row: {
          created_at: string | null
          decision_type: string
          explanation: string | null
          id: string
          reliability_index: number
          uncertainty_flagged: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          decision_type: string
          explanation?: string | null
          id?: string
          reliability_index?: number
          uncertainty_flagged?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          decision_type?: string
          explanation?: string | null
          id?: string
          reliability_index?: number
          uncertainty_flagged?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_events: {
        Row: {
          created_at: string | null
          event_type: string
          hours: number
          id: string
          partner_user_id: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          hours: number
          id?: string
          partner_user_id?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          hours?: number
          id?: string
          partner_user_id?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fairness_tracking: {
        Row: {
          cooldown_until: string | null
          created_at: string | null
          fairness_score: number | null
          give_receive_ratio: number | null
          id: string
          last_nudge_at: string | null
          one_sided_flags: number | null
          total_given_hours: number | null
          total_received_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string | null
          fairness_score?: number | null
          give_receive_ratio?: number | null
          id?: string
          last_nudge_at?: string | null
          one_sided_flags?: number | null
          total_given_hours?: number | null
          total_received_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string | null
          fairness_score?: number | null
          give_receive_ratio?: number | null
          id?: string
          last_nudge_at?: string | null
          one_sided_flags?: number | null
          total_given_hours?: number | null
          total_received_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      historical_accuracy: {
        Row: {
          accuracy_score: number | null
          actual_outcome: string | null
          created_at: string | null
          evaluated_at: string | null
          id: string
          prediction_made: string | null
          recommendation_type: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          created_at?: string | null
          evaluated_at?: string | null
          id?: string
          prediction_made?: string | null
          recommendation_type: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          created_at?: string | null
          evaluated_at?: string | null
          id?: string
          prediction_made?: string | null
          recommendation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seminars: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration: string | null
          id: string
          is_active: boolean | null
          max_learners: number | null
          prerequisites: string | null
          skill_level: string | null
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          max_learners?: number | null
          prerequisites?: string | null
          skill_level?: string | null
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean | null
          max_learners?: number | null
          prerequisites?: string | null
          skill_level?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_adjustments: {
        Row: {
          adjusted_by: string | null
          adjusted_duration_minutes: number
          adjustment_reason: string | null
          created_at: string
          id: string
          original_duration_minutes: number
          session_id: string | null
        }
        Insert: {
          adjusted_by?: string | null
          adjusted_duration_minutes: number
          adjustment_reason?: string | null
          created_at?: string
          id?: string
          original_duration_minutes: number
          session_id?: string | null
        }
        Update: {
          adjusted_by?: string | null
          adjusted_duration_minutes?: number
          adjustment_reason?: string | null
          created_at?: string
          id?: string
          original_duration_minutes?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_adjustments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_intent: {
        Row: {
          created_at: string
          energy_level: string
          id: string
          intent_type: string
          is_active: boolean | null
          preferred_duration_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level: string
          id?: string
          intent_type: string
          is_active?: boolean | null
          preferred_duration_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: string
          id?: string
          intent_type?: string
          is_active?: boolean | null
          preferred_duration_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_requests: {
        Row: {
          created_at: string | null
          id: string
          learner_id: string
          message: string | null
          scheduled_date: string | null
          seminar_id: string
          status: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learner_id: string
          message?: string | null
          scheduled_date?: string | null
          seminar_id: string
          status?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learner_id?: string
          message?: string | null
          scheduled_date?: string | null
          seminar_id?: string
          status?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_requests_seminar_id_fkey"
            columns: ["seminar_id"]
            isOneToOne: false
            referencedRelation: "seminars"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_expertise: {
        Row: {
          created_at: string | null
          domain_tag: string
          expertise_text: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain_tag: string
          expertise_text: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain_tag?: string
          expertise_text?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teaching_reviews: {
        Row: {
          created_at: string | null
          experience_rating: number
          feedback: string | null
          id: string
          learner_id: string | null
          session_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          experience_rating: number
          feedback?: string | null
          id?: string
          learner_id?: string | null
          session_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          experience_rating?: number
          feedback?: string | null
          id?: string
          learner_id?: string | null
          session_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_sessions: {
        Row: {
          actual_minutes: number | null
          created_at: string | null
          credits_earned: number | null
          ended_at: string | null
          id: string
          learner_id: string | null
          started_at: string | null
          status: string | null
          teacher_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string | null
          credits_earned?: number | null
          ended_at?: string | null
          id?: string
          learner_id?: string | null
          started_at?: string | null
          status?: string | null
          teacher_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string | null
          credits_earned?: number | null
          ended_at?: string | null
          id?: string
          learner_id?: string | null
          started_at?: string | null
          status?: string | null
          teacher_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          confidence_percentage: number
          created_at: string | null
          data_consistency_score: number | null
          data_freshness_days: number | null
          data_source: string
          id: string
          last_calculated: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_percentage?: number
          created_at?: string | null
          data_consistency_score?: number | null
          data_freshness_days?: number | null
          data_source: string
          id?: string
          last_calculated?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_percentage?: number
          created_at?: string | null
          data_consistency_score?: number | null
          data_freshness_days?: number | null
          data_source?: string
          id?: string
          last_calculated?: string | null
          updated_at?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
