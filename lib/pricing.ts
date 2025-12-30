import { getServiceSupabase } from './supabase'

export interface PricingPlan {
  tier: number
  monthly_cents: number
  annual_cents: number
}

export const PRICING_TIERS: PricingPlan[] = [
  { tier: 1, monthly_cents: 200000, annual_cents: 150000 }, // $2000/mo, $1500/mo annual
  { tier: 2, monthly_cents: 300000, annual_cents: 250000 }, // $3000/mo, $2500/mo annual
  { tier: 3, monthly_cents: 500000, annual_cents: 400000 }, // $5000/mo, $4000/mo annual
]

/**
 * Calculate discount percentage based on number of active published agents
 * For every 3 active agents, apply +10% discount, capped at 30%
 */
export function calculateDiscountPercent(activeAgentsCount: number): number {
  const discountTiers = Math.floor(activeAgentsCount / 3)
  const discountPercent = discountTiers * 10
  return Math.min(discountPercent, 30) // Cap at 30%
}

/**
 * Apply discount to a price in cents
 */
export function applyDiscount(
  priceCents: number,
  discountPercent: number
): number {
  const discountAmount = Math.floor((priceCents * discountPercent) / 100)
  return priceCents - discountAmount
}

/**
 * Get the total monthly price for an organization after discounts
 */
export async function getOrganizationMonthlyTotal(
  organizationId: string
): Promise<{
  basePriceCents: number
  discountPercent: number
  finalPriceCents: number
  activeAgentsCount: number
}> {
  const supabase = getServiceSupabase()

  // Get all published agents for this organization
  const { data: agents, error } = await supabase
    .from('agents')
    .select('tier')
    .eq('organization_id', organizationId)
    .eq('status', 'published')

  if (error) {
    throw new Error(`Failed to fetch agents: ${error.message}`)
  }

  const activeAgentsCount = agents?.length || 0

  // Calculate base price (sum of all agent tier prices)
  let basePriceCents = 0
  const agentsList: { tier: number }[] = agents || []
  for (const agent of agentsList) {
    const plan = PRICING_TIERS.find((p) => p.tier === agent.tier)
    if (plan) {
      basePriceCents += plan.monthly_cents
    }
  }

  // Calculate discount
  const discountPercent = calculateDiscountPercent(activeAgentsCount)
  const finalPriceCents = applyDiscount(basePriceCents, discountPercent)

  return {
    basePriceCents,
    discountPercent,
    finalPriceCents,
    activeAgentsCount,
  }
}

/**
 * Format cents to dollar string
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Get pricing plan by tier
 */
export function getPricingPlan(tier: 1 | 2 | 3): PricingPlan | undefined {
  return PRICING_TIERS.find((p) => p.tier === tier)
}
