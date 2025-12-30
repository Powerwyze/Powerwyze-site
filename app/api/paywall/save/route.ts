import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, active, amount, currency, description, startsAt, endsAt } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!amount || amount < 50) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 50 cents' },
        { status: 400 }
      )
    }

    // Validate dates
    if (!startsAt || !endsAt) {
      return NextResponse.json(
        { success: false, error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const start = new Date(startsAt)
    const end = new Date(endsAt)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 8) {
      return NextResponse.json(
        { success: false, error: 'Paywall window must be at least 8 hours' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('agent_public_paywall')
      .upsert({
        organization_id: organizationId,
        active,
        amount_cents: amount,
        currency: currency || 'usd',
        description,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Save paywall error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paywall: data
    })
  } catch (error: any) {
    console.error('Save paywall error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
