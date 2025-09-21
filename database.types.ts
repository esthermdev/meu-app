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
    PostgrestVersion: "12.2.0 (ec89f6b)"
  }
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
          anon_device_id: string | null
          created_at: string | null
          driver: string | null
          from_field_number: number | null
          from_location: Database["public"]["Enums"]["location_type"]
          id: number
          passenger_count: number | null
          requester: string | null
          requester_id: string | null
          requester_token: string | null
          special_request: string | null
          status: Database["public"]["Enums"]["request_status"]
          to_field_number: number | null
          to_location: Database["public"]["Enums"]["location_type"]
          updated_at: string | null
        }
        Insert: {
          anon_device_id?: string | null
          created_at?: string | null
          driver?: string | null
          from_field_number?: number | null
          from_location: Database["public"]["Enums"]["location_type"]
          id?: number
          passenger_count?: number | null
          requester?: string | null
          requester_id?: string | null
          requester_token?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_field_number?: number | null
          to_location: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Update: {
          anon_device_id?: string | null
          created_at?: string | null
          driver?: string | null
          from_field_number?: number | null
          from_location?: Database["public"]["Enums"]["location_type"]
          id?: number
          passenger_count?: number | null
          requester?: string | null
          requester_id?: string | null
          requester_token?: string | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          to_field_number?: number | null
          to_location?: Database["public"]["Enums"]["location_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_requests_anon_device_id_fkey"
            columns: ["anon_device_id"]
            isOneToOne: false
            referencedRelation: "anonymous_tokens"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "cart_requests_driver_fkey"
            columns: ["driver"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_requests_from_field_number_fkey"
            columns: ["from_field_number"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          screenshots: string[] | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          screenshots?: string[] | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          screenshots?: string[] | null
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
          division_id: number | null
          field_id: number | null
          gametype_id: number | null
          id: number
          pool_id: number | null
          round_id: number | null
          team1_id: number | null
          team2_id: number | null
        }
        Insert: {
          datetime_id?: number | null
          division_id?: number | null
          field_id?: number | null
          gametype_id?: number | null
          id?: number
          pool_id?: number | null
          round_id?: number | null
          team1_id?: number | null
          team2_id?: number | null
        }
        Update: {
          datetime_id?: number | null
          division_id?: number | null
          field_id?: number | null
          gametype_id?: number | null
          id?: number
          pool_id?: number | null
          round_id?: number | null
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
            foreignKeyName: "games_gametype_id_fkey"
            columns: ["gametype_id"]
            isOneToOne: false
            referencedRelation: "gametypes"
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
      gametypes: {
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
            foreignKeyName: "gametypes_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
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
          team_name: string | null
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
          team_name?: string | null
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
          team_name?: string | null
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
          device_id: string | null
          id: number
          notification_id: number | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          device_id?: string | null
          id?: number
          notification_id?: number | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          device_id?: string | null
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
          division_id: number | null
          id: number
          name: string
        }
        Insert: {
          division_id?: number | null
          id?: number
          name: string
        }
        Update: {
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
            foreignKeyName: "rankings_team_id_fkey"
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
        }
        Insert: {
          id?: number
          place?: number | null
          stage: string
        }
        Update: {
          id?: number
          place?: number | null
          stage?: string
        }
        Relationships: []
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
            referencedRelation: "full_gameview"
            referencedColumns: ["id"]
          },
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
          id?: never
          name: string
          pool_id?: number | null
          seed?: number | null
        }
        Update: {
          avatar_uri?: string | null
          division_id?: number | null
          id?: never
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
          email: string | null
          id: number
          role: string | null
        }
        Insert: {
          avatar_uri?: string | null
          badge?: string | null
          email?: string | null
          id?: number
          role?: string | null
        }
        Update: {
          avatar_uri?: string | null
          badge?: string | null
          email?: string | null
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
      full_gameview: {
        Row: {
          date: string | null
          division: string | null
          division_id: number | null
          field: string | null
          gametype: string | null
          id: number | null
          pool_id: number | null
          stage: string | null
          team1_name: string | null
          team1_score: number | null
          team2_name: string | null
          team2_score: number | null
          time: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
      full_ranking: {
        Row: {
          id: number | null
          losses: number | null
          name: string | null
          pool_id: number | null
          pool_rank: number | null
          team_id: number | null
          wins: number | null
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
            foreignKeyName: "rankings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      full_scores: {
        Row: {
          id: number | null
          is_finished: boolean | null
          pool_id: number | null
          team1_name: string | null
          team1_score: number | null
          team2_name: string | null
          team2_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_tiebreakers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      client_update_rankings_and_tiebreakers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_deletion_tokens_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_anonymous_token: {
        Args: { p_device_id: string; p_token: string }
        Returns: undefined
      }
      reset_bracket_scores: {
        Args: { round_id_param: number }
        Returns: undefined
      }
      reset_pool_scores: {
        Args: { pool_id_param: number }
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
        | "Lot 1 (Grass)"
        | "Lot 2 (Pavement)"
      request_status: "pending" | "confirmed" | "resolved" | "expired"
      request_type: "medical" | "water" | "transport"
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
      division: ["X", "O", "W", "MU", "MM", "ML", "WU", "WL"],
      game_id: [
        "PP",
        "CP1",
        "CP2",
        "CP3",
        "CP4",
        "CP5",
        "CP6",
        "Q1",
        "Q2",
        "Q3",
        "Q4",
        "S1",
        "S2",
        "F",
        "3F",
        "5S1",
        "5S2",
        "5F",
        "7F",
        "9Q1",
        "9Q2",
        "9Q3",
        "9Q4",
        "9S1",
        "9S2",
        "9F",
        "11F",
        "13S1",
        "13S2",
        "13F",
        "15F",
        "9RR",
      ],
      location_type: [
        "Field",
        "Entrance",
        "Tourney Central",
        "Lot 1 (Grass)",
        "Lot 2 (Pavement)",
      ],
      request_status: ["pending", "confirmed", "resolved", "expired"],
      request_type: ["medical", "water", "transport"],
    },
  },
} as const
