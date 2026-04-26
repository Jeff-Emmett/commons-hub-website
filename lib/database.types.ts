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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accommodation_offerings: {
        Row: {
          accommodation_type: Database["public"]["Enums"]["accommodation_type"]
          created_at: string | null
          description: string | null
          id: number
          image: string | null
          is_active: boolean | null
          is_exclusive: boolean | null
          name: string
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          accommodation_type: Database["public"]["Enums"]["accommodation_type"]
          created_at?: string | null
          description?: string | null
          id?: never
          image?: string | null
          is_active?: boolean | null
          is_exclusive?: boolean | null
          name: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          accommodation_type?: Database["public"]["Enums"]["accommodation_type"]
          created_at?: string | null
          description?: string | null
          id?: never
          image?: string | null
          is_active?: boolean | null
          is_exclusive?: boolean | null
          name?: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      accommodation_prices: {
        Row: {
          accommodation_offering_id: number
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          id: number
          is_active: boolean | null
          price: number
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          accommodation_offering_id: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: never
          is_active?: boolean | null
          price: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          accommodation_offering_id?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: never
          is_active?: boolean | null
          price?: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_prices_accommodation_offering_id_fkey"
            columns: ["accommodation_offering_id"]
            isOneToOne: false
            referencedRelation: "accommodation_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      accordion_items: {
        Row: {
          accordion_id: number | null
          content: string | null
          date_created: string | null
          date_updated: string | null
          header: string | null
          id: number
          main_image: string | null
          sort: number | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          accordion_id?: number | null
          content?: string | null
          date_created?: string | null
          date_updated?: string | null
          header?: string | null
          id?: never
          main_image?: string | null
          sort?: number | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          accordion_id?: number | null
          content?: string | null
          date_created?: string | null
          date_updated?: string | null
          header?: string | null
          id?: never
          main_image?: string | null
          sort?: number | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accordion_items_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "accordions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accordion_items_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "accordion_items_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["accordion_id"]
          },
        ]
      }
      accordions: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          name_not_used: string | null
          status: Database["public"]["Enums"]["page_status"] | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          name_not_used?: string | null
          status?: Database["public"]["Enums"]["page_status"] | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          name_not_used?: string | null
          status?: Database["public"]["Enums"]["page_status"] | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address: string
          city: string
          country_id: number
          created_at: string | null
          id: number
          is_active: boolean | null
          profile_id: number
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          country_id: number
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          profile_id: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          country_id?: number
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          profile_id?: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_type: Database["public"]["Enums"]["bed_type"]
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          room_id: number | null
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          bed_type: Database["public"]["Enums"]["bed_type"]
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          room_id?: number | null
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          bed_type?: Database["public"]["Enums"]["bed_type"]
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          room_id?: number | null
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_items: {
        Row: {
          button_link: string | null
          carousel_id: number | null
          date_created: string | null
          date_updated: string | null
          id: number
          image: string | null
          image_url: string | null
          quote: string | null
          sort: number | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          button_link?: string | null
          carousel_id?: number | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          image?: string | null
          image_url?: string | null
          quote?: string | null
          sort?: number | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          button_link?: string | null
          carousel_id?: number | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          image?: string | null
          image_url?: string | null
          quote?: string | null
          sort?: number | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["carousel_id"]
          },
        ]
      }
      carousels: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          status: string | null
          title: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          status?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          status?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          body: string | null
          date_created: string | null
          date_updated: string | null
          id: number
          main_icon: string | null
          main_image: string | null
          seo_description: string | null
          seo_title_tag: string | null
          slug: string
          sort: number | null
          status: Database["public"]["Enums"]["page_status"] | null
          summary: string | null
          title: string | null
          use_icon_as_image: boolean | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug: string
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          use_icon_as_image?: boolean | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          use_icon_as_image?: boolean | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      category_accordion: {
        Row: {
          accordion_id: number
          category_id: number
          date_created: string | null
          date_updated: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          accordion_id: number
          category_id: number
          date_created?: string | null
          date_updated?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          accordion_id?: number
          category_id?: number
          date_created?: string | null
          date_updated?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "accordions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "category_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "category_accordion_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_accordion_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_accordion_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["category_id"]
          },
        ]
      }
      category_carousel: {
        Row: {
          carousel_id: number
          category_id: number
          date_created: string | null
          date_updated: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          carousel_id: number
          category_id: number
          date_created?: string | null
          date_updated?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          carousel_id?: number
          category_id?: number
          date_created?: string | null
          date_updated?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "category_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "category_carousel_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_carousel_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_carousel_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["category_id"]
          },
        ]
      }
      category_post: {
        Row: {
          category_id: number
          date_created: string | null
          date_updated: string | null
          post_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          category_id: number
          date_created?: string | null
          date_updated?: string | null
          post_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          category_id?: number
          date_created?: string | null
          date_updated?: string | null
          post_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_post_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_post_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_post_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "category_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "category_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          alpha2: string
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          alpha2: string
          created_at?: string | null
          id?: never
          name: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          alpha2?: string
          created_at?: string | null
          id?: never
          name?: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      eventpages: {
        Row: {
          body: string | null
          date_created: string | null
          date_updated: string | null
          enddatetime: string | null
          id: number
          main_icon: string | null
          main_image: string | null
          seo_description: string | null
          seo_title_tag: string | null
          slug: string | null
          sort: number | null
          startdatetime: string | null
          status: Database["public"]["Enums"]["page_status"] | null
          summary: string | null
          title: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          enddatetime?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          startdatetime?: string | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          enddatetime?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          startdatetime?: string | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      identifications: {
        Row: {
          created_at: string | null
          date_of_issuance: string
          expiry_date: string | null
          id: number
          id_number: string
          is_active: boolean | null
          issuing_authority: string
          issuing_country_id: number
          profile_id: number
          type: Database["public"]["Enums"]["identification_type_enum"]
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_issuance: string
          expiry_date?: string | null
          id?: never
          id_number: string
          is_active?: boolean | null
          issuing_authority: string
          issuing_country_id: number
          profile_id: number
          type: Database["public"]["Enums"]["identification_type_enum"]
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_issuance?: string
          expiry_date?: string | null
          id?: never
          id_number?: string
          is_active?: boolean | null
          issuing_authority?: string
          issuing_country_id?: number
          profile_id?: number
          type?: Database["public"]["Enums"]["identification_type_enum"]
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identifications_issuing_country_id_fkey"
            columns: ["issuing_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identities: {
        Row: {
          country_id: number
          created_at: string | null
          date_of_birth: string
          first_name: string
          id: number
          last_name: string
          profile_id: number
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          country_id: number
          created_at?: string | null
          date_of_birth: string
          first_name: string
          id?: never
          last_name: string
          profile_id: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          country_id?: number
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          id?: never
          last_name?: string
          profile_id?: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country_id: number
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country_id: number
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country_id?: number
          created_at?: string | null
          description?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      menu: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          menu_order: number | null
          page_id: number | null
          position: Database["public"]["Enums"]["menu_position"] | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          menu_order?: number | null
          page_id?: number | null
          position?: Database["public"]["Enums"]["menu_position"] | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: never
          menu_order?: number | null
          page_id?: number | null
          position?: Database["public"]["Enums"]["menu_position"] | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "menu_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "menu_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          profile_id: number
          registration_number: string | null
          type: string
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
          vat_number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name: string
          profile_id: number
          registration_number?: string | null
          type: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          vat_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          is_active?: boolean | null
          name?: string
          profile_id?: number
          registration_number?: string | null
          type?: string
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_accordion: {
        Row: {
          accordion_id: number
          date_created: string | null
          date_updated: string | null
          page_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          accordion_id: number
          date_created?: string | null
          date_updated?: string | null
          page_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          accordion_id?: number
          date_created?: string | null
          date_updated?: string | null
          page_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "accordions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "page_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "page_accordion_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_accordion_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_accordion_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_carousel: {
        Row: {
          carousel_id: number
          date_created: string | null
          date_updated: string | null
          page_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          carousel_id: number
          date_created?: string | null
          date_updated?: string | null
          page_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          carousel_id?: number
          date_created?: string | null
          date_updated?: string | null
          page_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "page_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "page_carousel_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_carousel_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_carousel_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_category: {
        Row: {
          category_id: number
          date_created: string | null
          date_updated: string | null
          page_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          category_id: number
          date_created?: string | null
          date_updated?: string | null
          page_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          category_id?: number
          date_created?: string | null
          date_updated?: string | null
          page_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "page_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "page_category_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_category_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_category_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_images: {
        Row: {
          alt_text: string
          category: string | null
          created_at: string
          date_created: string | null
          date_updated: string | null
          description: string | null
          id: string
          image: string
          name: string
          updated_at: string
          user_created: string | null
          user_id: string | null
          user_updated: string | null
        }
        Insert: {
          alt_text: string
          category?: string | null
          created_at?: string
          date_created?: string | null
          date_updated?: string | null
          description?: string | null
          id?: string
          image: string
          name: string
          updated_at?: string
          user_created?: string | null
          user_id?: string | null
          user_updated?: string | null
        }
        Update: {
          alt_text?: string
          category?: string | null
          created_at?: string
          date_created?: string | null
          date_updated?: string | null
          description?: string | null
          id?: string
          image?: string
          name?: string
          updated_at?: string
          user_created?: string | null
          user_id?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      page_post: {
        Row: {
          date_created: string | null
          date_updated: string | null
          page_id: number
          post_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          page_id: number
          post_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          page_id?: number
          post_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_post_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_post_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["page_id"]
          },
          {
            foreignKeyName: "page_post_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "page_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "page_post_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          body: string | null
          date_created: string | null
          date_updated: string | null
          icon_filename: string | null
          icon_id: string | null
          id: number
          image_filename: string | null
          image_id: string | null
          is_eventpage: boolean | null
          is_homepage: boolean | null
          is_map: boolean | null
          is_team: boolean | null
          main_icon: string | null
          main_image: string | null
          seo_description: string | null
          seo_title_tag: string | null
          slug: string | null
          sort: number | null
          status: Database["public"]["Enums"]["page_status"] | null
          summary: string | null
          title: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          icon_filename?: string | null
          icon_id?: string | null
          id?: number
          image_filename?: string | null
          image_id?: string | null
          is_eventpage?: boolean | null
          is_homepage?: boolean | null
          is_map?: boolean | null
          is_team?: boolean | null
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          icon_filename?: string | null
          icon_id?: string | null
          id?: number
          image_filename?: string | null
          image_id?: string | null
          is_eventpage?: boolean | null
          is_homepage?: boolean | null
          is_map?: boolean | null
          is_team?: boolean | null
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      post_accordion: {
        Row: {
          accordion_id: number
          date_created: string | null
          date_updated: string | null
          post_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          accordion_id: number
          date_created?: string | null
          date_updated?: string | null
          post_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          accordion_id?: number
          date_created?: string | null
          date_updated?: string | null
          post_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "accordions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "post_accordion_accordion_id_fkey"
            columns: ["accordion_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["accordion_id"]
          },
          {
            foreignKeyName: "post_accordion_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_accordion_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_accordion_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_carousel: {
        Row: {
          carousel_id: number
          date_created: string | null
          date_updated: string | null
          post_id: number
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          carousel_id: number
          date_created?: string | null
          date_updated?: string | null
          post_id: number
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          carousel_id?: number
          date_created?: string | null
          date_updated?: string | null
          post_id?: number
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "post_carousel_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "post_carousel_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_carousel_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_carousel_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          date_created: string | null
          date_updated: string | null
          id: number
          main_icon: string | null
          main_image: string | null
          seo_description: string | null
          seo_title_tag: string | null
          slug: string | null
          sort: number | null
          status: Database["public"]["Enums"]["page_status"] | null
          summary: string | null
          title: string | null
          user_created: string | null
          user_updated: string | null
          valid_to: string
        }
        Insert: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
          valid_to: string
        }
        Update: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: number
          main_icon?: string | null
          main_image?: string | null
          seo_description?: string | null
          seo_title_tag?: string | null
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
          valid_to?: string
        }
        Relationships: []
      }
      profilepages: {
        Row: {
          body: string | null
          date_created: string | null
          date_updated: string | null
          id: number
          main_icon: string | null
          main_image: string | null
          profile_id: number
          slug: string | null
          sort: number | null
          status: Database["public"]["Enums"]["page_status"] | null
          summary: string | null
          title: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: never
          main_icon?: string | null
          main_image?: string | null
          profile_id: number
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          body?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: never
          main_icon?: string | null
          main_image?: string | null
          profile_id?: number
          slug?: string | null
          sort?: number | null
          status?: Database["public"]["Enums"]["page_status"] | null
          summary?: string | null
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profilepages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: number
          public_profile_id: number | null
          updated_at: string | null
          user_created: string | null
          user_id: string | null
          user_updated: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: never
          public_profile_id?: number | null
          updated_at?: string | null
          user_created?: string | null
          user_id?: string | null
          user_updated?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: never
          public_profile_id?: number | null
          updated_at?: string | null
          user_created?: string | null
          user_id?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_public_profile_id_fkey"
            columns: ["public_profile_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progressbar: {
        Row: {
          currentValue: number
          date_created: string | null
          date_updated: string | null
          id: number
          label1: string | null
          label2: string | null
          label3: string | null
          post_id: number | null
          targetValue: number
          threshold1: number
          threshold2: number
          title: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          currentValue: number
          date_created?: string | null
          date_updated?: string | null
          id?: number
          label1?: string | null
          label2?: string | null
          label3?: string | null
          post_id?: number | null
          targetValue: number
          threshold1: number
          threshold2: number
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          currentValue?: number
          date_created?: string | null
          date_updated?: string | null
          id?: number
          label1?: string | null
          label2?: string | null
          label3?: string | null
          post_id?: number | null
          targetValue?: number
          threshold1?: number
          threshold2?: number
          title?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progressbar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "progressbar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "progressbar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          created_at: string
          id: number
          updated_at: string
          user_created: string | null
          user_updated: string | null
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          updated_at?: string
          user_created?: string | null
          user_updated?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          updated_at?: string
          user_created?: string | null
          user_updated?: string | null
          username?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      room_ao: {
        Row: {
          ao_id: number
          created_at: string | null
          id: number
          room_id: number
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          ao_id: number
          created_at?: string | null
          id?: never
          room_id: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          ao_id?: number
          created_at?: string | null
          id?: never
          room_id?: number
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_ao_ao_id_fkey"
            columns: ["ao_id"]
            isOneToOne: false
            referencedRelation: "accommodation_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_ao_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          image: string | null
          is_active: boolean | null
          location_id: number
          name: string
          room_number: string | null
          updated_at: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          image?: string | null
          is_active?: boolean | null
          location_id: number
          name: string
          room_number?: string | null
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          image?: string | null
          is_active?: boolean | null
          location_id?: number
          name?: string
          room_number?: string | null
          updated_at?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stake_links: {
        Row: {
          cta: string | null
          date_created: string | null
          date_updated: string | null
          id: string
          link: string | null
          logo: string | null
          name: string | null
          sort: number | null
          status: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          cta?: string | null
          date_created?: string | null
          date_updated?: string | null
          id: string
          link?: string | null
          logo?: string | null
          name?: string | null
          sort?: number | null
          status?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          cta?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: string
          link?: string | null
          logo?: string | null
          name?: string | null
          sort?: number | null
          status?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          date_subscribed: string
          date_unsubscribed: string | null
          email: string
          id: number
          subscribed: boolean
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_subscribed?: string
          date_unsubscribed?: string | null
          email: string
          id?: never
          subscribed?: boolean
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_subscribed?: string
          date_unsubscribed?: string | null
          email?: string
          id?: never
          subscribed?: boolean
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          date_created: string | null
          date_updated: string | null
          id: number
          name: string | null
          profile_image: string | null
          role: string | null
          sort: number | null
          status: string | null
          user_created: string | null
          user_updated: string | null
        }
        Insert: {
          bio?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: never
          name?: string | null
          profile_image?: string | null
          role?: string | null
          sort?: number | null
          status?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Update: {
          bio?: string | null
          date_created?: string | null
          date_updated?: string | null
          id?: never
          name?: string | null
          profile_image?: string | null
          role?: string | null
          sort?: number | null
          status?: string | null
          user_created?: string | null
          user_updated?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          date_created: string | null
          date_updated: string | null
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_created: string | null
          user_id: string
          user_updated: string | null
        }
        Insert: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_created?: string | null
          user_id: string
          user_updated?: string | null
        }
        Update: {
          date_created?: string | null
          date_updated?: string | null
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_created?: string | null
          user_id?: string
          user_updated?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      carousel_items_with_images: {
        Row: {
          button_link: string | null
          carousel_id: number | null
          date_created: string | null
          date_updated: string | null
          id: number | null
          image: string | null
          image_url: string | null
          quote: string | null
          user_created: string | null
          user_updated: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_with_related_data"
            referencedColumns: ["carousel_id"]
          },
          {
            foreignKeyName: "carousel_items_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "page_with_related_data"
            referencedColumns: ["carousel_id"]
          },
        ]
      }
      homepage_with_related_data: {
        Row: {
          accordion_id: number | null
          carousel_heading: string | null
          carousel_id: number | null
          category_id: number | null
          category_title: string | null
          page_id: number | null
          page_slug: string | null
          page_title: string | null
          post_id: number | null
          post_title: string | null
        }
        Relationships: []
      }
      page_with_related_data: {
        Row: {
          accordion_id: number | null
          carousel_heading: string | null
          carousel_id: number | null
          category_id: number | null
          category_title: string | null
          page_id: number | null
          page_slug: string | null
          page_title: string | null
          post_id: number | null
          post_title: string | null
        }
        Relationships: []
      }
      user_roles_view: {
        Row: {
          id: number | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          id?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          id?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      website_images: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string | null
          last_accessed_at: string | null
          mime_type: string | null
          name: string | null
          size: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          mime_type?: never
          name?: string | null
          size?: never
          updated_at?: string | null
          url?: never
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          mime_type?: never
          name?: string | null
          size?: never
          updated_at?: string | null
          url?: never
        }
        Relationships: []
      }
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      check_permission: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: Json
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      get_policies_for_table: {
        Args: { table_name: string }
        Returns: {
          cmd: string
          policyname: string
          qual: string
          tablename: string
          with_check: string
        }[]
      }
      get_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          date_created: string | null
          date_updated: string | null
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_created: string | null
          user_id: string
          user_updated: string | null
        }[]
      }
      update_page_image: {
        Args: { image_name: string; is_icon?: boolean; page_id: number }
        Returns: undefined
      }
    }
    Enums: {
      accommodation_type: "single" | "double" | "twin" | "dormitory"
      app_permission:
        | "content.CRU"
        | "events.CRU"
        | "accommodation.CRU"
        | "user_roles.CRUD"
        | "user_roles.R"
        | "content.D"
        | "images.CRUD"
        | "eventpages.CRU"
        | "users.CRUD"
        | "acc_settings.CRUD"
        | "frontdesk.CRUD"
        | "pricings.CRUD"
      app_role: "admin" | "frontdesk" | "manager" | "event organiser"
      bed_type: "single" | "double" | "bunk bed top" | "bunk bed bottom"
      booking_status:
        | "pending"
        | "canceled"
        | "no-show"
        | "checked-in"
        | "checked-out"
      currency_type: "EUR" | "USD" | "EURe"
      identification_type_enum: "passport" | "ID" | "drivers licence"
      menu_position: "header" | "footer"
      page_status: "draft" | "published" | "archived"
      payment_status: "unpaid" | "partially-paid" | "paid" | "refunded"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      accommodation_type: ["single", "double", "twin", "dormitory"],
      app_permission: [
        "content.CRU",
        "events.CRU",
        "accommodation.CRU",
        "user_roles.CRUD",
        "user_roles.R",
        "content.D",
        "images.CRUD",
        "eventpages.CRU",
        "users.CRUD",
        "acc_settings.CRUD",
        "frontdesk.CRUD",
        "pricings.CRUD",
      ],
      app_role: ["admin", "frontdesk", "manager", "event organiser"],
      bed_type: ["single", "double", "bunk bed top", "bunk bed bottom"],
      booking_status: [
        "pending",
        "canceled",
        "no-show",
        "checked-in",
        "checked-out",
      ],
      currency_type: ["EUR", "USD", "EURe"],
      identification_type_enum: ["passport", "ID", "drivers licence"],
      menu_position: ["header", "footer"],
      page_status: ["draft", "published", "archived"],
      payment_status: ["unpaid", "partially-paid", "paid", "refunded"],
    },
  },
} as const
