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
      locations: {
        Row: {
          city: string
          created_at: string
          ext_number: string | null
          id: string
          int_number: string | null
          label: string
          lat: number | null
          lng: number | null
          neighborhood: string | null
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          ext_number?: string | null
          id?: string
          int_number?: string | null
          label: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          ext_number?: string | null
          id?: string
          int_number?: string | null
          label?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          quote_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          quote_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          quote_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          first_name: string
          id: string
          last_name_materno: string | null
          last_name_paterno: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          first_name: string
          id: string
          last_name_materno?: string | null
          last_name_paterno?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          first_name?: string
          id?: string
          last_name_materno?: string | null
          last_name_paterno?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          additional_notes: string | null
          attachments: string[] | null
          created_at: string
          description: string | null
          estimated_duration_hours: number | null
          exclusions: string | null
          has_warranty: boolean | null
          id: string
          includes_materials: boolean | null
          materials_list: string | null
          price_fixed: number | null
          price_max: number | null
          price_min: number | null
          proposed_date: string | null
          proposed_time_end: string | null
          proposed_time_start: string | null
          request_id: string
          requires_visit: boolean | null
          scope: string | null
          specialist_id: string
          status: Database["public"]["Enums"]["quote_status"]
          visit_cost: number | null
          warranty_days: number | null
          warranty_description: string | null
        }
        Insert: {
          additional_notes?: string | null
          attachments?: string[] | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          exclusions?: string | null
          has_warranty?: boolean | null
          id?: string
          includes_materials?: boolean | null
          materials_list?: string | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          proposed_date?: string | null
          proposed_time_end?: string | null
          proposed_time_start?: string | null
          request_id: string
          requires_visit?: boolean | null
          scope?: string | null
          specialist_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          visit_cost?: number | null
          warranty_days?: number | null
          warranty_description?: string | null
        }
        Update: {
          additional_notes?: string | null
          attachments?: string[] | null
          created_at?: string
          description?: string | null
          estimated_duration_hours?: number | null
          exclusions?: string | null
          has_warranty?: boolean | null
          id?: string
          includes_materials?: boolean | null
          materials_list?: string | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          proposed_date?: string | null
          proposed_time_end?: string | null
          proposed_time_start?: string | null
          request_id?: string
          requires_visit?: boolean | null
          scope?: string | null
          specialist_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          visit_cost?: number | null
          warranty_days?: number | null
          warranty_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          request_id: string
          specialist_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          request_id: string
          specialist_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          request_id?: string
          specialist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          activity: string
          category: string
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          location_id: string | null
          price_max: number | null
          price_min: number | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          time_end: string | null
          time_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity: string
          category: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          location_id?: string | null
          price_max?: number | null
          price_min?: number | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: string
          category?: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          location_id?: string | null
          price_max?: number | null
          price_min?: number | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          time_end?: string | null
          time_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_domesticos: {
        Row: {
          actividad: string
          categoria: string
          created_at: string | null
          especialista: string
          id: number
        }
        Insert: {
          actividad: string
          categoria: string
          created_at?: string | null
          especialista: string
          id?: number
        }
        Update: {
          actividad?: string
          categoria?: string
          created_at?: string | null
          especialista?: string
          id?: number
        }
        Relationships: []
      }
      specialist_activities: {
        Row: {
          activity: string
          created_at: string
          id: string
          price_max: number | null
          price_min: number | null
          specialty_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          id?: string
          price_max?: number | null
          price_min?: number | null
          specialty_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          id?: string
          price_max?: number | null
          price_min?: number | null
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_activities_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialist_specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_profiles: {
        Row: {
          created_at: string
          id: string
          id_document_url: string
          phone: string
          rfc: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_document_url: string
          phone: string
          rfc: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          id_document_url?: string
          phone?: string
          rfc?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specialist_specialties: {
        Row: {
          created_at: string
          id: string
          role_label: string
          specialist_id: string
          specialty: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_label: string
          specialist_id: string
          specialty: string
        }
        Update: {
          created_at?: string
          id?: string
          role_label?: string
          specialist_id?: string
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_specialties_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_work_zones: {
        Row: {
          cities: string[]
          created_at: string
          id: string
          specialist_id: string
          state: string
        }
        Insert: {
          cities: string[]
          created_at?: string
          id?: string
          specialist_id: string
          state: string
        }
        Update: {
          cities?: string[]
          created_at?: string
          id?: string
          specialist_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_work_zones_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_profiles"
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
      quote_status: "pending" | "accepted" | "rejected"
      service_request_status:
        | "draft"
        | "active"
        | "in_progress"
        | "completed"
        | "cancelled"
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
      quote_status: ["pending", "accepted", "rejected"],
      service_request_status: [
        "draft",
        "active",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
