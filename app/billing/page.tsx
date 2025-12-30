'use client'

import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCents } from '@/lib/pricing'

export default function BillingPage() {
  // TODO: Fetch organization billing info and active agents
  const billing = {
    activeAgents: 0,
    basePriceCents: 0,
    discountPercent: 0,
    finalPriceCents: 0,
    nextBillingDate: new Date(),
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Agents</span>
                  <Badge>{billing.activeAgents}</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Base Price</span>
                  <span className="text-sm">{formatCents(billing.basePriceCents)}/mo</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Volume Discount</span>
                  <Badge variant="secondary">{billing.discountPercent}%</Badge>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">{formatCents(billing.finalPriceCents)}/mo</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Next billing date: {billing.nextBillingDate.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume Discounts</CardTitle>
              <CardDescription>Save more with more agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>3-5 agents</span>
                  <span className="font-medium">10% off</span>
                </div>
                <div className="flex justify-between">
                  <span>6-8 agents</span>
                  <span className="font-medium">20% off</span>
                </div>
                <div className="flex justify-between">
                  <span>9+ agents</span>
                  <span className="font-medium">30% off (max)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Discounts apply automatically based on your published agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Tiers</CardTitle>
              <CardDescription>Per agent pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Tier 1 - ElevenLabs</span>
                    <span className="text-sm">$20/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI voice synthesis with 100+ voices</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Tier 2 - ElevenLabs Pro</span>
                    <span className="text-sm">$30/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Advanced models with voice cloning</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Tier 3 - Enterprise</span>
                    <span className="text-sm">$50/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Custom functions and API integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your payment methods and billing history through the Stripe portal.
              </p>
              <Button className="w-full">Open Stripe Portal</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
