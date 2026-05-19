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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      restaurant_tables: {
        Row: {
          id: string
          layout_h: number | null
          layout_w: number | null
          layout_x: number | null
          layout_y: number | null
          occupied_at: string | null
          restaurant_id: string
          seats: number
          seat_label: string | null
          status: Database["public"]["Enums"]["table_status"]
          table_label: string | null
          table_number: number
          updated_at: string
        }
        Insert: {
          id?: string
          layout_h?: number | null
          layout_w?: number | null
          layout_x?: number | null
          layout_y?: number | null
          occupied_at?: string | null
          restaurant_id: string
          seats?: number
          seat_label?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          table_label?: string | null
          table_number: number
          updated_at?: string
        }
        Update: {
          id?: string
          layout_h?: number | null
          layout_w?: number | null
          layout_x?: number | null
          layout_y?: number | null
          occupied_at?: string | null
          restaurant_id?: string
          seats?: number
          seat_label?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          table_label?: string | null
          table_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          pos_api_key: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          pos_api_key?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          pos_api_key?: string
        }
        Relationships: []
      }
      table_status_logs: {
        Row: {
          created_at: string
          id: number
          new_status: Database["public"]["Enums"]["table_status"]
          payload: Json | null
          previous_status: Database["public"]["Enums"]["table_status"] | null
          restaurant_id: string
          source: string
          table_id: string
          table_number: number
        }
        Insert: {
          created_at?: string
          id?: number
          new_status: Database["public"]["Enums"]["table_status"]
          payload?: Json | null
          previous_status?: Database["public"]["Enums"]["table_status"] | null
          restaurant_id: string
          source?: string
          table_id: string
          table_number: number
        }
        Update: {
          created_at?: string
          id?: number
          new_status?: Database["public"]["Enums"]["table_status"]
          payload?: Json | null
          previous_status?: Database["public"]["Enums"]["table_status"] | null
          restaurant_id?: string
          source?: string
          table_id?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "table_status_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_status_logs_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_entries: {
        Row: {
          created_at: string
          id: string
          people: number
          phone: string
          preferred_table_id: string | null
          restaurant_id: string
          seating_preference: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          people?: number
          phone: string
          preferred_table_id?: string | null
          restaurant_id: string
          seating_preference?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          people?: number
          phone?: string
          preferred_table_id?: string | null
          restaurant_id?: string
          seating_preference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_entries_preferred_table_id_fkey"
            columns: ["preferred_table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_table_status: {
        Args: {
          p_table_id: string
          p_new_status: Database["public"]["Enums"]["table_status"]
          p_source?: string
          p_payload?: Json | null
        }
        Returns: Json
      }
    }
    Enums: {
      table_status: "EMPTY" | "OCCUPIED" | "CLEANING" | "RESERVED"
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
      table_status: ["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"],
    },
  },
} as const
