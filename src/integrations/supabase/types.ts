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
      deposit_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string
          deposit_amount: number
          id: string
          interest_rate: number | null
          lease_id: string
          property_owner_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          deposit_amount: number
          id?: string
          interest_rate?: number | null
          lease_id: string
          property_owner_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          deposit_amount?: number
          id?: string
          interest_rate?: number | null
          lease_id?: string
          property_owner_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_accounts_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_agreements: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          lease_terms: string | null
          monthly_rent: number
          property_id: string
          property_owner_id: string
          start_date: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          lease_terms?: string | null
          monthly_rent: number
          property_id: string
          property_owner_id: string
          start_date: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          lease_terms?: string | null
          monthly_rent?: number
          property_id?: string
          property_owner_id?: string
          start_date?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          analysis_id: string | null
          created_at: string
          currency: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          payment_type: string
          updated_at: string
          user_id: string
          vipps_order_id: string | null
        }
        Insert: {
          amount: number
          analysis_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_type: string
          updated_at?: string
          user_id: string
          vipps_order_id?: string | null
        }
        Update: {
          amount?: number
          analysis_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string
          updated_at?: string
          user_id?: string
          vipps_order_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bedrooms: number | null
          city: string | null
          created_at: string
          current_value: number | null
          id: string
          interest_rate: number | null
          last_valuation_date: string | null
          loan_amount: number | null
          loan_duration_years: number | null
          owner_id: string
          postal_code: string | null
          property_type: string | null
          purchase_date: string | null
          purchase_price: number | null
          size_sqm: number | null
          updated_at: string
        }
        Insert: {
          address: string
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          interest_rate?: number | null
          last_valuation_date?: string | null
          loan_amount?: number | null
          loan_duration_years?: number | null
          owner_id: string
          postal_code?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          size_sqm?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          bedrooms?: number | null
          city?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          interest_rate?: number | null
          last_valuation_date?: string | null
          loan_amount?: number | null
          loan_duration_years?: number | null
          owner_id?: string
          postal_code?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          size_sqm?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          national_id: string | null
          phone: string | null
          property_owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          national_id?: string | null
          phone?: string | null
          property_owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          national_id?: string | null
          phone?: string | null
          property_owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transfer_protocols: {
        Row: {
          condition_notes: string | null
          created_at: string
          damages: string | null
          id: string
          lease_id: string
          photos_urls: string[] | null
          property_owner_id: string
          protocol_date: string
          protocol_type: string
          repairs_needed: string | null
          signatures_completed: boolean | null
          updated_at: string
        }
        Insert: {
          condition_notes?: string | null
          created_at?: string
          damages?: string | null
          id?: string
          lease_id: string
          photos_urls?: string[] | null
          property_owner_id: string
          protocol_date: string
          protocol_type: string
          repairs_needed?: string | null
          signatures_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          condition_notes?: string | null
          created_at?: string
          damages?: string | null
          id?: string
          lease_id?: string
          photos_urls?: string[] | null
          property_owner_id?: string
          protocol_date?: string
          protocol_type?: string
          repairs_needed?: string | null
          signatures_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_protocols_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
        ]
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
