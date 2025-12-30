import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const results: any = {
    config: {
      url: supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    },
    tables: {}
  }

  // Check agent_public_paywall
  try {
    const { data, error } = await supabase
      .from('agent_public_paywall')
      .select('*')
      .limit(1)

    results.tables.agent_public_paywall = {
      exists: !error,
      error: error?.message,
      sampleCount: data?.length || 0
    }
  } catch (e: any) {
    results.tables.agent_public_paywall = {
      exists: false,
      error: e.message
    }
  }

  // Check visitor_payments
  try {
    const { data, error } = await supabase
      .from('visitor_payments')
      .select('*')
      .limit(1)

    results.tables.visitor_payments = {
      exists: !error,
      error: error?.message,
      sampleCount: data?.length || 0
    }
  } catch (e: any) {
    results.tables.visitor_payments = {
      exists: false,
      error: e.message
    }
  }

  // Check visitor_sessions
  try {
    const { data, error } = await supabase
      .from('visitor_sessions')
      .select('*')
      .limit(1)

    results.tables.visitor_sessions = {
      exists: !error,
      error: error?.message,
      sampleCount: data?.length || 0
    }
  } catch (e: any) {
    results.tables.visitor_sessions = {
      exists: false,
      error: e.message
    }
  }

  // Check organizations (should exist)
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)

    results.tables.organizations = {
      exists: !error,
      error: error?.message,
      sampleCount: data?.length || 0
    }
  } catch (e: any) {
    results.tables.organizations = {
      exists: false,
      error: e.message
    }
  }

  return NextResponse.json(results, { status: 200 })
}
