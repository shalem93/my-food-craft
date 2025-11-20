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
      chef_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          lat: number | null
          lng: number | null
          onboarding_complete: boolean
          pickup_address: string | null
          pickup_business_name: string | null
          pickup_phone: string | null
          stripe_account_id: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          onboarding_complete?: boolean
          pickup_address?: string | null
          pickup_business_name?: string | null
          pickup_phone?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          onboarding_complete?: boolean
          pickup_address?: string | null
          pickup_business_name?: string | null
          pickup_phone?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          chef_user_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          chef_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          chef_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          chef_user_id: string | null
          created_at: string
          currency: string
          delivery_fee_cents: number | null
          delivery_service: string | null
          delivery_status: string | null
          delivery_tracking_url: string | null
          dropoff_address: string | null
          dropoff_business_name: string | null
          dropoff_instructions: string | null
          dropoff_phone: string | null
          external_delivery_id: string | null
          id: string
          pickup_address: string | null
          pickup_business_name: string | null
          pickup_instructions: string | null
          pickup_phone: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          chef_user_id?: string | null
          created_at?: string
          currency?: string
          delivery_fee_cents?: number | null
          delivery_service?: string | null
          delivery_status?: string | null
          delivery_tracking_url?: string | null
          dropoff_address?: string | null
          dropoff_business_name?: string | null
          dropoff_instructions?: string | null
          dropoff_phone?: string | null
          external_delivery_id?: string | null
          id?: string
          pickup_address?: string | null
          pickup_business_name?: string | null
          pickup_instructions?: string | null
          pickup_phone?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          chef_user_id?: string | null
          created_at?: string
          currency?: string
          delivery_fee_cents?: number | null
          delivery_service?: string | null
          delivery_status?: string | null
          delivery_tracking_url?: string | null
          dropoff_address?: string | null
          dropoff_business_name?: string | null
          dropoff_instructions?: string | null
          dropoff_phone?: string | null
          external_delivery_id?: string | null
          id?: string
          pickup_address?: string | null
          pickup_business_name?: string | null
          pickup_instructions?: string | null
          pickup_phone?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_address: string | null
          default_city: string | null
          default_zip: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          default_zip?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          default_zip?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          chef_user_id: string | null
          comment: string | null
          created_at: string
          external_chef_slug: string | null
          external_menu_item_id: string | null
          id: string
          looks: number
          order_id: string | null
          price: number
          taste: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chef_user_id?: string | null
          comment?: string | null
          created_at?: string
          external_chef_slug?: string | null
          external_menu_item_id?: string | null
          id?: string
          looks: number
          order_id?: string | null
          price: number
          taste: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chef_user_id?: string | null
          comment?: string | null
          created_at?: string
          external_chef_slug?: string | null
          external_menu_item_id?: string | null
          id?: string
          looks?: number
          order_id?: string | null
          price?: number
          taste?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label: string
          phone: string
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          updated_at?: string
          user_id?: string
          zip?: string
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
      chef_ratings: {
        Row: {
          avg_looks: number | null
          avg_overall: number | null
          avg_price: number | null
          avg_taste: number | null
          chef_user_id: string | null
          review_count: number | null
        }
        Relationships: []
      }
      public_chef_info: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          onboarding_complete: boolean | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          onboarding_complete?: boolean | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          onboarding_complete?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      app_role: "chef" | "customer"
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
      app_role: ["chef", "customer"],
    },
  },
} as const
