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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      coupon_items: {
        Row: {
          coupon_id: string
          discount_rate: number
          final_price: number
          id: string
          is_gift: boolean
          menu_name: string
          original_price: number
          quantity: number
        }
        Insert: {
          coupon_id: string
          discount_rate: number
          final_price: number
          id?: string
          is_gift?: boolean
          menu_name: string
          original_price: number
          quantity: number
        }
        Update: {
          coupon_id?: string
          discount_rate?: number
          final_price?: number
          id?: string
          is_gift?: boolean
          menu_name?: string
          original_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          activated_at: string | null
          created_at: string | null
          event_title: string
          expected_visit_time: string | null
          expired_time: string
          happy_hour_end_time: string
          happy_hour_start_time: string
          id: string
          status: Database["public"]["Enums"]["coupon_status"]
          store_id: string
          updated_at: string | null
          user_id: string
          weekdays: string[]
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          event_title: string
          expected_visit_time?: string | null
          expired_time?: string
          happy_hour_end_time: string
          happy_hour_start_time: string
          id?: string
          status?: Database["public"]["Enums"]["coupon_status"]
          store_id: string
          updated_at?: string | null
          user_id: string
          weekdays: string[]
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          event_title?: string
          expected_visit_time?: string | null
          expired_time?: string
          happy_hour_end_time?: string
          happy_hour_start_time?: string
          id?: string
          status?: Database["public"]["Enums"]["coupon_status"]
          store_id?: string
          updated_at?: string | null
          user_id?: string
          weekdays?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reservations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          created_at: string
          discount_rate: number
          event_id: string
          final_price: number
          id: string
          is_active: boolean
          menu_id: string
          remaining: number | null
        }
        Insert: {
          created_at?: string
          discount_rate: number
          event_id: string
          final_price: number
          id?: string
          is_active?: boolean
          menu_id: string
          remaining?: number | null
        }
        Update: {
          created_at?: string
          discount_rate?: number
          event_id?: string
          final_price?: number
          id?: string
          is_active?: boolean
          menu_id?: string
          remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discounts_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "store_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          happy_hour_end_time: string
          happy_hour_start_time: string
          id: string
          is_active: boolean
          max_discount_rate: number | null
          start_date: string
          store_id: string
          title: string
          weekdays: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          happy_hour_end_time: string
          happy_hour_start_time: string
          id?: string
          is_active?: boolean
          max_discount_rate?: number | null
          start_date: string
          store_id: string
          title?: string
          weekdays: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          happy_hour_end_time?: string
          happy_hour_start_time?: string
          id?: string
          is_active?: boolean
          max_discount_rate?: number | null
          start_date?: string
          store_id?: string
          title?: string
          weekdays?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_groups: {
        Row: {
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_gift_option_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_options: {
        Row: {
          created_at: string
          gift_group_id: string
          id: string
          is_active: boolean
          menu_id: string
          remaining: number | null
        }
        Insert: {
          created_at?: string
          gift_group_id: string
          id?: string
          is_active?: boolean
          menu_id: string
          remaining?: number | null
        }
        Update: {
          created_at?: string
          gift_group_id?: string
          id?: string
          is_active?: boolean
          menu_id?: string
          remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_gift_options_group_id_fkey"
            columns: ["gift_group_id"]
            isOneToOne: false
            referencedRelation: "gift_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_gift_options_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "store_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      store_menus: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          store_id: string
          thumbnail: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          store_id: string
          thumbnail?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          store_id?: string
          thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          lat: number
          lng: number
          menu_category: string[] | null
          name: string
          owner_id: string
          partnership: string | null
          phone: string
          store_thumbnail: string
        }
        Insert: {
          address: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat: number
          lng: number
          menu_category?: string[] | null
          name: string
          owner_id: string
          partnership?: string | null
          phone: string
          store_thumbnail: string
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number
          lng?: number
          menu_category?: string[] | null
          name?: string
          owner_id?: string
          partnership?: string | null
          phone?: string
          store_thumbnail?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          marketing_consent: boolean
          name: string
          phone_number: string
          provider: string | null
          provider_id: string | null
          role: Database["public"]["Enums"]["role"]
          total_bookings: number
          total_savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          marketing_consent?: boolean
          name: string
          phone_number: string
          provider?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["role"]
          total_bookings?: number
          total_savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          marketing_consent?: boolean
          name?: string
          phone_number?: string
          provider?: string | null
          provider_id?: string | null
          role?: Database["public"]["Enums"]["role"]
          total_bookings?: number
          total_savings?: number
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
      activate_coupon: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      cancel_coupon: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      create_coupon_with_items: {
        Args: { payload: Json }
        Returns: string
      }
      create_event_with_discounts_and_gifts: {
        Args: { payload: Json }
        Returns: Json
      }
      event_with_discounts_and_gifts: {
        Args: { p_event_id: string; p_only_active?: boolean }
        Returns: Json
      }
      finalize_redemption: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      redeem_coupon: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      store_with_events_and_menus: {
        Args: { p_only_active_events?: boolean; p_store_id: string }
        Returns: Json
      }
      stores_with_events: {
        Args: { only_active_events?: boolean }
        Returns: Json
      }
      update_event_with_discounts_and_gifts: {
        Args: { payload: Json }
        Returns: Json
      }
    }
    Enums: {
      coupon_status:
        | "issued"
        | "redeemed"
        | "expired"
        | "cancelled"
        | "activating"
      role: "customer" | "store_owner" | "admin"
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
      coupon_status: [
        "issued",
        "redeemed",
        "expired",
        "cancelled",
        "activating",
      ],
      role: ["customer", "store_owner", "admin"],
    },
  },
} as const
