export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          organization_id: string
          kind: 'museum' | 'event'
          display_name: string
          address: string | null
          timezone: string
          default_paywall_enabled: boolean
          default_paywall_amount_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          kind: 'museum' | 'event'
          display_name: string
          address?: string | null
          timezone?: string
          default_paywall_enabled?: boolean
          default_paywall_amount_cents?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          kind?: 'museum' | 'event'
          display_name?: string
          address?: string | null
          timezone?: string
          default_paywall_enabled?: boolean
          default_paywall_amount_cents?: number
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          organization_id: string
          venue_id: string | null
          tier: 1 | 2 | 3
          name: string
          slug: string
          bio: string | null
          persona: string | null
          do_nots: string | null
          important_facts: Json
          end_script: string | null
          voice_id: string | null
          languages: string[]
          multilingual: boolean
          status: 'draft' | 'testing' | 'published'
          public_id: string
          qr_shape: 'square' | 'circle'
          first_published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          venue_id?: string | null
          tier: 1 | 2 | 3
          name: string
          slug: string
          bio?: string | null
          persona?: string | null
          do_nots?: string | null
          important_facts?: Json
          end_script?: string | null
          voice_id?: string | null
          languages?: string[]
          multilingual?: boolean
          status?: 'draft' | 'testing' | 'published'
          public_id?: string
          qr_shape?: 'square' | 'circle'
          first_published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          venue_id?: string | null
          tier?: 1 | 2 | 3
          name?: string
          slug?: string
          bio?: string | null
          persona?: string | null
          do_nots?: string | null
          important_facts?: Json
          end_script?: string | null
          voice_id?: string | null
          languages?: string[]
          multilingual?: boolean
          status?: 'draft' | 'testing' | 'published'
          public_id?: string
          qr_shape?: 'square' | 'circle'
          first_published_at?: string | null
          created_at?: string
        }
      }
      agent_capabilities: {
        Row: {
          id: string
          agent_id: string
          can_send_email: boolean
          can_send_sms: boolean
          can_take_orders: boolean
          can_post_social: boolean
          function_manifest: Json
        }
        Insert: {
          id?: string
          agent_id: string
          can_send_email?: boolean
          can_send_sms?: boolean
          can_take_orders?: boolean
          can_post_social?: boolean
          function_manifest?: Json
        }
        Update: {
          id?: string
          agent_id?: string
          can_send_email?: boolean
          can_send_sms?: boolean
          can_take_orders?: boolean
          can_post_social?: boolean
          function_manifest?: Json
        }
      }
      pricing_plans: {
        Row: {
          id: string
          tier: number
          monthly_cents: number
          annual_cents: number
        }
        Insert: {
          id?: string
          tier: number
          monthly_cents: number
          annual_cents: number
        }
        Update: {
          id?: string
          tier?: number
          monthly_cents?: number
          annual_cents?: number
        }
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          discount_percent: number
          billing_cycle_anchor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          discount_percent?: number
          billing_cycle_anchor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          discount_percent?: number
          billing_cycle_anchor?: string | null
          created_at?: string
        }
      }
      agent_public_paywall: {
        Row: {
          id: string
          organization_id: string
          active: boolean
          amount_cents: number
          starts_at: string
          ends_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          active?: boolean
          amount_cents: number
          starts_at: string
          ends_at: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          active?: boolean
          amount_cents?: number
          starts_at?: string
          ends_at?: string
          created_at?: string
        }
      }
      publish_events: {
        Row: {
          id: string
          agent_id: string
          event: 'created' | 'updated' | 'published'
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          event: 'created' | 'updated' | 'published'
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          event?: 'created' | 'updated' | 'published'
          payload?: Json | null
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          agent_id: string
          kind: 'test' | 'live'
          seconds: number
          started_at: string
          meta: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          kind: 'test' | 'live'
          seconds: number
          started_at: string
          meta?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          kind?: 'test' | 'live'
          seconds?: number
          started_at?: string
          meta?: Json | null
          created_at?: string
        }
      }
    }
  }
}
