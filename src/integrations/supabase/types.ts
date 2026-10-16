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
      clinical_drafts: {
        Row: {
          approved_at: string | null
          consultation_id: string | null
          created_at: string
          edited_analysis: Json | null
          id: string
          original_analysis: Json
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          consultation_id?: string | null
          created_at?: string
          edited_analysis?: Json | null
          id?: string
          original_analysis: Json
          status?: string
          user_id?: string
        }
        Update: {
          approved_at?: string | null
          consultation_id?: string | null
          created_at?: string
          edited_analysis?: Json | null
          id?: string
          original_analysis?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_drafts_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_protocols: {
        Row: {
          created_at: string
          disease: string
          document_kind: string
          file_path: string | null
          id: string
          imported_by: string
          issuing_authority: string
          keywords: string
          revision_date: string | null
          source_url: string
          specialty: string
          status: string
          title: string
          verified_at: string | null
          verified_by: string | null
          version: string
        }
        Insert: {
          created_at?: string
          disease?: string
          document_kind?: string
          file_path?: string | null
          id?: string
          imported_by?: string
          issuing_authority: string
          keywords?: string
          revision_date?: string | null
          source_url: string
          specialty?: string
          status?: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          disease?: string
          document_kind?: string
          file_path?: string | null
          id?: string
          imported_by?: string
          issuing_authority?: string
          keywords?: string
          revision_date?: string | null
          source_url?: string
          specialty?: string
          status?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
          version?: string
        }
        Relationships: []
      }
      clinics: {
        Row: {
          address: string
          base44_clinic_id: string | null
          city: string | null
          clinic_code: string | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean
          languages_supported: string[]
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          base44_clinic_id?: string | null
          city?: string | null
          clinic_code?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          languages_supported?: string[]
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          base44_clinic_id?: string | null
          city?: string | null
          clinic_code?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          languages_supported?: string[]
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          approved_at: string | null
          chosen_diagnosis: string
          clinical_document: Json | null
          created_at: string
          diagnosis: string
          differentials: Json
          document_status: string
          duration_seconds: number | null
          ended_at: string | null
          family_advice: string
          id: string
          instrumental_tests: Json
          lab_tests: Json
          language: string
          patient_code: string
          patient_name: string
          prescriptions: Json
          protocol_refs: Json
          recommendation: string
          started_at: string | null
          symptoms: Json
          transcript: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          chosen_diagnosis?: string
          clinical_document?: Json | null
          created_at?: string
          diagnosis?: string
          differentials?: Json
          document_status?: string
          duration_seconds?: number | null
          ended_at?: string | null
          family_advice?: string
          id?: string
          instrumental_tests?: Json
          lab_tests?: Json
          language?: string
          patient_code?: string
          patient_name?: string
          prescriptions?: Json
          protocol_refs?: Json
          recommendation?: string
          started_at?: string | null
          symptoms?: Json
          transcript?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          chosen_diagnosis?: string
          clinical_document?: Json | null
          created_at?: string
          diagnosis?: string
          differentials?: Json
          document_status?: string
          duration_seconds?: number | null
          ended_at?: string | null
          family_advice?: string
          id?: string
          instrumental_tests?: Json
          lab_tests?: Json
          language?: string
          patient_code?: string
          patient_name?: string
          prescriptions?: Json
          protocol_refs?: Json
          recommendation?: string
          started_at?: string | null
          symptoms?: Json
          transcript?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_activity: {
        Row: {
          consultation_started_at: string | null
          last_seen_at: string
          status: string
          user_id: string
        }
        Insert: {
          consultation_started_at?: string | null
          last_seen_at?: string
          status?: string
          user_id: string
        }
        Update: {
          consultation_started_at?: string | null
          last_seen_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          allergies: string[]
          blood_type: string
          chronic_conditions: string[]
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string
          id: string
          language: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[]
          blood_type?: string
          chronic_conditions?: string[]
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string
          id?: string
          language?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[]
          blood_type?: string
          chronic_conditions?: string[]
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string
          id?: string
          language?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          duration_months: number
          id: string
          note: string | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          duration_months: number
          id?: string
          note?: string | null
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration_months?: number
          id?: string
          note?: string | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          card_holder: string
          card_number: string
          id: number
          pro_price_monthly: number
          telegram_support: string
          updated_at: string
        }
        Insert: {
          card_holder?: string
          card_number?: string
          id?: number
          pro_price_monthly?: number
          telegram_support?: string
          updated_at?: string
        }
        Update: {
          card_holder?: string
          card_number?: string
          id?: number
          pro_price_monthly?: number
          telegram_support?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions_log: {
        Row: {
          created_at: string
          doctor_name: string
          hospital: string
          id: string
          patient_name: string
          prescriptions_count: number
          symptoms_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_name?: string
          hospital?: string
          id?: string
          patient_name?: string
          prescriptions_count?: number
          symptoms_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_name?: string
          hospital?: string
          id?: string
          patient_name?: string
          prescriptions_count?: number
          symptoms_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          base44_doctor_id: string | null
          clinic_id: string | null
          clinic_instagram: string
          clinic_telegram: string
          created_at: string
          doctor_instagram: string
          doctor_telegram: string
          full_name: string
          hospital: string
          hospital_address: string
          hospital_phone: string
          id: string
          phone: string
          specialty: string
          updated_at: string
          user_id: string
          work_hours: string
        }
        Insert: {
          avatar_url?: string
          base44_doctor_id?: string | null
          clinic_id?: string | null
          clinic_instagram?: string
          clinic_telegram?: string
          created_at?: string
          doctor_instagram?: string
          doctor_telegram?: string
          full_name?: string
          hospital?: string
          hospital_address?: string
          hospital_phone?: string
          id?: string
          phone?: string
          specialty?: string
          updated_at?: string
          user_id: string
          work_hours?: string
        }
        Update: {
          avatar_url?: string
          base44_doctor_id?: string | null
          clinic_id?: string | null
          clinic_instagram?: string
          clinic_telegram?: string
          created_at?: string
          doctor_instagram?: string
          doctor_telegram?: string
          full_name?: string
          hospital?: string
          hospital_address?: string
          hospital_phone?: string
          id?: string
          phone?: string
          specialty?: string
          updated_at?: string
          user_id?: string
          work_hours?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_passages: {
        Row: {
          content: string
          id: string
          page: number
          protocol_id: string
          section: string
        }
        Insert: {
          content: string
          id?: string
          page?: number
          protocol_id: string
          section?: string
        }
        Update: {
          content?: string
          id?: string
          page?: number
          protocol_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_passages_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "clinical_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          activated_by: string | null
          branding_name: string | null
          created_at: string
          duration_months: number
          expires_at: string
          id: string
          is_active: boolean
          plan: string
          starts_at: string
          user_id: string
        }
        Insert: {
          activated_by?: string | null
          branding_name?: string | null
          created_at?: string
          duration_months: number
          expires_at: string
          id?: string
          is_active?: boolean
          plan: string
          starts_at?: string
          user_id: string
        }
        Update: {
          activated_by?: string | null
          branding_name?: string | null
          created_at?: string
          duration_months?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          plan?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_reports: {
        Row: {
          ai_summary: string
          ai_urgency: string
          assigned_doctor_id: string | null
          clinic_id: string
          created_at: string
          id: string
          language: string
          patient_id: string
          recommended_specialization: string
          status: string
          symptoms: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string
          ai_urgency?: string
          assigned_doctor_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          language?: string
          patient_id: string
          recommended_specialization?: string
          status?: string
          symptoms?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string
          ai_urgency?: string
          assigned_doctor_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          language?: string
          patient_id?: string
          recommended_specialization?: string
          status?: string
          symptoms?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_reports_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
      [_ in never]: never
    }
    Functions: {
      daily_usage_count: { Args: { _user_id: string }; Returns: number }
      doctor_in_clinic: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      ensure_patient_account: {
        Args: {
          _date_of_birth?: string
          _full_name?: string
          _gender?: string
          _language?: string
          _phone?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      platform_stats: { Args: never; Returns: Json }
      review_clinical_draft: {
        Args: {
          decision: string
          draft_id: string
          edited: Json
          final_record?: Json
        }
        Returns: string
      }
      search_protocol_passages: {
        Args: { search_text: string }
        Returns: {
          content: string
          page: number
          passage_id: string
          protocol_id: string
          revision_date: string
          section: string
          source_url: string
          specialty: string
          title: string
          version: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "doctor", "patient"],
    },
  },
} as const
