// Types matching supabase/migrations/001_initial_schema.sql + 002_automation_ready.sql + 004_lead_gen_channels.sql
// Regenerate with: npx supabase gen types typescript --project-id <project-id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'agent' | 'client';
          phone: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'agent' | 'client';
          phone?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: 'agent' | 'client';
          phone?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          agent_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          source: LeadSource;
          status: LeadStatus;
          score: number;
          temperature: LeadTemperature;
          score_updated_at: string | null;
          tags: string[];
          notes: string | null;
          preferred_language: string;
          budget_min: number | null;
          budget_max: number | null;
          preferred_areas: string[];
          property_type: string | null;
          timeline: string | null;
          last_activity: string | null;
          verification_status: VerificationStatus;
          verified_at: string | null;
          verified_by: string | null;
          verification_notes: string | null;
          assigned_to: string | null;
          last_outreach_at: string | null;
          nurture_paused: boolean;
          behavioral_score: number;
          engagement_level: 'none' | 'low' | 'medium' | 'high';
          communication_preference: 'any' | 'sms' | 'email' | 'phone';
          best_call_time: string | null;
          deal_type: DealType | null;
          move_in_date: string | null;
          pre_approved: boolean;
          pre_approval_amount: number | null;
          lender_name: string | null;
          referring_agent: string | null;
          custom_fields: Json;
          import_batch_id: string | null;
          imported_at: string | null;
          last_referral_touch: string | null;
          referral_count: number;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          score?: number;
          tags?: string[];
          notes?: string | null;
          preferred_language?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_areas?: string[];
          property_type?: string | null;
          timeline?: string | null;
          last_activity?: string | null;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_notes?: string | null;
          assigned_to?: string | null;
          last_outreach_at?: string | null;
          nurture_paused?: boolean;
          behavioral_score?: number;
          engagement_level?: 'none' | 'low' | 'medium' | 'high';
          communication_preference?: 'any' | 'sms' | 'email' | 'phone';
          best_call_time?: string | null;
          deal_type?: DealType | null;
          move_in_date?: string | null;
          pre_approved?: boolean;
          pre_approval_amount?: number | null;
          lender_name?: string | null;
          referring_agent?: string | null;
          custom_fields?: Json;
          import_batch_id?: string | null;
          imported_at?: string | null;
          last_referral_touch?: string | null;
          referral_count?: number;
          referred_by?: string | null;
        };
        Update: {
          agent_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          score?: number;
          tags?: string[];
          notes?: string | null;
          preferred_language?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_areas?: string[];
          property_type?: string | null;
          timeline?: string | null;
          last_activity?: string | null;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          verified_by?: string | null;
          verification_notes?: string | null;
          assigned_to?: string | null;
          last_outreach_at?: string | null;
          nurture_paused?: boolean;
          behavioral_score?: number;
          engagement_level?: 'none' | 'low' | 'medium' | 'high';
          communication_preference?: 'any' | 'sms' | 'email' | 'phone';
          best_call_time?: string | null;
          deal_type?: DealType | null;
          move_in_date?: string | null;
          pre_approved?: boolean;
          pre_approval_amount?: number | null;
          lender_name?: string | null;
          referring_agent?: string | null;
          custom_fields?: Json;
          import_batch_id?: string | null;
          imported_at?: string | null;
          last_referral_touch?: string | null;
          referral_count?: number;
          referred_by?: string | null;
        };
        Relationships: [];
      };
      lead_activity: {
        Row: {
          id: string;
          lead_id: string;
          action: string;
          points: number;
          metadata: Json;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          action: string;
          points?: number;
          metadata?: Json;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          lead_id?: string;
          action?: string;
          points?: number;
          metadata?: Json;
          source?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string;
          channel: MessageChannel;
          direction: 'inbound' | 'outbound';
          content: string;
          metadata: Json;
          read: boolean;
          is_ai: boolean;
          automation_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id: string;
          channel: MessageChannel;
          direction: 'inbound' | 'outbound';
          content: string;
          metadata?: Json;
          read?: boolean;
          is_ai?: boolean;
          automation_source?: string | null;
          created_at?: string;
        };
        Update: {
          lead_id?: string;
          agent_id?: string;
          channel?: MessageChannel;
          direction?: 'inbound' | 'outbound';
          content?: string;
          metadata?: Json;
          read?: boolean;
          is_ai?: boolean;
          automation_source?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          mls_id: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          price: number;
          bedrooms: number;
          bathrooms: number;
          sqft: number;
          lot_size: number | null;
          year_built: number | null;
          property_type: string;
          status: string;
          description: string | null;
          features: string[];
          photos: string[];
          neighborhood: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mls_id?: string | null;
          address: string;
          city?: string;
          state?: string;
          zip: string;
          price: number;
          bedrooms: number;
          bathrooms: number;
          sqft: number;
          lot_size?: number | null;
          year_built?: number | null;
          property_type?: string;
          status?: string;
          description?: string | null;
          features?: string[];
          photos?: string[];
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          mls_id?: string | null;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          price?: number;
          bedrooms?: number;
          bathrooms?: number;
          sqft?: number;
          lot_size?: number | null;
          year_built?: number | null;
          property_type?: string;
          status?: string;
          description?: string | null;
          features?: string[];
          photos?: string[];
          neighborhood?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [];
      };
      showings: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string;
          property_id: string | null;
          address: string;
          date: string;
          start_time: string;
          end_time: string;
          status: ShowingStatus;
          notes: string | null;
          feedback: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id: string;
          property_id?: string | null;
          address: string;
          date: string;
          start_time: string;
          end_time: string;
          status?: ShowingStatus;
          notes?: string | null;
          feedback?: Json;
        };
        Update: {
          lead_id?: string;
          agent_id?: string;
          property_id?: string | null;
          address?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          status?: ShowingStatus;
          notes?: string | null;
          feedback?: Json;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          agent_id: string;
          type: string;
          title: string;
          message: string;
          lead_id: string | null;
          metadata: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          type: string;
          title: string;
          message: string;
          lead_id?: string | null;
          metadata?: Json;
          read?: boolean;
        };
        Update: {
          type?: string;
          title?: string;
          message?: string;
          lead_id?: string | null;
          metadata?: Json;
          read?: boolean;
        };
        Relationships: [];
      };
      drip_sequences: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          description: string | null;
          trigger: string;
          steps: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          description?: string | null;
          trigger: string;
          steps?: Json;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          trigger?: string;
          steps?: Json;
          is_active?: boolean;
        };
        Relationships: [];
      };
      drip_enrollments: {
        Row: {
          id: string;
          sequence_id: string;
          lead_id: string;
          current_step: number;
          status: 'active' | 'paused' | 'completed' | 'cancelled';
          next_send_at: string | null;
          next_sequence_id: string | null;
          enrolled_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          lead_id: string;
          current_step?: number;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          next_send_at?: string | null;
          next_sequence_id?: string | null;
          completed_at?: string | null;
        };
        Update: {
          current_step?: number;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          next_send_at?: string | null;
          next_sequence_id?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      drip_messages_sent: {
        Row: {
          id: string;
          enrollment_id: string;
          step_index: number;
          channel: 'sms' | 'email';
          content: string;
          sent_at: string;
          delivered: boolean | null;
          opened: boolean | null;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          step_index: number;
          channel: 'sms' | 'email';
          content: string;
          delivered?: boolean | null;
          opened?: boolean | null;
        };
        Update: {
          delivered?: boolean | null;
          opened?: boolean | null;
        };
        Relationships: [];
      };
      checklist_templates: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          description: string | null;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          description?: string | null;
          items?: Json;
        };
        Update: {
          name?: string;
          description?: string | null;
          items?: Json;
        };
        Relationships: [];
      };
      checklist_instances: {
        Row: {
          id: string;
          template_id: string;
          lead_id: string;
          items: Json;
          status: 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          lead_id: string;
          items?: Json;
          status?: 'in_progress' | 'completed';
        };
        Update: {
          items?: Json;
          status?: 'in_progress' | 'completed';
        };
        Relationships: [];
      };
      calendar_campaigns: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          description: string | null;
          month: number;
          day: number | null;
          template_id: string | null;
          channel: MessageChannel;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          description?: string | null;
          month: number;
          day?: number | null;
          template_id?: string | null;
          channel?: MessageChannel;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          month?: number;
          day?: number | null;
          template_id?: string | null;
          channel?: MessageChannel;
          is_active?: boolean;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          agent_id: string;
          name: string;
          subject: string;
          body_html: string;
          body_text: string | null;
          category: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          name: string;
          subject: string;
          body_html: string;
          body_text?: string | null;
          category?: string;
          language?: string;
        };
        Update: {
          name?: string;
          subject?: string;
          body_html?: string;
          body_text?: string | null;
          category?: string;
          language?: string;
        };
        Relationships: [];
      };
      cma_reports: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string | null;
          address: string;
          estimated_value: number | null;
          report_data: Json;
          status: 'generating' | 'complete' | 'error';
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id?: string | null;
          address: string;
          estimated_value?: number | null;
          report_data?: Json;
          status?: 'generating' | 'complete' | 'error';
          pdf_url?: string | null;
        };
        Update: {
          lead_id?: string | null;
          address?: string;
          estimated_value?: number | null;
          report_data?: Json;
          status?: 'generating' | 'complete' | 'error';
          pdf_url?: string | null;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          lead_id: string;
          name: string;
          criteria: Json;
          alert_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          name: string;
          criteria?: Json;
          alert_enabled?: boolean;
        };
        Update: {
          name?: string;
          criteria?: Json;
          alert_enabled?: boolean;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          lead_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          property_id: string;
        };
        Update: {
          lead_id?: string;
          property_id?: string;
        };
        Relationships: [];
      };
      daily_briefings: {
        Row: {
          id: string;
          agent_id: string;
          date: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          date?: string;
          content?: Json;
        };
        Update: {
          content?: Json;
        };
        Relationships: [];
      };
      pipeline_history: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string;
          from_status: string;
          to_status: string;
          changed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id: string;
          from_status: string;
          to_status: string;
          changed_by?: string;
          notes?: string | null;
        };
        Update: {
          notes?: string | null;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string;
          deal_type: DealType;
          stage: DealStage;
          property_address: string | null;
          list_price: number | null;
          sale_price: number | null;
          commission_rate: number | null;
          estimated_close_date: string | null;
          actual_close_date: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id: string;
          deal_type: DealType;
          stage?: DealStage;
          property_address?: string | null;
          list_price?: number | null;
          sale_price?: number | null;
          commission_rate?: number | null;
          estimated_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          metadata?: Json;
        };
        Update: {
          deal_type?: DealType;
          stage?: DealStage;
          property_address?: string | null;
          list_price?: number | null;
          sale_price?: number | null;
          commission_rate?: number | null;
          estimated_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      deal_checklists: {
        Row: {
          id: string;
          deal_id: string;
          title: string;
          due_date: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'skipped';
          assigned_to: string | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          title: string;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          assigned_to?: string | null;
          notes?: string | null;
          completed_at?: string | null;
        };
        Update: {
          title?: string;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
          assigned_to?: string | null;
          notes?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      behavioral_events: {
        Row: {
          id: string;
          lead_id: string;
          event_type: string;
          page_url: string | null;
          metadata: Json;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          event_type: string;
          page_url?: string | null;
          metadata?: Json;
          session_id?: string | null;
        };
        Update: {
          event_type?: string;
          page_url?: string | null;
          metadata?: Json;
          session_id?: string | null;
        };
        Relationships: [];
      };
      lead_imports: {
        Row: {
          id: string;
          agent_id: string;
          filename: string;
          total_rows: number;
          imported_rows: number;
          skipped_rows: number;
          error_log: Json;
          status: 'processing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          filename: string;
          total_rows?: number;
          imported_rows?: number;
          skipped_rows?: number;
          error_log?: Json;
          status?: 'processing' | 'completed' | 'failed';
        };
        Update: {
          filename?: string;
          total_rows?: number;
          imported_rows?: number;
          skipped_rows?: number;
          error_log?: Json;
          status?: 'processing' | 'completed' | 'failed';
        };
        Relationships: [];
      };
      homepulse_reports: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string | null;
          address: string;
          estimated_value: number | null;
          report_data: Json;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id?: string | null;
          address: string;
          estimated_value?: number | null;
          report_data?: Json;
          sent_at?: string | null;
        };
        Update: {
          lead_id?: string | null;
          address?: string;
          estimated_value?: number | null;
          report_data?: Json;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      // ===== MLS Integration Tables (008_mls_integration.sql) =====
      listings: {
        Row: {
          id: string;
          spark_id: string | null;
          mls_id: string | null;
          status: string;
          list_price: number;
          original_list_price: number | null;
          sold_price: number | null;
          close_price: number | null;
          close_date: string | null;
          list_date: string | null;
          pending_date: string | null;
          withdrawn_date: string | null;
          expiration_date: string | null;
          address: string;
          unit_number: string | null;
          city: string;
          state: string;
          zip_code: string;
          county: string | null;
          subdivision: string | null;
          latitude: number | null;
          longitude: number | null;
          property_type: string;
          property_subtype: string | null;
          beds: number;
          baths: number;
          half_baths: number;
          sqft: number;
          lot_sqft: number | null;
          lot_acres: number | null;
          year_built: number | null;
          stories: number | null;
          garage_spaces: number;
          pool: boolean;
          days_on_market: number;
          cumulative_dom: number;
          price_per_sqft: number | null;
          description: string | null;
          public_remarks: string | null;
          features: string[] | null;
          interior_features: string[] | null;
          exterior_features: string[] | null;
          appliances: string[] | null;
          heating: string | null;
          cooling: string | null;
          construction: string[] | null;
          roof: string | null;
          foundation: string | null;
          parking_description: string | null;
          hoa_fee: number | null;
          hoa_frequency: string | null;
          tax_amount: number | null;
          tax_year: number | null;
          association_fee: number | null;
          school_district: string | null;
          elementary_school: string | null;
          middle_school: string | null;
          high_school: string | null;
          photos: Json;
          photo_count: number;
          primary_photo_url: string | null;
          virtual_tour_url: string | null;
          video_url: string | null;
          listing_agent_id: string | null;
          listing_agent_name: string | null;
          listing_agent_phone: string | null;
          listing_agent_email: string | null;
          listing_office_name: string | null;
          listing_office_id: string | null;
          co_listing_agent_name: string | null;
          buyer_agent_name: string | null;
          buyer_office_name: string | null;
          is_lorenas_listing: boolean;
          display_compliance: Json;
          mls_name: string;
          raw_spark_data: Json | null;
          spark_modification_timestamp: string | null;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          spark_id?: string | null;
          mls_id?: string | null;
          status?: string;
          list_price: number;
          original_list_price?: number | null;
          sold_price?: number | null;
          close_price?: number | null;
          close_date?: string | null;
          list_date?: string | null;
          pending_date?: string | null;
          address: string;
          unit_number?: string | null;
          city?: string;
          state?: string;
          zip_code: string;
          county?: string | null;
          subdivision?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          property_type?: string;
          property_subtype?: string | null;
          beds?: number;
          baths?: number;
          half_baths?: number;
          sqft?: number;
          lot_sqft?: number | null;
          lot_acres?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number;
          pool?: boolean;
          days_on_market?: number;
          cumulative_dom?: number;
          description?: string | null;
          public_remarks?: string | null;
          features?: string[] | null;
          interior_features?: string[] | null;
          exterior_features?: string[] | null;
          appliances?: string[] | null;
          heating?: string | null;
          cooling?: string | null;
          construction?: string | null;
          roof?: string | null;
          foundation?: string | null;
          parking_description?: string | null;
          hoa_fee?: number | null;
          hoa_frequency?: string | null;
          tax_amount?: number | null;
          tax_year?: number | null;
          school_district?: string | null;
          elementary_school?: string | null;
          middle_school?: string | null;
          high_school?: string | null;
          photos?: Json;
          photo_count?: number;
          primary_photo_url?: string | null;
          virtual_tour_url?: string | null;
          listing_agent_id?: string | null;
          listing_agent_name?: string | null;
          listing_agent_phone?: string | null;
          listing_agent_email?: string | null;
          listing_office_name?: string | null;
          listing_office_id?: string | null;
          co_listing_agent_name?: string | null;
          buyer_agent_name?: string | null;
          buyer_office_name?: string | null;
          is_lorenas_listing?: boolean;
          display_compliance?: Json;
          mls_name?: string;
          raw_spark_data?: Json | null;
          spark_modification_timestamp?: string | null;
        };
        Update: {
          spark_id?: string | null;
          mls_id?: string | null;
          status?: string;
          list_price?: number;
          original_list_price?: number | null;
          sold_price?: number | null;
          close_price?: number | null;
          close_date?: string | null;
          list_date?: string | null;
          pending_date?: string | null;
          address?: string;
          unit_number?: string | null;
          city?: string;
          state?: string;
          zip_code?: string;
          county?: string | null;
          subdivision?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          property_type?: string;
          property_subtype?: string | null;
          beds?: number;
          baths?: number;
          half_baths?: number;
          sqft?: number;
          lot_sqft?: number | null;
          lot_acres?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number;
          pool?: boolean;
          days_on_market?: number;
          cumulative_dom?: number;
          description?: string | null;
          public_remarks?: string | null;
          features?: string[] | null;
          interior_features?: string[] | null;
          exterior_features?: string[] | null;
          appliances?: string[] | null;
          heating?: string | null;
          cooling?: string | null;
          construction?: string | null;
          roof?: string | null;
          foundation?: string | null;
          parking_description?: string | null;
          hoa_fee?: number | null;
          hoa_frequency?: string | null;
          tax_amount?: number | null;
          tax_year?: number | null;
          school_district?: string | null;
          elementary_school?: string | null;
          middle_school?: string | null;
          high_school?: string | null;
          photos?: Json;
          photo_count?: number;
          primary_photo_url?: string | null;
          virtual_tour_url?: string | null;
          listing_agent_id?: string | null;
          listing_agent_name?: string | null;
          listing_agent_phone?: string | null;
          listing_agent_email?: string | null;
          listing_office_name?: string | null;
          listing_office_id?: string | null;
          co_listing_agent_name?: string | null;
          buyer_agent_name?: string | null;
          buyer_office_name?: string | null;
          is_lorenas_listing?: boolean;
          display_compliance?: Json;
          mls_name?: string;
          raw_spark_data?: Json | null;
          spark_modification_timestamp?: string | null;
        };
        Relationships: [];
      };
      listing_price_history: {
        Row: {
          id: string;
          listing_id: string;
          spark_id: string | null;
          mls_id: string | null;
          old_price: number | null;
          new_price: number;
          change_amount: number | null;
          change_percent: number | null;
          change_type: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          spark_id?: string | null;
          mls_id?: string | null;
          old_price?: number | null;
          new_price: number;
          change_amount?: number | null;
          change_percent?: number | null;
          change_type?: string;
        };
        Update: {
          old_price?: number | null;
          new_price?: number;
          change_amount?: number | null;
          change_percent?: number | null;
          change_type?: string;
        };
        Relationships: [];
      };
      listing_status_history: {
        Row: {
          id: string;
          listing_id: string;
          spark_id: string | null;
          mls_id: string | null;
          old_status: string | null;
          new_status: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          spark_id?: string | null;
          mls_id?: string | null;
          old_status?: string | null;
          new_status: string;
        };
        Update: {
          old_status?: string | null;
          new_status?: string;
        };
        Relationships: [];
      };
      lead_listing_interactions: {
        Row: {
          id: string;
          lead_id: string;
          listing_id: string;
          spark_id: string | null;
          mls_id: string | null;
          interaction_type: string;
          source: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          listing_id: string;
          spark_id?: string | null;
          mls_id?: string | null;
          interaction_type: string;
          source?: string | null;
          notes?: string | null;
          metadata?: Json;
        };
        Update: {
          interaction_type?: string;
          source?: string | null;
          notes?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      listing_alert_queue: {
        Row: {
          id: string;
          saved_search_id: string;
          listing_id: string;
          lead_id: string;
          alert_type: string;
          frequency: string;
          status: string;
          sent: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          saved_search_id: string;
          listing_id: string;
          lead_id: string;
          alert_type?: string;
          frequency?: string;
          status?: string;
          sent?: boolean;
        };
        Update: {
          alert_type?: string;
          frequency?: string;
          status?: string;
          sent?: boolean;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      market_snapshots: {
        Row: {
          id: string;
          area: string;
          area_type: string;
          snapshot_date: string;
          active_count: number;
          pending_count: number;
          sold_count_30d: number;
          new_count_7d: number;
          new_listings_30d: number;
          sold_90d: number;
          withdrawn_30d: number;
          expired_30d: number;
          median_price: number | null;
          avg_price: number | null;
          median_sold_price: number | null;
          avg_sold_price: number | null;
          avg_price_per_sqft: number | null;
          median_price_per_sqft: number | null;
          min_list_price: number | null;
          max_list_price: number | null;
          avg_dom: number | null;
          median_dom: number | null;
          months_of_inventory: number | null;
          list_to_sold_ratio: number | null;
          absorption_rate: number | null;
          inventory_change_30d_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          area: string;
          area_type?: string;
          snapshot_date?: string;
          active_count?: number;
          pending_count?: number;
          sold_count_30d?: number;
          new_count_7d?: number;
          new_listings_30d?: number;
          sold_90d?: number;
          withdrawn_30d?: number;
          expired_30d?: number;
          median_price?: number | null;
          avg_price?: number | null;
          median_sold_price?: number | null;
          avg_sold_price?: number | null;
          avg_price_per_sqft?: number | null;
          median_price_per_sqft?: number | null;
          min_list_price?: number | null;
          max_list_price?: number | null;
          avg_dom?: number | null;
          median_dom?: number | null;
          months_of_inventory?: number | null;
          list_to_sold_ratio?: number | null;
          absorption_rate?: number | null;
        };
        Update: {
          area?: string;
          area_type?: string;
          snapshot_date?: string;
          active_count?: number;
          pending_count?: number;
          sold_count_30d?: number;
          new_count_7d?: number;
          new_listings_30d?: number;
          sold_90d?: number;
          withdrawn_30d?: number;
          expired_30d?: number;
          median_price?: number | null;
          avg_price?: number | null;
          median_sold_price?: number | null;
          avg_sold_price?: number | null;
          avg_price_per_sqft?: number | null;
          median_price_per_sqft?: number | null;
          min_list_price?: number | null;
          max_list_price?: number | null;
          avg_dom?: number | null;
          median_dom?: number | null;
          months_of_inventory?: number | null;
          list_to_sold_ratio?: number | null;
          absorption_rate?: number | null;
          price_trend?: string | null;
          price_change_30d_pct?: number | null;
          inventory_trend?: string | null;
          inventory_change_30d_pct?: number | null;
        };
        Relationships: [];
      };
      comparable_sales: {
        Row: {
          id: string;
          cma_report_id: string | null;
          listing_id: string | null;
          address: string;
          sold_price: number | null;
          close_date: string | null;
          beds: number | null;
          baths: number | null;
          sqft: number | null;
          price_per_sqft: number | null;
          days_on_market: number | null;
          similarity_score: number | null;
          included_in_calc: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cma_report_id?: string | null;
          listing_id?: string | null;
          address: string;
          sold_price?: number | null;
          close_date?: string | null;
          beds?: number | null;
          baths?: number | null;
          sqft?: number | null;
          price_per_sqft?: number | null;
          days_on_market?: number | null;
          similarity_score?: number | null;
          included_in_calc?: boolean;
        };
        Update: {
          cma_report_id?: string | null;
          listing_id?: string | null;
          address?: string;
          sold_price?: number | null;
          close_date?: string | null;
          beds?: number | null;
          baths?: number | null;
          sqft?: number | null;
          price_per_sqft?: number | null;
          days_on_market?: number | null;
          similarity_score?: number | null;
          included_in_calc?: boolean;
        };
        Relationships: [];
      };
      mls_sync_metadata: {
        Row: {
          id: string;
          sync_type: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          records_processed: number;
          records_created: number;
          records_updated: number;
          records_failed: number;
          records_new: number;
          records_price_changed: number;
          records_status_changed: number;
          last_modification_timestamp: string | null;
          error_message: string | null;
          error_log: Json;
          metadata: Json;
        };
        Insert: {
          id?: string;
          sync_type?: string;
          status?: string;
          records_processed?: number;
          records_created?: number;
          records_updated?: number;
          records_failed?: number;
          records_new?: number;
          records_price_changed?: number;
          records_status_changed?: number;
          last_modification_timestamp?: string | null;
          error_message?: string | null;
          error_log?: Json;
          metadata?: Json;
        };
        Update: {
          sync_type?: string;
          status?: string;
          completed_at?: string | null;
          records_processed?: number;
          records_created?: number;
          records_updated?: number;
          records_failed?: number;
          records_new?: number;
          records_price_changed?: number;
          records_status_changed?: number;
          last_modification_timestamp?: string | null;
          error_message?: string | null;
          error_log?: Json;
          metadata?: Json;
        };
        Relationships: [];
      };
      social_content: {
        Row: {
          id: string;
          content_type: string;
          english_text: string | null;
          spanish_text: string | null;
          combined_post: string;
          platform: string;
          cta_url: string | null;
          hashtags: string[];
          image_prompt: string | null;
          scheduled_for: string | null;
          status: 'draft' | 'approved' | 'posted';
          engagement_likes: number;
          engagement_comments: number;
          engagement_shares: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          english_text?: string | null;
          spanish_text?: string | null;
          combined_post: string;
          platform?: string;
          cta_url?: string | null;
          hashtags?: string[];
          image_prompt?: string | null;
          scheduled_for?: string | null;
          status?: 'draft' | 'approved' | 'posted';
          engagement_likes?: number;
          engagement_comments?: number;
          engagement_shares?: number;
        };
        Update: {
          content_type?: string;
          english_text?: string | null;
          spanish_text?: string | null;
          combined_post?: string;
          platform?: string;
          cta_url?: string | null;
          hashtags?: string[];
          image_prompt?: string | null;
          scheduled_for?: string | null;
          status?: 'draft' | 'approved' | 'posted';
          engagement_likes?: number;
          engagement_comments?: number;
          engagement_shares?: number;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          visitor_id: string;
          status: 'active' | 'closed' | 'converted';
          lead_id: string | null;
          lead_score: number;
          page_url: string | null;
          visitor_name: string | null;
          visitor_phone: string | null;
          visitor_email: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          status?: 'active' | 'closed' | 'converted';
          lead_id?: string | null;
          lead_score?: number;
          page_url?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
          visitor_email?: string | null;
          metadata?: Json;
        };
        Update: {
          visitor_id?: string;
          status?: 'active' | 'closed' | 'converted';
          lead_id?: string | null;
          lead_score?: number;
          page_url?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
          visitor_email?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'visitor' | 'bot' | 'agent';
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'visitor' | 'bot' | 'agent';
          content: string;
          metadata?: Json;
        };
        Update: {
          session_id?: string;
          role?: 'visitor' | 'bot' | 'agent';
          content?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      chat_lead_captures: {
        Row: {
          id: string;
          session_id: string;
          visitor_name: string | null;
          phone: string | null;
          email: string | null;
          lead_score: number;
          score_reasons: string[];
          lead_id: string | null;
          converted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          visitor_name?: string | null;
          phone?: string | null;
          email?: string | null;
          lead_score?: number;
          score_reasons?: string[];
          lead_id?: string | null;
          converted?: boolean;
        };
        Update: {
          session_id?: string;
          visitor_name?: string | null;
          phone?: string | null;
          email?: string | null;
          lead_score?: number;
          score_reasons?: string[];
          lead_id?: string | null;
          converted?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Common type aliases
export type Lead = Tables<'leads'>;
export type LeadActivity = Tables<'lead_activity'>;
export type Message = Tables<'messages'>;
export type Property = Tables<'properties'>;
export type Showing = Tables<'showings'>;
export type Notification = Tables<'notifications'>;
export type Profile = Tables<'profiles'>;
export type DripSequence = Tables<'drip_sequences'>;
export type DripEnrollment = Tables<'drip_enrollments'>;
export type ChecklistTemplate = Tables<'checklist_templates'>;
export type ChecklistInstance = Tables<'checklist_instances'>;
export type CalendarCampaign = Tables<'calendar_campaigns'>;
export type EmailTemplate = Tables<'email_templates'>;
export type CmaReport = Tables<'cma_reports'>;
export type PipelineHistory = Tables<'pipeline_history'>;
export type Deal = Tables<'deals'>;
export type DealChecklist = Tables<'deal_checklists'>;
export type BehavioralEvent = Tables<'behavioral_events'>;
export type LeadImport = Tables<'lead_imports'>;
export type HomepulseReport = Tables<'homepulse_reports'>;
export type SocialContent = Tables<'social_content'>;

// MLS Integration type aliases
export type ListingRow = Tables<'listings'>;
export type ListingPriceHistory = Tables<'listing_price_history'>;
export type ListingStatusHistory = Tables<'listing_status_history'>;
export type LeadListingInteraction = Tables<'lead_listing_interactions'>;
export type ListingAlertQueue = Tables<'listing_alert_queue'>;
export type MarketSnapshot = Tables<'market_snapshots'>;
export type ComparableSale = Tables<'comparable_sales'>;
export type MLSSyncMetadata = Tables<'mls_sync_metadata'>;

// Chat system type aliases
export type ChatSession = Tables<'chat_sessions'>;
export type ChatMessage = Tables<'chat_messages'>;
export type ChatLeadCapture = Tables<'chat_lead_captures'>;

// Enum-like types
export type LeadSource = 'website' | 'referral' | 'zillow' | 'cinc' | 'google' | 'facebook' | 'social' | 'open_house' | 'cold_call' | 'other' | 'apollo' | 'instantly' | 'import';
export type LeadStatus = 'new_lead' | 'attempted_contact' | 'contacted' | 'appointment_set' | 'appointment_met' | 'active_client' | 'pending_client' | 'past_client' | 'lost';
export type LeadTemperature = 'hot' | 'warm' | 'cool' | 'cold';
export type MessageChannel = 'sms' | 'email' | 'ai_sms' | 'chatbot' | 'phone';
export type ShowingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type DealType = 'buyer' | 'seller' | 'dual';
export type DealStage = 'pre_listing' | 'active_listing' | 'under_contract' | 'pending' | 'closed' | 'fallen_through';
export type VerificationStatus = 'unverified' | 'verified' | 'bad_info' | 'do_not_contact';

// Joined query result types (for .select('*, relation(...)') patterns)
export interface ShowingWithLead extends Showing {
  leads: { first_name: string; last_name: string } | null;
}

export interface MessageWithLead extends Message {
  leads: { first_name: string; last_name: string };
}

export interface EnrollmentWithSequence extends DripEnrollment {
  drip_sequences: { name: string } | null;
}

export interface ChecklistInstanceWithTemplate extends ChecklistInstance {
  checklist_templates: { name: string; description: string | null } | null;
}
