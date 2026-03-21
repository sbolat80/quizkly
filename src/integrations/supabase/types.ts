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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answered_at: string | null
          game_id: string | null
          id: string
          is_correct: boolean | null
          player_id: string | null
          points_awarded: number | null
          question_id: string | null
          response_time_ms: number | null
          session_id: string
          submitted_answer: string
        }
        Insert: {
          answered_at?: string | null
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          points_awarded?: number | null
          question_id?: string | null
          response_time_ms?: number | null
          session_id: string
          submitted_answer: string
        }
        Update: {
          answered_at?: string | null
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          points_awarded?: number | null
          question_id?: string | null
          response_time_ms?: number | null
          session_id?: string
          submitted_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_questions: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          question_id: string | null
          question_order: number
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          question_id?: string | null
          question_order: number
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          question_id?: string | null
          question_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_settings: {
        Row: {
          category_distribution: Json | null
          created_at: string | null
          game_id: string | null
          id: string
          question_time_seconds: number | null
          questions_per_game: number | null
        }
        Insert: {
          category_distribution?: Json | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          question_time_seconds?: number | null
          questions_per_game?: number | null
        }
        Update: {
          category_distribution?: Json | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          question_time_seconds?: number | null
          questions_per_game?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_settings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          current_question_index: number | null
          finished_at: string | null
          game_code: string
          host_player_id: string | null
          id: string
          language: string | null
          phase: string | null
          phase_started_at: string | null
          started_at: string | null
          status: string
          total_questions: number | null
        }
        Insert: {
          created_at?: string | null
          current_question_index?: number | null
          finished_at?: string | null
          game_code: string
          host_player_id?: string | null
          id?: string
          language?: string | null
          phase?: string | null
          phase_started_at?: string | null
          started_at?: string | null
          status?: string
          total_questions?: number | null
        }
        Update: {
          created_at?: string | null
          current_question_index?: number | null
          finished_at?: string | null
          game_code?: string
          host_player_id?: string | null
          id?: string
          language?: string | null
          phase?: string | null
          phase_started_at?: string | null
          started_at?: string | null
          status?: string
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_host_player_fk"
            columns: ["host_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_id: number | null
          game_id: string | null
          id: string
          is_active: boolean | null
          is_host: boolean | null
          joined_at: string | null
          nickname: string
          score: number | null
          session_id: string
        }
        Insert: {
          avatar_id?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          nickname: string
          score?: number | null
          session_id: string
        }
        Update: {
          avatar_id?: number | null
          game_id?: string | null
          id?: string
          is_active?: boolean | null
          is_host?: boolean | null
          joined_at?: string | null
          nickname?: string
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          is_active: boolean | null
          language: string | null
          options: Json
          question_text: string
          type: string | null
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          options: Json
          question_text: string
          type?: string | null
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          options?: Json
          question_text?: string
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_game_code: { Args: { code_length?: number }; Returns: string }
      increment_player_score: {
        Args: { p_player_id: string; p_points: number }
        Returns: undefined
      }
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
