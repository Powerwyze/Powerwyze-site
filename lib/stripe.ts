import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  organizationId: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      organization_id: organizationId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
  })
}

export async function createBillingPortalSession(customerId: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })
}
