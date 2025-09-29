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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      building_projects: {
        Row: {
          calculation_id: string | null
          created_at: string
          floor_plans: Json
          id: string
          placed_items: Json
          project_name: string
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_id?: string | null
          created_at?: string
          floor_plans?: Json
          id?: string
          placed_items?: Json
          project_name: string
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_id?: string | null
          created_at?: string
          floor_plans?: Json
          id?: string
          placed_items?: Json
          project_name?: string
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_projects_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "calculation_history"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_history: {
        Row: {
          calculation_data: Json
          calculation_name: string | null
          coordinates: number[] | null
          created_at: string
          finn_code: string | null
          id: string
          property_address: string | null
          results_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_data: Json
          calculation_name?: string | null
          coordinates?: number[] | null
          created_at?: string
          finn_code?: string | null
          id?: string
          property_address?: string | null
          results_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_data?: Json
          calculation_name?: string | null
          coordinates?: number[] | null
          created_at?: string
          finn_code?: string | null
          id?: string
          property_address?: string | null
          results_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      finn_property_cache: {
        Row: {
          created_at: string
          expires_at: string
          extracted_at: string
          finn_code: string
          id: string
          property_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          extracted_at?: string
          finn_code: string
          id?: string
          property_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          extracted_at?: string
          finn_code?: string
          id?: string
          property_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      lease_agreements: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          lease_terms: string | null
          monthly_rent: number
          parking_included: boolean | null
          pets_allowed: boolean | null
          property_id: string
          property_owner_id: string
          smoking_allowed: boolean | null
          start_date: string
          status: string | null
          tenant_id: string
          updated_at: string
          utilities_included: boolean | null
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          lease_terms?: string | null
          monthly_rent: number
          parking_included?: boolean | null
          pets_allowed?: boolean | null
          property_id: string
          property_owner_id: string
          smoking_allowed?: boolean | null
          start_date: string
          status?: string | null
          tenant_id: string
          updated_at?: string
          utilities_included?: boolean | null
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          lease_terms?: string | null
          monthly_rent?: number
          parking_included?: boolean | null
          pets_allowed?: boolean | null
          property_id?: string
          property_owner_id?: string
          smoking_allowed?: boolean | null
          start_date?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
          utilities_included?: boolean | null
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
          credits: number | null
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
          credits?: number | null
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
          credits?: number | null
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
          coordinates: number[] | null
          created_at: string
          current_value: number | null
          id: string
          image_url: string | null
          interest_rate: number | null
          last_valuation_date: string | null
          loan_amount: number | null
          loan_duration_years: number | null
          monthly_rent: number | null
          owner_id: string
          postal_code: string | null
          primary_residence: boolean | null
          property_type: string | null
          purchase_date: string | null
          purchase_price: number | null
          show_in_rental: boolean | null
          size_sqm: number | null
          updated_at: string
        }
        Insert: {
          address: string
          bedrooms?: number | null
          city?: string | null
          coordinates?: number[] | null
          created_at?: string
          current_value?: number | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          last_valuation_date?: string | null
          loan_amount?: number | null
          loan_duration_years?: number | null
          monthly_rent?: number | null
          owner_id: string
          postal_code?: string | null
          primary_residence?: boolean | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          show_in_rental?: boolean | null
          size_sqm?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          bedrooms?: number | null
          city?: string | null
          coordinates?: number[] | null
          created_at?: string
          current_value?: number | null
          id?: string
          image_url?: string | null
          interest_rate?: number | null
          last_valuation_date?: string | null
          loan_amount?: number | null
          loan_duration_years?: number | null
          monthly_rent?: number | null
          owner_id?: string
          postal_code?: string | null
          primary_residence?: boolean | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          show_in_rental?: boolean | null
          size_sqm?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          description: string | null
          document_category: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          property_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          description?: string | null
          document_category?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          property_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          description?: string | null
          document_category?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          property_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_valuations: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_id: string
          source: string | null
          updated_at: string
          valuation_amount: number
          valuation_date: string
          valuation_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          source?: string | null
          updated_at?: string
          valuation_amount: number
          valuation_date?: string
          valuation_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          source?: string | null
          updated_at?: string
          valuation_amount?: number
          valuation_date?: string
          valuation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          calculations: Json
          file_name: string | null
          file_size: number | null
          generated_at: string
          id: string
          payment_record_id: string | null
          property_data: Json
          report_type: string
          user_id: string
        }
        Insert: {
          calculations: Json
          file_name?: string | null
          file_size?: number | null
          generated_at?: string
          id?: string
          payment_record_id?: string | null
          property_data: Json
          report_type?: string
          user_id: string
        }
        Update: {
          calculations?: Json
          file_name?: string | null
          file_size?: number | null
          generated_at?: string
          id?: string
          payment_record_id?: string | null
          property_data?: Json
          report_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_payment_record_id_fkey"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          id: string
          last_name: string
          monthly_income: number | null
          national_id: string | null
          occupation: string | null
          phone: string | null
          property_owner_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          monthly_income?: number | null
          national_id?: string | null
          occupation?: string | null
          phone?: string | null
          property_owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          monthly_income?: number | null
          national_id?: string | null
          occupation?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      add_credits_to_user: {
        Args: {
          credits_amount: number
          justification?: string
          target_user_id: string
        }
        Returns: boolean
      }
      admin_access_payment_records: {
        Args: { admin_justification: string; target_user_id?: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method_masked: string
          payment_status: string
          payment_type: string
          user_id: string
        }[]
      }
      admin_access_tenant_data: {
        Args: { admin_justification: string; tenant_property_owner_id: string }
        Returns: {
          access_timestamp: string
          email_partially_masked: string
          first_name: string
          id: string
          last_name: string
          national_id_partially_masked: string
          phone_partially_masked: string
          property_owner_id: string
        }[]
      }
      admin_update_subscription: {
        Args: {
          admin_justification: string
          new_subscription_end: string
          new_subscription_tier: string
          target_user_id: string
        }
        Returns: boolean
      }
      check_auth_security_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          current_status: string
          recommendation: string
          setting_name: string
        }[]
      }
      check_security_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          check_name: string
          description: string
          severity: string
          status: string
        }[]
      }
      cleanup_expired_finn_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_tenant_field: {
        Args: { encrypted_text: string }
        Returns: string
      }
      detect_security_violations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_suspicious_tenant_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_tenant_field: {
        Args: { plain_text: string }
        Returns: string
      }
      enhanced_auth_security_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_rate_limit_check: {
        Args: {
          endpoint_name: string
          identifier_key: string
          max_requests?: number
          penalty_multiplier?: number
          window_minutes?: number
        }
        Returns: Json
      }
      enhanced_security_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_property_financial_summary: {
        Args: { property_owner_id: string }
        Returns: {
          address: string
          estimated_equity_range: string
          id: string
          monthly_rent: number
          property_type: string
          purchase_date: string
          purchase_price_range: string
        }[]
      }
      get_secure_tenant_data: {
        Args: { tenant_property_owner_id: string }
        Returns: {
          address: string
          created_at: string
          email_masked: string
          emergency_contact: string
          emergency_phone_masked: string
          first_name: string
          id: string
          last_name: string
          monthly_income: number
          national_id_masked: string
          occupation: string
          phone_masked: string
          property_owner_id: string
          updated_at: string
        }[]
      }
      get_security_status_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          description: string
          requires_manual_config: boolean
          security_feature: string
          status: string
        }[]
      }
      has_legitimate_tenant_access: {
        Args: { tenant_property_owner_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      monitor_admin_tenant_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_payment_security: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_property_security: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      monitor_subscription_violations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_paid_subscription_upgrade: {
        Args: {
          duration_months?: number
          new_tier: string
          payment_id: string
          user_id: string
        }
        Returns: boolean
      }
      promote_user_to_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      promote_user_to_ambassador: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      track_failed_auth_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      use_credits: {
        Args: { credits_to_use?: number; operation_type?: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password_text: string }
        Returns: Json
      }
      validate_property_ownership: {
        Args: { property_id: string }
        Returns: boolean
      }
      validate_tenant_ownership: {
        Args: { tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "ambassador"
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
      app_role: ["admin", "user", "ambassador"],
    },
  },
} as const
