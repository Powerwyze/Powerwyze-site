import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const visitorId = searchParams.get('visitorId') // Can be session ID or fingerprint

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check if org has active paywall
    const now = new Date().toISOString()
    const { data: paywall, error: paywallError } = await supabase
      .from('agent_public_paywall')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .single()

    // No active paywall
    if (paywallError || !paywall) {
      return NextResponse.json({
        success: true,
        paywallActive: false,
        requiresPayment: false
      })
    }

    // Paywall is active, check if visitor has paid
    let hasPaid = false
    if (visitorId) {
      const { data: payment } = await supabase
        .from('visitor_payments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('visitor_id', visitorId)
        .eq('status', 'paid')
        .gte('expires_at', now)
        .single()

      hasPaid = !!payment
    }

    return NextResponse.json({
      success: true,
      paywallActive: true,
      requiresPayment: !hasPaid,
      paywall: {
        amount: paywall.amount_cents,
        currency: paywall.currency,
        description: paywall.description
      }
    })
  } catch (error: any) {
    console.error('Paywall check error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
