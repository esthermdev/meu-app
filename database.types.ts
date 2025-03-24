export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      anonymous_tokens: {
        Row: {
          created_at: string | null
          device_id: string
          id: number
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: number
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: number
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_requests: {
        Row: {
          created_at: string | null
          driver: string | null
          from_field_number: number | null
          from_location: Database["public"]["Enums"]["location_type"]
          id: number
          passenger_count: number | null
          requester_token: string | null
          special_request: string | null
          status: Database["public"]["Enums"]["request_status"]
          to_field_number: number | null
          to_location: Database["public"]["Enums"]["location_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver?: string | null
          from_field_number?: number | null
          from_location: Database["public"]["Enums"]["location_type"]
          id?: number
          passenger_count?: number | null
          requester_token?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_field_number?: number | null
          to_location: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver?: string | null
          from_field_number?: number | null
          from_location?: Database["public"]["Enums"]["location_type"]
          id?: number
          passenger_count?: number | null
          requester_token?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_field_number?: number | null
          to_location?: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_requests_from_field_number_fkey"
            columns: ["from_field_number"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_requests_to_field_number_fkey"
            columns: ["to_field_number"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      datetime: {
        Row: {
          date: string | null
          id: number
          time: string
        }
        Insert: {
          date?: string | null
          id?: number
          time: string
        }
        Update: {
          date?: string | null
          id?: number
          time?: string
        }
        Relationships: []
      }
      deletion_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          code: string
          color: string
          color_light: string | null
          display_order: number | null
          icon: string | null
          id: number
          title: string
        }
        Insert: {
          code: string
          color: string
          color_light?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          title: string
        }
        Update: {
          code?: string
          color?: string
          color_light?: string | null
          display_order?: number | null
          icon?: string | null
          id?: number
          title?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: string | null
          id: number
          question: string
        }
        Insert: {
          answer?: string | null
          id?: number
          question: string
        }
        Update: {
          answer?: string | null
          id?: number
          question?: string
        }
        Relationships: []
      }
      favorite_teams: {
        Row: {
          created_at: string
          id: number
          team_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          team_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          team_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: number
          message: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          id: number
          location: string | null
          name: string
        }
        Insert: {
          id?: number
          location?: string | null
          name: string
        }
        Update: {
          id?: number
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          datetime_id: number | null
          division: Database["public"]["Enums"]["division"] | null
          division_id: number | null
          field_id: number | null
          id: number
          name: Database["public"]["Enums"]["game_id"] | null
          pool_id: number | null
          round_id: number | null
          schedule_id: number | null
          team1_id: number | null
          team2_id: number | null
        }
        Insert: {
          datetime_id?: number | null
          division?: Database["public"]["Enums"]["division"] | null
          division_id?: number | null
          field_id?: number | null
          id?: number
          name?: Database["public"]["Enums"]["game_id"] | null
          pool_id?: number | null
          round_id?: number | null
          schedule_id?: number | null
          team1_id?: number | null
          team2_id?: number | null
        }
        Update: {
          datetime_id?: number | null
          division?: Database["public"]["Enums"]["division"] | null
          division_id?: number | null
          field_id?: number | null
          id?: number
          name?: Database["public"]["Enums"]["game_id"] | null
          pool_id?: number | null
          round_id?: number | null
          schedule_id?: number | null
          team1_id?: number | null
          team2_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_datetime_id_fkey"
            columns: ["datetime_id"]
            isOneToOne: false
            referencedRelation: "datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_requests: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description_of_emergency: string | null
          field_number: number | null
          id: number
          priority_level: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          trainer: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description_of_emergency?: string | null
          field_number?: number | null
          id?: number
          priority_level?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          trainer?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description_of_emergency?: string | null
          field_number?: number | null
          id?: number
          priority_level?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          trainer?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_requests_field_number_fkey"
            columns: ["field_number"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_read_status: {
        Row: {
          id: number
          notification_id: number | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          notification_id?: number | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          notification_id?: number | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_read_status_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pools: {
        Row: {
          division: Database["public"]["Enums"]["division"] | null
          division_id: number | null
          id: number
          name: string
        }
        Insert: {
          division?: Database["public"]["Enums"]["division"] | null
          division_id?: number | null
          id?: number
          name: string
        }
        Update: {
          division?: Database["public"]["Enums"]["division"] | null
          division_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_available: boolean | null
          is_driver: boolean | null
          is_logged_in: boolean | null
          is_medical_staff: boolean | null
          is_volunteer: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          is_available?: boolean | null
          is_driver?: boolean | null
          is_logged_in?: boolean | null
          is_medical_staff?: boolean | null
          is_volunteer?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_available?: boolean | null
          is_driver?: boolean | null
          is_logged_in?: boolean | null
          is_medical_staff?: boolean | null
          is_volunteer?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rankings: {
        Row: {
          id: number
          losses: number | null
          pool_rank: number | null
          team_id: number
          wins: number | null
        }
        Insert: {
          id?: number
          losses?: number | null
          pool_rank?: number | null
          team_id: number
          wins?: number | null
        }
        Update: {
          id?: number
          losses?: number | null
          pool_rank?: number | null
          team_id?: number
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          category: string | null
          discount: string | null
          id: number
          name: string
          website: string | null
        }
        Insert: {
          category?: string | null
          discount?: string | null
          id?: number
          name: string
          website?: string | null
        }
        Update: {
          category?: string | null
          discount?: string | null
          id?: number
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          id: number
          place: number | null
          stage: string
          title: string | null
        }
        Insert: {
          id?: number
          place?: number | null
          stage: string
          title?: string | null
        }
        Update: {
          id?: number
          place?: number | null
          stage?: string
          title?: string | null
        }
        Relationships: []
      }
      schedule_options: {
        Row: {
          bg_color: string | null
          display_order: number | null
          division_id: number | null
          icon: string | null
          icon_color: string | null
          id: number
          route: string
          title: string
        }
        Insert: {
          bg_color?: string | null
          display_order?: number | null
          division_id?: number | null
          icon?: string | null
          icon_color?: string | null
          id?: number
          route: string
          title: string
        }
        Update: {
          bg_color?: string | null
          display_order?: number | null
          division_id?: number | null
          icon?: string | null
          icon_color?: string | null
          id?: number
          route?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_options_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          game_id: number | null
          id: number
          is_finished: boolean | null
          round_id: number | null
          team1_score: number
          team2_score: number
        }
        Insert: {
          game_id?: number | null
          id?: number
          is_finished?: boolean | null
          round_id?: number | null
          team1_score: number
          team2_score: number
        }
        Update: {
          game_id?: number | null
          id?: number
          is_finished?: boolean | null
          round_id?: number | null
          team1_score?: number
          team2_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_uri: string | null
          division_id: number | null
          id: number
          name: string
          pool_id: number | null
          seed: number | null
        }
        Insert: {
          avatar_uri?: string | null
          division_id?: number | null
          id: number
          name: string
          pool_id?: number | null
          seed?: number | null
        }
        Update: {
          avatar_uri?: string | null
          division_id?: number | null
          id?: number
          name?: string
          pool_id?: number | null
          seed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pool"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          avatar_url: string | null
          id: number
          name: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: number
          name?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: number
          name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          avatar_uri: string | null
          badge: string | null
          id: number
          role: string | null
        }
        Insert: {
          avatar_uri?: string | null
          badge?: string | null
          id?: number
          role?: string | null
        }
        Update: {
          avatar_uri?: string | null
          badge?: string | null
          id?: number
          role?: string | null
        }
        Relationships: []
      }
      water_requests: {
        Row: {
          created_at: string | null
          field_number: number | null
          id: number
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
          volunteer: string | null
        }
        Insert: {
          created_at?: string | null
          field_number?: number | null
          id?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          volunteer?: string | null
        }
        Update: {
          created_at?: string | null
          field_number?: number | null
          id?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
          volunteer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_refill_field_number_fkey"
            columns: ["field_number"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_tiebreakers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_deletion_tokens_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_pool_play_games: {
        Args: {
          division_code: string
          pool_id_var: number
        }
        Returns: undefined
      }
      generate_pool_play_games_3teams: {
        Args: {
          division_code: string
          pool_id_var: number
        }
        Returns: undefined
      }
      handle_anonymous_token: {
        Args: {
          p_device_id: string
          p_token: string
        }
        Returns: undefined
      }
      reset_bracket_scores: {
        Args: {
          round_id_param: number
        }
        Returns: undefined
      }
      reset_pool_scores: {
        Args: {
          pool_id_param: number
        }
        Returns: undefined
      }
      update_pool_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      division: "X" | "O" | "W" | "MU" | "MM" | "ML" | "WU" | "WL"
      game_id:
        | "PP"
        | "CP1"
        | "CP2"
        | "CP3"
        | "CP4"
        | "CP5"
        | "CP6"
        | "Q1"
        | "Q2"
        | "Q3"
        | "Q4"
        | "S1"
        | "S2"
        | "F"
        | "3F"
        | "5S1"
        | "5S2"
        | "5F"
        | "7F"
        | "9Q1"
        | "9Q2"
        | "9Q3"
        | "9Q4"
        | "9S1"
        | "9S2"
        | "9F"
        | "11F"
        | "13S1"
        | "13S2"
        | "13F"
        | "15F"
        | "9RR"
      location_type:
        | "Field"
        | "Entrance"
        | "Tourney Central"
        | "Lot 1"
        | "Lot 2"
      request_status: "pending" | "confirmed" | "resolved" | "expired"
      request_type: "medical" | "water" | "transport"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
