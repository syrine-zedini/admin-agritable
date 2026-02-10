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
      account_categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          apartment_number: string | null
          building_number: string | null
          city: string
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          floor_number: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          state_province: string | null
          street_address: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          apartment_number?: string | null
          building_number?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state_province?: string | null
          street_address: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          apartment_number?: string | null
          building_number?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          floor_number?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state_province?: string | null
          street_address?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          user_id: string | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          user_id?: string | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_otp_codes: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp: string
          phone: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp: string
          phone: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
        }
        Relationships: []
      }
      b2b_ledger_entries: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          id: string
          ledger_id: string | null
          notes: string | null
          payment_proof_url: string | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["ledger_entry_type"]
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          payment_proof_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["ledger_entry_type"]
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          payment_proof_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["ledger_entry_type"]
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_ledger_entries_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "b2b_ledgers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_ledger_entries_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_ledgers: {
        Row: {
          balance: number | null
          created_at: string | null
          credit_limit: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_ledgers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_pricing: {
        Row: {
          client_id: string | null
          created_at: string | null
          custom_price: number
          discount_percentage: number | null
          id: string
          notes: string | null
          product_id: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          custom_price: number
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          custom_price?: number
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_pricing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "b2b_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string | null
          created_at: string | null
          id: string
          price_snapshot: number
          product_id: string | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string | null
          id?: string
          price_snapshot: number
          product_id?: string | null
          quantity: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string | null
          id?: string
          price_snapshot?: number
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_tags: {
        Row: {
          category: string | null
          color_hex: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          color_hex?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          color_hex?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_fr: string | null
          description_tn: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_fr: string
          name_tn?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cash_balance: {
        Row: {
          created_at: string | null
          current_balance: number
          id: string
          last_transaction_id: string | null
          last_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number
          id?: string
          last_transaction_id?: string | null
          last_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          id?: string
          last_transaction_id?: string | null
          last_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cash_balance_last_transaction_id_fkey"
            columns: ["last_transaction_id"]
            isOneToOne: false
            referencedRelation: "company_cash_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cash_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number | null
          created_at: string | null
          description: string
          direction: string
          id: string
          notes: string | null
          paid_to: string | null
          payment_method: string | null
          receipt_url: string | null
          recorded_by: string | null
          reference_number: string | null
          tags: Json | null
          transaction_date: string
          transaction_number: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before?: number | null
          created_at?: string | null
          description: string
          direction: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          tags?: Json | null
          transaction_date?: string
          transaction_number: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number | null
          created_at?: string | null
          description?: string
          direction?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          tags?: Json | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cash_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consignment_attributions: {
        Row: {
          agritable_profit: number | null
          consignment_batch_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_override: boolean | null
          order_id: string
          order_item_id: string | null
          original_attribution_id: string | null
          override_reason: string | null
          product_id: string
          quantity: number
          source_type: string
          supplier_portion: number | null
          unit_cost: number | null
        }
        Insert: {
          agritable_profit?: number | null
          consignment_batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_override?: boolean | null
          order_id: string
          order_item_id?: string | null
          original_attribution_id?: string | null
          override_reason?: string | null
          product_id: string
          quantity: number
          source_type: string
          supplier_portion?: number | null
          unit_cost?: number | null
        }
        Update: {
          agritable_profit?: number | null
          consignment_batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_override?: boolean | null
          order_id?: string
          order_item_id?: string | null
          original_attribution_id?: string | null
          override_reason?: string | null
          product_id?: string
          quantity?: number
          source_type?: string
          supplier_portion?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consignment_attributions_consignment_batch_id_fkey"
            columns: ["consignment_batch_id"]
            isOneToOne: false
            referencedRelation: "consignment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_attributions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_attributions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_attributions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_attributions_original_attribution_id_fkey"
            columns: ["original_attribution_id"]
            isOneToOne: false
            referencedRelation: "consignment_attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_attributions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "consignment_attributions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      consignment_batches: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          id: string
          initial_quantity: number
          notes: string | null
          product_id: string
          quantity_returned: number | null
          quantity_sold: number | null
          received_at: string | null
          return_date: string | null
          status: string | null
          supplier_id: string
          total_value: number
          unit: string
          unit_cost: number
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          initial_quantity: number
          notes?: string | null
          product_id: string
          quantity_returned?: number | null
          quantity_sold?: number | null
          received_at?: string | null
          return_date?: string | null
          status?: string | null
          supplier_id: string
          total_value: number
          unit: string
          unit_cost: number
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          id?: string
          initial_quantity?: number
          notes?: string | null
          product_id?: string
          quantity_returned?: number | null
          quantity_sold?: number | null
          received_at?: string | null
          return_date?: string | null
          status?: string | null
          supplier_id?: string
          total_value?: number
          unit?: string
          unit_cost?: number
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consignment_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "consignment_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_batches_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consignment_payments: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string | null
          payment_method: string
          recorded_by: string | null
          related_batch_ids: string[] | null
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date?: string | null
          payment_method: string
          recorded_by?: string | null
          related_batch_ids?: string[] | null
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string | null
          payment_method?: string
          recorded_by?: string | null
          related_batch_ids?: string[] | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consignment_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignment_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      couffin_config: {
        Row: {
          created_at: string
          fee_per_day_late: number
          id: string
          is_active: boolean
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          price_per_crate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_per_day_late?: number
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          price_per_crate: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_per_day_late?: number
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          price_per_crate?: number
          updated_at?: string
        }
        Relationships: []
      }
      couffin_items: {
        Row: {
          couffin_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          couffin_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          couffin_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "couffin_items_couffin_id_fkey"
            columns: ["couffin_id"]
            isOneToOne: false
            referencedRelation: "couffins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couffin_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "couffin_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      couffins: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_fr: string | null
          description_tn: string | null
          fee_per_day_late: number
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_available: boolean | null
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          stock_quantity: number | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          fee_per_day_late?: number
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          name_ar?: string | null
          name_fr: string
          name_tn?: string | null
          stock_quantity?: number | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          fee_per_day_late?: number
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          stock_quantity?: number | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      crate_transactions: {
        Row: {
          crate_id: string
          created_at: string
          customer_id: string
          days_unreturned: number | null
          deposit_amount: number
          fee_amount: number | null
          id: string
          issued_date: string | null
          notes: string | null
          order_id: string | null
          potential_charge_amount: number | null
          quantity: number
          returned_date: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          crate_id: string
          created_at?: string
          customer_id: string
          days_unreturned?: number | null
          deposit_amount?: number
          fee_amount?: number | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          order_id?: string | null
          potential_charge_amount?: number | null
          quantity: number
          returned_date?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          crate_id?: string
          created_at?: string
          customer_id?: string
          days_unreturned?: number | null
          deposit_amount?: number
          fee_amount?: number | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          order_id?: string | null
          potential_charge_amount?: number | null
          quantity?: number
          returned_date?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crate_transactions_crate_id_fkey"
            columns: ["crate_id"]
            isOneToOne: false
            referencedRelation: "physical_crates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crate_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crate_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverer_cash_tracking: {
        Row: {
          cash_balance: number
          created_at: string | null
          deliverer_id: string
          id: string
          last_replenishment_amount: number | null
          last_replenishment_date: string | null
          updated_at: string | null
        }
        Insert: {
          cash_balance?: number
          created_at?: string | null
          deliverer_id: string
          id?: string
          last_replenishment_amount?: number | null
          last_replenishment_date?: string | null
          updated_at?: string | null
        }
        Update: {
          cash_balance?: number
          created_at?: string | null
          deliverer_id?: string
          id?: string
          last_replenishment_amount?: number | null
          last_replenishment_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverer_cash_tracking_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverer_cash_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          created_by: string | null
          deliverer_id: string
          id: string
          notes: string | null
          po_id: string | null
          route_id: string | null
          route_stop_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          created_by?: string | null
          deliverer_id: string
          id?: string
          notes?: string | null
          po_id?: string | null
          route_id?: string | null
          route_stop_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          created_by?: string | null
          deliverer_id?: string
          id?: string
          notes?: string | null
          po_id?: string | null
          route_id?: string | null
          route_stop_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverer_cash_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverer_cash_transactions_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverer_cash_transactions_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["po_id"]
          },
          {
            foreignKeyName: "deliverer_cash_transactions_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverer_cash_transactions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverer_cash_transactions_route_stop_id_fkey"
            columns: ["route_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverer_locations: {
        Row: {
          accuracy: number | null
          created_at: string | null
          deliverer_id: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          route_id: string | null
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          deliverer_id?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          route_id?: string | null
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          deliverer_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          route_id?: string | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverer_locations_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverer_locations_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_routes: {
        Row: {
          actual_distance: number | null
          actual_duration: number | null
          completed_at: string | null
          completed_stops: number | null
          created_at: string | null
          date: string
          deliverer_id: string | null
          estimated_distance: number | null
          estimated_duration: number | null
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["route_status"] | null
          total_stops: number | null
        }
        Insert: {
          actual_distance?: number | null
          actual_duration?: number | null
          completed_at?: string | null
          completed_stops?: number | null
          created_at?: string | null
          date: string
          deliverer_id?: string | null
          estimated_distance?: number | null
          estimated_duration?: number | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["route_status"] | null
          total_stops?: number | null
        }
        Update: {
          actual_distance?: number | null
          actual_duration?: number | null
          completed_at?: string | null
          completed_stops?: number | null
          created_at?: string | null
          date?: string
          deliverer_id?: string | null
          estimated_distance?: number | null
          estimated_duration?: number | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["route_status"] | null
          total_stops?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_windows: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_bookings: number | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_bookings?: number | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_bookings?: number | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_windows_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          delivery_fee: number
          description: string | null
          free_delivery_threshold: number | null
          id: string
          is_active: boolean | null
          name: string
          places_data: Json | null
          polygon: unknown
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_fee?: number
          description?: string | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          places_data?: Json | null
          polygon?: unknown
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_fee?: number
          description?: string | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          places_data?: Json | null
          polygon?: unknown
          updated_at?: string | null
        }
        Relationships: []
      }
      demand_request_targets: {
        Row: {
          demand_request_id: string | null
          id: string
          notified_at: string | null
          supplier_id: string | null
        }
        Insert: {
          demand_request_id?: string | null
          id?: string
          notified_at?: string | null
          supplier_id?: string | null
        }
        Update: {
          demand_request_id?: string | null
          id?: string
          notified_at?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_request_targets_demand_request_id_fkey"
            columns: ["demand_request_id"]
            isOneToOne: false
            referencedRelation: "demand_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_request_targets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_requests: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          product_name: string
          quantity: number
          requested_by_admin: string | null
          status: string | null
          tagged_suppliers: string[]
          target_price: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          product_name: string
          quantity?: number
          requested_by_admin?: string | null
          status?: string | null
          tagged_suppliers?: string[]
          target_price?: number
          unit: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          product_name?: string
          quantity?: number
          requested_by_admin?: string | null
          status?: string | null
          tagged_suppliers?: string[]
          target_price?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_requests_requested_by_admin_fkey"
            columns: ["requested_by_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_responses: {
        Row: {
          availability_date: string | null
          created_at: string | null
          demand_request_id: string | null
          id: string
          notes: string | null
          price_per_unit: number
          quantity_offered: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          availability_date?: string | null
          created_at?: string | null
          demand_request_id?: string | null
          id?: string
          notes?: string | null
          price_per_unit: number
          quantity_offered: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_date?: string | null
          created_at?: string | null
          demand_request_id?: string | null
          id?: string
          notes?: string | null
          price_per_unit?: number
          quantity_offered?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_responses_demand_request_id_fkey"
            columns: ["demand_request_id"]
            isOneToOne: false
            referencedRelation: "demand_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_responses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_responses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_statement_entries: {
        Row: {
          account_category_id: string | null
          created_at: string | null
          credit_amount: number
          customer_type: string | null
          debit_amount: number
          description: string
          entry_number: string
          id: string
          notes: string | null
          payment_method: string | null
          related_entity_id: string | null
          related_entity_name: string | null
          related_entity_type: string | null
          source_id: string
          source_table: string
          tags: Json | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          account_category_id?: string | null
          created_at?: string | null
          credit_amount?: number
          customer_type?: string | null
          debit_amount?: number
          description: string
          entry_number: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          source_id: string
          source_table: string
          tags?: Json | null
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          account_category_id?: string | null
          created_at?: string | null
          credit_amount?: number
          customer_type?: string | null
          debit_amount?: number
          description?: string
          entry_number?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          source_id?: string
          source_table?: string
          tags?: Json | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_statement_entries_account_category_id_fkey"
            columns: ["account_category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          auto_convert_enabled: boolean | null
          auto_convert_threshold: number | null
          created_at: string | null
          id: string
          lifetime_points: number | null
          points_balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_convert_enabled?: boolean | null
          auto_convert_threshold?: number | null
          created_at?: string | null
          id?: string
          lifetime_points?: number | null
          points_balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_convert_enabled?: boolean | null
          auto_convert_threshold?: number | null
          created_at?: string | null
          id?: string
          lifetime_points?: number | null
          points_balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_configuration: {
        Row: {
          auto_conversion_enabled: boolean | null
          conversion_rate_tnd: number | null
          conversion_threshold: number | null
          created_at: string | null
          enabled: boolean | null
          id: string
          points_per_tnd: number | null
          tier_system_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_conversion_enabled?: boolean | null
          conversion_rate_tnd?: number | null
          conversion_threshold?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          points_per_tnd?: number | null
          tier_system_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_conversion_enabled?: boolean | null
          conversion_rate_tnd?: number | null
          conversion_threshold?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          points_per_tnd?: number | null
          tier_system_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_product_rules: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          points_per_unit: number
          product_id: string | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_per_unit: number
          product_id?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          points_per_unit?: number
          product_id?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_product_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_product_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "loyalty_product_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          lifetime_points_threshold: number
          name: string
          points_multiplier: number | null
          tier_level: number
          updated_at: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          lifetime_points_threshold: number
          name: string
          points_multiplier?: number | null
          tier_level: number
          updated_at?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          lifetime_points_threshold?: number
          name?: string
          points_multiplier?: number | null
          tier_level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          account_id: string | null
          balance_after: number
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Insert: {
          account_id?: string | null
          balance_after: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Update: {
          account_id?: string | null
          balance_after?: number
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          enable_email: boolean | null
          enable_in_app: boolean | null
          enable_push: boolean | null
          enable_sms: boolean | null
          id: string
          order_updates: boolean | null
          payment_updates: boolean | null
          promotions: boolean | null
          system_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_email?: boolean | null
          enable_in_app?: boolean | null
          enable_push?: boolean | null
          enable_sms?: boolean | null
          id?: string
          order_updates?: boolean | null
          payment_updates?: boolean | null
          promotions?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_email?: boolean | null
          enable_in_app?: boolean | null
          enable_push?: boolean | null
          enable_sms?: boolean | null
          id?: string
          order_updates?: boolean | null
          payment_updates?: boolean | null
          promotions?: boolean | null
          system_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          channels: Database["public"]["Enums"]["notification_channel"][]
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          sent_email: boolean | null
          sent_push: boolean | null
          sent_sms: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_email?: boolean | null
          sent_push?: boolean | null
          sent_sms?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          channels?: Database["public"]["Enums"]["notification_channel"][]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sent_email?: boolean | null
          sent_push?: boolean | null
          sent_sms?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_crates: {
        Row: {
          all_returned: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          crate_id: string
          created_at: string | null
          id: string
          order_id: string
          quantity: number
          returned_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          all_returned?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          crate_id: string
          created_at?: string | null
          id?: string
          order_id: string
          quantity?: number
          returned_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          all_returned?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          crate_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          quantity?: number
          returned_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_crates_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_crates_crate_id_fkey"
            columns: ["crate_id"]
            isOneToOne: false
            referencedRelation: "physical_crates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_crates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          picked_quantity: number | null
          product_id: string | null
          product_image_url: string | null
          product_name_ar: string | null
          product_name_fr: string
          product_name_tn: string | null
          product_sku: string | null
          quantity: number
          replacement_notes: string | null
          replacement_product_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          picked_quantity?: number | null
          product_id?: string | null
          product_image_url?: string | null
          product_name_ar?: string | null
          product_name_fr: string
          product_name_tn?: string | null
          product_sku?: string | null
          quantity: number
          replacement_notes?: string | null
          replacement_product_id?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          picked_quantity?: number | null
          product_id?: string | null
          product_image_url?: string | null
          product_name_ar?: string | null
          product_name_fr?: string
          product_name_tn?: string | null
          product_sku?: string | null
          quantity?: number
          replacement_notes?: string | null
          replacement_product_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_replacement_product_id_fkey"
            columns: ["replacement_product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_replacement_product_id_fkey"
            columns: ["replacement_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          approval_notes: string | null
          approval_threshold: number | null
          approved_at: string | null
          approved_by: string | null
          assigned_deliverer_at: string | null
          assigned_picker_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_reference: string | null
          created_at: string | null
          customer_feedback: string | null
          customer_rating: number | null
          delivered_at: string | null
          deliverer_id: string | null
          delivery_address_id: string | null
          delivery_fee: number | null
          delivery_notes: string | null
          delivery_window_id: string | null
          department: string | null
          discount: number | null
          id: string
          invoice_file_url: string | null
          invoice_generated_at: string | null
          invoice_number: string | null
          is_recurring_order: boolean | null
          metadata: Json | null
          notes: string | null
          order_number: string
          original_total_amount: number | null
          out_for_delivery_at: string | null
          paid_at: string | null
          parent_recurring_order_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string | null
          picker_id: string | null
          picking_completed_at: string | null
          picking_started_at: string | null
          po_file_url: string | null
          po_number: string | null
          quote_modification_notes: string | null
          quote_notes: string | null
          quote_requested_at: string | null
          quote_reviewed_at: string | null
          quote_reviewed_by: string | null
          quote_valid_until: string | null
          ready_for_pickup_at: string | null
          recurring_schedule_id: string | null
          requires_approval: boolean | null
          requires_customer_confirmation: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_deliverer_at?: string | null
          assigned_picker_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_reference?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          deliverer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number | null
          delivery_notes?: string | null
          delivery_window_id?: string | null
          department?: string | null
          discount?: number | null
          id?: string
          invoice_file_url?: string | null
          invoice_generated_at?: string | null
          invoice_number?: string | null
          is_recurring_order?: boolean | null
          metadata?: Json | null
          notes?: string | null
          order_number: string
          original_total_amount?: number | null
          out_for_delivery_at?: string | null
          paid_at?: string | null
          parent_recurring_order_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          picker_id?: string | null
          picking_completed_at?: string | null
          picking_started_at?: string | null
          po_file_url?: string | null
          po_number?: string | null
          quote_modification_notes?: string | null
          quote_notes?: string | null
          quote_requested_at?: string | null
          quote_reviewed_at?: string | null
          quote_reviewed_by?: string | null
          quote_valid_until?: string | null
          ready_for_pickup_at?: string | null
          recurring_schedule_id?: string | null
          requires_approval?: boolean | null
          requires_customer_confirmation?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_deliverer_at?: string | null
          assigned_picker_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_reference?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          deliverer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number | null
          delivery_notes?: string | null
          delivery_window_id?: string | null
          department?: string | null
          discount?: number | null
          id?: string
          invoice_file_url?: string | null
          invoice_generated_at?: string | null
          invoice_number?: string | null
          is_recurring_order?: boolean | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          original_total_amount?: number | null
          out_for_delivery_at?: string | null
          paid_at?: string | null
          parent_recurring_order_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          picker_id?: string | null
          picking_completed_at?: string | null
          picking_started_at?: string | null
          po_file_url?: string | null
          po_number?: string | null
          quote_modification_notes?: string | null
          quote_notes?: string | null
          quote_requested_at?: string | null
          quote_reviewed_at?: string | null
          quote_reviewed_by?: string | null
          quote_valid_until?: string | null
          ready_for_pickup_at?: string | null
          recurring_schedule_id?: string | null
          requires_approval?: boolean | null
          requires_customer_confirmation?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_delivery_window"
            columns: ["delivery_window_id"]
            isOneToOne: false
            referencedRelation: "delivery_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_parent_recurring_order_id_fkey"
            columns: ["parent_recurring_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_picker_id_fkey"
            columns: ["picker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_reviewed_by_fkey"
            columns: ["quote_reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          failed_at: string | null
          gateway_callback_url: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          initiated_at: string | null
          metadata: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          order_id: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          gateway_callback_url?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          failed_at?: string | null
          gateway_callback_url?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_crates: {
        Row: {
          capacity_liters: number | null
          created_at: string | null
          description_ar: string | null
          description_fr: string | null
          description_tn: string | null
          dimensions_cm: string | null
          fee_per_day_late: number | null
          id: string
          is_active: boolean | null
          is_standard_couffin: boolean | null
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          price_per_crate: number
          total_inventory: number | null
          updated_at: string | null
        }
        Insert: {
          capacity_liters?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          dimensions_cm?: string | null
          fee_per_day_late?: number | null
          id?: string
          is_active?: boolean | null
          is_standard_couffin?: boolean | null
          name_ar?: string | null
          name_fr: string
          name_tn?: string | null
          price_per_crate?: number
          total_inventory?: number | null
          updated_at?: string | null
        }
        Update: {
          capacity_liters?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          dimensions_cm?: string | null
          fee_per_day_late?: number | null
          id?: string
          is_active?: boolean | null
          is_standard_couffin?: boolean | null
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          price_per_crate?: number
          total_inventory?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_suppliers: {
        Row: {
          assigned_deliverer_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_supply_date: string | null
          notes: string | null
          pickup_date: string | null
          product_id: string
          supplier_id: string
          supplier_price: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_deliverer_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_supply_date?: string | null
          notes?: string | null
          pickup_date?: string | null
          product_id: string
          supplier_id: string
          supplier_price?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_deliverer_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_supply_date?: string | null
          notes?: string | null
          pickup_date?: string | null
          product_id?: string
          supplier_id?: string
          supplier_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_assigned_deliverer_id_fkey"
            columns: ["assigned_deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          b2b_base_price: number | null
          b2b_multiplier: number | null
          b2b_ratio: number | null
          b2b_selling_quantity: number | null
          b2b_selling_unit: string | null
          b2c_multiplier: number | null
          b2c_ratio: number | null
          b2c_selling_quantity: number | null
          b2c_selling_unit: string | null
          besoin: number | null
          category_id: string | null
          commande: number | null
          consignment_stock: number | null
          cost_price: number | null
          created_at: string | null
          deleted_at: string | null
          description_ar: string | null
          description_fr: string | null
          description_tn: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          is_organic: boolean | null
          is_seasonal: boolean | null
          low_stock_threshold: number | null
          max_order_quantity: number | null
          meta_description: string | null
          meta_title: string | null
          min_order_quantity: number | null
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          ordering_info: string | null
          origin_country: string | null
          origin_region: string | null
          popularity_score: number | null
          price: number
          prix_sur_site: number | null
          purchase_unit: string | null
          quality_grade: string | null
          search_vector_ar: unknown
          search_vector_fr: unknown
          search_vector_tn: unknown
          season_end_month: number | null
          season_start_month: number | null
          sku: string
          stock_quantity: number | null
          stock_warehouse: string | null
          tags: Json | null
          unit: string
          unit_size: string | null
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          b2b_base_price?: number | null
          b2b_multiplier?: number | null
          b2b_ratio?: number | null
          b2b_selling_quantity?: number | null
          b2b_selling_unit?: string | null
          b2c_multiplier?: number | null
          b2c_ratio?: number | null
          b2c_selling_quantity?: number | null
          b2c_selling_unit?: string | null
          besoin?: number | null
          category_id?: string | null
          commande?: number | null
          consignment_stock?: number | null
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_organic?: boolean | null
          is_seasonal?: boolean | null
          low_stock_threshold?: number | null
          max_order_quantity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_order_quantity?: number | null
          name_ar?: string | null
          name_fr: string
          name_tn?: string | null
          ordering_info?: string | null
          origin_country?: string | null
          origin_region?: string | null
          popularity_score?: number | null
          price: number
          prix_sur_site?: number | null
          purchase_unit?: string | null
          quality_grade?: string | null
          search_vector_ar?: unknown
          search_vector_fr?: unknown
          search_vector_tn?: unknown
          season_end_month?: number | null
          season_start_month?: number | null
          sku: string
          stock_quantity?: number | null
          stock_warehouse?: string | null
          tags?: Json | null
          unit: string
          unit_size?: string | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          b2b_base_price?: number | null
          b2b_multiplier?: number | null
          b2b_ratio?: number | null
          b2b_selling_quantity?: number | null
          b2b_selling_unit?: string | null
          b2c_multiplier?: number | null
          b2c_ratio?: number | null
          b2c_selling_quantity?: number | null
          b2c_selling_unit?: string | null
          besoin?: number | null
          category_id?: string | null
          commande?: number | null
          consignment_stock?: number | null
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_organic?: boolean | null
          is_seasonal?: boolean | null
          low_stock_threshold?: number | null
          max_order_quantity?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_order_quantity?: number | null
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          ordering_info?: string | null
          origin_country?: string | null
          origin_region?: string | null
          popularity_score?: number | null
          price?: number
          prix_sur_site?: number | null
          purchase_unit?: string | null
          quality_grade?: string | null
          search_vector_ar?: unknown
          search_vector_fr?: unknown
          search_vector_tn?: unknown
          season_end_month?: number | null
          season_start_month?: number | null
          sku?: string
          stock_quantity?: number | null
          stock_warehouse?: string | null
          tags?: Json | null
          unit?: string
          unit_size?: string | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          advance_payment_amount: number | null
          advance_payment_percentage: number | null
          advance_payment_type: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_deliverer_id: string | null
          collection_window_end: string | null
          collection_window_start: string | null
          created_at: string
          created_by: string | null
          draft_notes: string | null
          id: string
          notes: string | null
          pickup_date: string | null
          po_number: string
          product_id: string
          quantity: number
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          supplier_id: string
          total_amount: number
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          advance_payment_amount?: number | null
          advance_payment_percentage?: number | null
          advance_payment_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_deliverer_id?: string | null
          collection_window_end?: string | null
          collection_window_start?: string | null
          created_at?: string
          created_by?: string | null
          draft_notes?: string | null
          id?: string
          notes?: string | null
          pickup_date?: string | null
          po_number: string
          product_id: string
          quantity: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          supplier_id: string
          total_amount: number
          unit: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          advance_payment_amount?: number | null
          advance_payment_percentage?: number | null
          advance_payment_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_deliverer_id?: string | null
          collection_window_end?: string | null
          collection_window_start?: string | null
          created_at?: string
          created_by?: string | null
          draft_notes?: string | null
          id?: string
          notes?: string | null
          pickup_date?: string | null
          po_number?: string
          product_id?: string
          quantity?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_assigned_deliverer_id_fkey"
            columns: ["assigned_deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recette_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          recette_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          recette_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          recette_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "recette_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "recette_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recette_items_recette_id_fkey"
            columns: ["recette_id"]
            isOneToOne: false
            referencedRelation: "recettes"
            referencedColumns: ["id"]
          },
        ]
      }
      recettes: {
        Row: {
          cooking_time_minutes: number | null
          created_at: string | null
          description_ar: string | null
          description_fr: string | null
          description_tn: string | null
          difficulty: string
          id: string
          image_url: string | null
          images: Json | null
          instructions_ar: string | null
          instructions_fr: string | null
          instructions_tn: string | null
          is_active: boolean | null
          is_available: boolean | null
          name_ar: string | null
          name_fr: string
          name_tn: string | null
          preparation_time_minutes: number | null
          servings: number
          stock_quantity: number | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          cooking_time_minutes?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          difficulty?: string
          id?: string
          image_url?: string | null
          images?: Json | null
          instructions_ar?: string | null
          instructions_fr?: string | null
          instructions_tn?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          name_ar?: string | null
          name_fr: string
          name_tn?: string | null
          preparation_time_minutes?: number | null
          servings?: number
          stock_quantity?: number | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          cooking_time_minutes?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_fr?: string | null
          description_tn?: string | null
          difficulty?: string
          id?: string
          image_url?: string | null
          images?: Json | null
          instructions_ar?: string | null
          instructions_fr?: string | null
          instructions_tn?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          name_ar?: string | null
          name_fr?: string
          name_tn?: string | null
          preparation_time_minutes?: number | null
          servings?: number
          stock_quantity?: number | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_order_schedules: {
        Row: {
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          delivery_address_id: string | null
          delivery_window_id: string | null
          end_date: string | null
          frequency: string
          frequency_value: number
          id: string
          is_active: boolean | null
          name: string
          next_order_date: string | null
          notes: string | null
          start_date: string
          template_order_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_address_id?: string | null
          delivery_window_id?: string | null
          end_date?: string | null
          frequency: string
          frequency_value?: number
          id?: string
          is_active?: boolean | null
          name: string
          next_order_date?: string | null
          notes?: string | null
          start_date: string
          template_order_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          delivery_address_id?: string | null
          delivery_window_id?: string | null
          end_date?: string | null
          frequency?: string
          frequency_value?: number
          id?: string
          is_active?: boolean | null
          name?: string
          next_order_date?: string | null
          notes?: string | null
          start_date?: string
          template_order_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_order_schedules_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_order_schedules_delivery_window_id_fkey"
            columns: ["delivery_window_id"]
            isOneToOne: false
            referencedRelation: "delivery_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_order_schedules_template_order_id_fkey"
            columns: ["template_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_order_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          program_id: string | null
          referrer_id: string | null
          updated_at: string | null
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          program_id?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          program_id?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_programs: {
        Row: {
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_referee: number | null
          name: string
          type: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_referee?: number | null
          name: string
          type: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_referee?: number | null
          name?: string
          type?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      referral_usages: {
        Row: {
          code_id: string | null
          commission_amount: number | null
          commission_paid: boolean | null
          commission_paid_at: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          referee_id: string | null
        }
        Insert: {
          code_id?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          referee_id?: string | null
        }
        Update: {
          code_id?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          referee_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_usages_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_usages_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_points: {
        Row: {
          address: string
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at: string | null
          zone_id: string
        }
        Insert: {
          address: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          updated_at?: string | null
          zone_id: string
        }
        Update: {
          address?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_points_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          actual_arrival: string | null
          actual_arrival_time: string | null
          actual_departure_time: string | null
          address_id: string | null
          admin_verification: Json | null
          advance_payment_amount: number | null
          advance_payment_status: string | null
          collection_notes: string | null
          collection_products: Json | null
          collection_status: string | null
          collection_window_end: string | null
          collection_window_start: string | null
          completed_at: string | null
          created_at: string | null
          deliverer_verification: Json | null
          estimated_arrival: string | null
          failure_reason: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          order_id: string | null
          payment_amount_paid: number | null
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_recorded_by: string | null
          route_id: string | null
          status: string | null
          stop_order: number
          stop_type: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          address_id?: string | null
          admin_verification?: Json | null
          advance_payment_amount?: number | null
          advance_payment_status?: string | null
          collection_notes?: string | null
          collection_products?: Json | null
          collection_status?: string | null
          collection_window_end?: string | null
          collection_window_start?: string | null
          completed_at?: string | null
          created_at?: string | null
          deliverer_verification?: Json | null
          estimated_arrival?: string | null
          failure_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_id?: string | null
          payment_amount_paid?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_recorded_by?: string | null
          route_id?: string | null
          status?: string | null
          stop_order: number
          stop_type?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          address_id?: string | null
          admin_verification?: Json | null
          advance_payment_amount?: number | null
          advance_payment_status?: string | null
          collection_notes?: string | null
          collection_products?: Json | null
          collection_status?: string | null
          collection_window_end?: string | null
          collection_window_start?: string | null
          completed_at?: string | null
          created_at?: string | null
          deliverer_verification?: Json | null
          estimated_arrival?: string | null
          failure_reason?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_id?: string | null
          payment_amount_paid?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_recorded_by?: string | null
          route_id?: string | null
          status?: string | null
          stop_order?: number
          stop_type?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_payment_recorded_by_fkey"
            columns: ["payment_recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          ip_address: unknown
          result_count: number | null
          search_query: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          ip_address?: unknown
          result_count?: number | null
          search_query: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          ip_address?: unknown
          result_count?: number | null
          search_query?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stock_transactions: {
        Row: {
          created_at: string
          id: string
          new_stock: number
          notes: string | null
          performed_by: string | null
          previous_stock: number
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_stock: number
          notes?: string | null
          performed_by?: string | null
          previous_stock: number
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          new_stock?: number
          notes?: string | null
          performed_by?: string | null
          previous_stock?: number
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_spreadsheet_data"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_offers: {
        Row: {
          admin_notes: string | null
          approved_quantity: number | null
          availability_date: string | null
          created_at: string | null
          id: string
          images: Json | null
          price_per_unit: number
          product_name: string
          quantity: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          supplier_id: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_quantity?: number | null
          availability_date?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          price_per_unit: number
          product_name: string
          quantity: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supplier_id?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_quantity?: number | null
          availability_date?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          price_per_unit?: number
          product_name?: string
          quantity?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_offers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          recorded_by: string | null
          related_collections: string[] | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method: string
          recorded_by?: string | null
          related_collections?: string[] | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
          related_collections?: string[] | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversions: {
        Row: {
          base_unit: string
          base_unit_factor: number
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          unit_category: string
          unit_code: string
          unit_label: string
        }
        Insert: {
          base_unit: string
          base_unit_factor: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          unit_category: string
          unit_code: string
          unit_label: string
        }
        Update: {
          base_unit?: string
          base_unit_factor?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          unit_category?: string
          unit_code?: string
          unit_label?: string
        }
        Relationships: []
      }
      user_spreadsheet_preferences: {
        Row: {
          collapsed_groups: Json | null
          color_preferences: Json | null
          created_at: string | null
          id: string
          selected_b2b_clients: Json | null
          updated_at: string | null
          user_id: string
          visible_columns: Json | null
        }
        Insert: {
          collapsed_groups?: Json | null
          color_preferences?: Json | null
          created_at?: string | null
          id?: string
          selected_b2b_clients?: Json | null
          updated_at?: string | null
          user_id: string
          visible_columns?: Json | null
        }
        Update: {
          collapsed_groups?: Json | null
          color_preferences?: Json | null
          created_at?: string | null
          id?: string
          selected_b2b_clients?: Json | null
          updated_at?: string | null
          user_id?: string
          visible_columns?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_spreadsheet_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          business_documents: Json | null
          business_registration_number: string | null
          company_name: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          id: string
          institution_type: string | null
          is_active: boolean | null
          is_depot_vente: boolean | null
          is_suspended: boolean | null
          last_login_at: string | null
          last_name: string | null
          latitude: number | null
          location: string | null
          location_source: string | null
          location_verified_at: string | null
          location_verified_by: string | null
          longitude: number | null
          phone: string | null
          phone_verified: boolean | null
          preferred_language: Database["public"]["Enums"]["language"] | null
          profile_validated: boolean | null
          specialty: string | null
          suspension_reason: string | null
          tax_id: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          validation_status: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_documents?: Json | null
          business_registration_number?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id: string
          institution_type?: string | null
          is_active?: boolean | null
          is_depot_vente?: boolean | null
          is_suspended?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          location_source?: string | null
          location_verified_at?: string | null
          location_verified_by?: string | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: Database["public"]["Enums"]["language"] | null
          profile_validated?: boolean | null
          specialty?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_documents?: Json | null
          business_registration_number?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean | null
          is_depot_vente?: boolean | null
          is_suspended?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          location_source?: string | null
          location_verified_at?: string | null
          location_verified_by?: string | null
          longitude?: number | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_language?: Database["public"]["Enums"]["language"] | null
          profile_validated?: boolean | null
          specialty?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_location_verified_by_fkey"
            columns: ["location_verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          negative_balance_limit: number | null
          negative_balance_sources: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          negative_balance_limit?: number | null
          negative_balance_sources?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          negative_balance_limit?: number | null
          negative_balance_sources?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_search_stats: {
        Row: {
          avg_results_per_search: number | null
          failed_searches: number | null
          search_date: string | null
          total_searches: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      failed_searches: {
        Row: {
          last_searched: string | null
          search_count: number | null
          search_query: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      pricing_spreadsheet_data: {
        Row: {
          assigned_deliverer_id: string | null
          b2b_base_price: number | null
          b2b_multiplier: number | null
          b2b_price_calculated: number | null
          b2b_ratio: number | null
          b2b_selling_quantity: number | null
          b2b_selling_unit: string | null
          b2c_multiplier: number | null
          b2c_prix_de_vente_calculated: number | null
          b2c_ratio: number | null
          b2c_selling_quantity: number | null
          b2c_selling_unit: string | null
          besoin: number | null
          category_id: string | null
          category_name: string | null
          commande: number | null
          created_at: string | null
          deliverer_first_name: string | null
          deliverer_last_name: string | null
          deliverer_name: string | null
          deliverer_vehicle_type: string | null
          has_price_override: boolean | null
          is_active: boolean | null
          last_supply_date: string | null
          low_stock_threshold: number | null
          moq: number | null
          ordering_info: string | null
          pickup_date: string | null
          po_created_at: string | null
          po_draft_notes: string | null
          po_id: string | null
          po_number: string | null
          po_status: string | null
          po_total_amount: number | null
          primary_supplier_id: string | null
          prix_sur_site: number | null
          product_id: string | null
          product_name: string | null
          purchase_price: number | null
          purchase_unit: string | null
          sku: string | null
          stock: number | null
          stock_warehouse: string | null
          supplier_company_name: string | null
          supplier_first_name: string | null
          supplier_is_active: boolean | null
          supplier_last_name: string | null
          supplier_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_assigned_deliverer_id_fkey"
            columns: ["assigned_deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["primary_supplier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      top_searches: {
        Row: {
          avg_results: number | null
          last_searched: string | null
          search_count: number | null
          search_query: string | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      assign_next_picker: { Args: never; Returns: string }
      bulk_assign_deliverer: {
        Args: {
          deliverer_id: string
          pickup_date?: string
          product_ids: string[]
          supplier_id: string
        }
        Returns: Json
      }
      bulk_assign_supplier: {
        Args: { product_ids: string[]; supplier_id: string }
        Returns: Json
      }
      bulk_update_product_prices: {
        Args: {
          field_name: string
          product_ids: string[]
          update_mode: string
          update_value: number
        }
        Returns: Json
      }
      bulk_update_product_stock: {
        Args: {
          field_name: string
          product_ids: string[]
          update_mode: string
          update_value: number
        }
        Returns: Json
      }
      calculate_conversion_ratio: {
        Args: {
          purchase_unit_code: string
          selling_quantity: number
          selling_unit_code: string
        }
        Returns: number
      }
      check_deliverer_cash_balance: {
        Args: { p_deliverer_id: string; p_required_amount: number }
        Returns: boolean
      }
      check_deliverer_route_availability: {
        Args: { p_deliverer_id: string; p_pickup_date: string }
        Returns: boolean
      }
      check_low_stock: {
        Args: never
        Returns: {
          product_id: string
          product_name: string
          stock: number
          threshold: number
        }[]
      }
      check_zone_overlap: {
        Args: { exclude_zone_id?: string; new_polygon: unknown }
        Returns: {
          overlap_area: number
          overlapping_zone_id: string
          overlapping_zone_name: string
        }[]
      }
      combine_zone_polygons: {
        Args: { geojson_array: Json[] }
        Returns: unknown
      }
      convert_unit: {
        Args: { from_unit: string; to_unit: string; value: number }
        Returns: number
      }
      create_income_statement_entry: {
        Args: {
          p_account_category_name: string
          p_credit_amount: number
          p_customer_type?: string
          p_debit_amount: number
          p_description: string
          p_notes?: string
          p_payment_method?: string
          p_related_entity_id?: string
          p_related_entity_name?: string
          p_related_entity_type?: string
          p_source_id: string
          p_source_table: string
          p_tags?: Json
          p_transaction_date: string
          p_transaction_type: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_body: string
          p_channels?: Database["public"]["Enums"]["notification_channel"][]
          p_metadata?: Json
          p_reference_id?: string
          p_reference_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      delete_income_statement_entry_by_source: {
        Args: { p_source_id: string; p_source_table: string }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_income_statement_entry_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_account_category_id: {
        Args: { category_name: string }
        Returns: string
      }
      get_available_windows: {
        Args: { p_date: string; p_zone_id: string }
        Returns: {
          available_slots: number
          day_of_week: number
          end_time: string
          start_time: string
          window_id: string
        }[]
      }
      get_b2b_debt_users: {
        Args: never
        Returns: {
          balance: number
          business_name: string
          credit_limit: number
          phone: string
          user_id: string
        }[]
      }
      get_category_tree: { Args: never; Returns: Json }
      get_financial_analytics: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      get_ledger_balance: { Args: { p_user_id: string }; Returns: number }
      get_negative_balance_users: {
        Args: never
        Returns: {
          balance: number
          user_id: string
          user_name: string
          user_phone: string
        }[]
      }
      get_operational_analytics: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      get_pending_collections: {
        Args: never
        Returns: {
          advance_payment_amount: number
          collection_products: Json
          collection_status: string
          route_id: string
          route_stop_id: string
          scheduled_time: string
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_product_price: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: number
      }
      get_sales_analytics: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      get_supplier_payment_summary: {
        Args: { supplier_uuid: string }
        Returns: {
          outstanding_balance: number
          total_payments_made: number
          total_pending_collections: number
        }[]
      }
      get_unread_count: { Args: { p_user_id: string }; Returns: number }
      get_user_analytics: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      get_user_loyalty_tier: { Args: { p_user_id: string }; Returns: string }
      get_user_permissions: { Args: { p_user_id: string }; Returns: string[] }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_wallet_balance: { Args: { p_user_id: string }; Returns: number }
      get_zone_area_km2: { Args: { polygon_geom: unknown }; Returns: number }
      get_zone_for_address: {
        Args: { p_lat: number; p_lng: number }
        Returns: {
          delivery_fee: number
          zone_id: string
          zone_name: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      grant_role_permissions: {
        Args: { p_granted_by?: string; p_role_name: string; p_user_id: string }
        Returns: undefined
      }
      has_permission: {
        Args: { permission_name: string; user_id: string }
        Returns: boolean
      }
      is_product_available: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      ledger_transaction: {
        Args: {
          p_amount: number
          p_notes?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: Database["public"]["Enums"]["ledger_entry_type"]
          p_user_id: string
        }
        Returns: string
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      loyalty_transaction: {
        Args: {
          p_description?: string
          p_points: number
          p_reference_id?: string
          p_reference_type?: string
          p_type: Database["public"]["Enums"]["loyalty_transaction_type"]
          p_user_id: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      optimize_route_stop_order: {
        Args: { p_route_id: string }
        Returns: undefined
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      record_company_cash_transaction: {
        Args: {
          p_amount: number
          p_description: string
          p_direction: string
          p_notes?: string
          p_paid_to?: string
          p_payment_method?: string
          p_receipt_url?: string
          p_recorded_by?: string
          p_reference_number?: string
          p_tags: Json
          p_type: string
        }
        Returns: string
      }
      revoke_all_permissions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      search_products: {
        Args: {
          p_category_id?: string
          p_in_stock_only?: boolean
          p_language?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          category_id: string
          category_name_ar: string
          category_name_fr: string
          category_name_tn: string
          description_ar: string
          description_fr: string
          description_tn: string
          id: string
          images: Json
          is_active: boolean
          low_stock_threshold: number
          name_ar: string
          name_fr: string
          name_tn: string
          price: number
          rank: number
          stock_quantity: number
          unit: string
        }[]
      }
      set_default_address: { Args: { address_id: string }; Returns: undefined }
      simplify_zone_polygon: {
        Args: { polygon_geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      suggest_products: {
        Args: { p_language?: string; p_limit?: number; p_query: string }
        Returns: {
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_deliverer_cash_balance: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_deliverer_id: string
          p_notes?: string
          p_po_id?: string
          p_route_id?: string
          p_route_stop_id?: string
          p_transaction_type: string
        }
        Returns: string
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      validate_cart: { Args: { p_cart_id: string }; Returns: Json }
      validate_referral_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      validate_zone_polygon: {
        Args: { polygon_geom: unknown }
        Returns: boolean
      }
      wallet_transaction: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: Database["public"]["Enums"]["wallet_transaction_type"]
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      language: "fr" | "ar" | "tn"
      ledger_entry_type:
        | "order_debt"
        | "payment_credit"
        | "adjustment"
        | "credit_limit_change"
      loyalty_transaction_type:
        | "earned"
        | "redeemed"
        | "converted"
        | "expired"
        | "adjusted"
      notification_channel: "sms" | "email" | "push" | "in_app"
      order_status:
        | "quote_pending"
        | "quote_modified"
        | "quote_approved"
        | "quote_rejected"
        | "placed"
        | "preparing"
        | "ready_for_pickup"
        | "on_the_way"
        | "delivered"
        | "cancelled"
      payment_method:
        | "clicktopay"
        | "cash"
        | "check"
        | "bank_transfer"
        | "wallet"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      route_status: "pending" | "in_progress" | "completed"
      user_type: "b2c" | "b2b" | "supplier" | "picker" | "deliverer" | "admin"
      wallet_transaction_type:
        | "recharge"
        | "payment"
        | "refund"
        | "loyalty_conversion"
        | "crate_charge"
        | "adjustment"
        | "referral_bonus"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      language: ["fr", "ar", "tn"],
      ledger_entry_type: [
        "order_debt",
        "payment_credit",
        "adjustment",
        "credit_limit_change",
      ],
      loyalty_transaction_type: [
        "earned",
        "redeemed",
        "converted",
        "expired",
        "adjusted",
      ],
      notification_channel: ["sms", "email", "push", "in_app"],
      order_status: [
        "quote_pending",
        "quote_modified",
        "quote_approved",
        "quote_rejected",
        "placed",
        "preparing",
        "ready_for_pickup",
        "on_the_way",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "clicktopay",
        "cash",
        "check",
        "bank_transfer",
        "wallet",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      route_status: ["pending", "in_progress", "completed"],
      user_type: ["b2c", "b2b", "supplier", "picker", "deliverer", "admin"],
      wallet_transaction_type: [
        "recharge",
        "payment",
        "refund",
        "loyalty_conversion",
        "crate_charge",
        "adjustment",
        "referral_bonus",
      ],
    },
  },
} as const
