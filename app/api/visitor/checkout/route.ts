import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, visitorId, amount, currency, description } = body

    if (!organizationId || !visitorId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: description || 'Voice Agent Access Fee',
              description: `One-time access to voice agents for this organization`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/visitor/payment-success?session_id={CHECKOUT_SESSION_ID}&visitor_id=${visitorId}&org_id=${organizationId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/visitor/payment-cancelled`,
      metadata: {
        organizationId,
        visitorId,
        purpose: 'visitor_paywall'
      }
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    })
  } catch (error: any) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
