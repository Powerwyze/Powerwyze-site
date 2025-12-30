'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { PaywallEditor } from '@/components/paywall-editor'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Play, Upload, Settings, Sparkles, DollarSign, Edit, Trash2 } from 'lucide-react'

type Agent = {
  id: string
  name: string
  tier: 1 | 2 | 3
  status: 'draft' | 'testing' | 'published'
  languages: string[]
  created_at: string
  updated_at?: string
  bio: string | null
}

type PaywallWindow = {
  active: boolean
  amount_cents: number
  starts_at: string
  ends_at: string
} | null

export default function ExhibitsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [paywall, setPaywall] = useState<PaywallWindow>(null)
  const [paywallEditorOpen, setPaywallEditorOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (!org) return

      setOrganizationId(org.id)

      // Fetch agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (agentsData) {
        setAgents(agentsData as Agent[])
      }

      // Fetch paywall info
      try {
        const paywallRes = await fetch(`/api/paywall/get?organizationId=${org.id}`)
        const paywallResult = await paywallRes.json()

        if (paywallResult.success && paywallResult.paywall && paywallResult.paywall.active) {
          setPaywall(paywallResult.paywall as PaywallWindow)
        }
      } catch (err) {
        console.error('Failed to fetch paywall:', err)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const handlePaywallEditorClose = async (open: boolean) => {
    setPaywallEditorOpen(open)
    if (!open && organizationId) {
      // Refetch paywall data when editor closes
      try {
        const paywallRes = await fetch(`/api/paywall/get?organizationId=${organizationId}`)
        const paywallResult = await paywallRes.json()

        if (paywallResult.success && paywallResult.paywall && paywallResult.paywall.active) {
          setPaywall(paywallResult.paywall as PaywallWindow)
        } else {
          setPaywall(null)
        }
      } catch (err) {
        console.error('Failed to fetch paywall:', err)
        setPaywall(null)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'testing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getTierLabel = (tier: number) => {
    const labels = {
      1: 'Tier 1 - ElevenLabs',
      2: 'Tier 2 - ElevenLabs Pro',
      3: 'Tier 3 - Enterprise',
    }
    return labels[tier as 1 | 2 | 3] || `Tier ${tier}`
  }

  const handleTierSelect = (tier: number) => {
    router.push(`/exhibits/new?tier=${tier}`)
  }

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)

      if (error) {
        console.error('Error deleting agent:', error)
        alert('Failed to delete agent. Please try again.')
        return
      }

      // Remove from local state
      setAgents(agents.filter(a => a.id !== agentId))
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Failed to delete agent. Please try again.')
    }
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">AI Exhibits</h1>
                <p className="text-muted-foreground mt-1">
                  Build and manage your voice agent exhibits
                </p>
              </div>

              {/* Split Button Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Build AI Exhibit
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => handleTierSelect(1)}>
                    <div className="flex flex-col">
                      <div className="font-medium">Tier 1 - ElevenLabs</div>
                      <div className="text-xs text-muted-foreground">$20/mo • AI voice synthesis</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTierSelect(2)}>
                    <div className="flex flex-col">
                      <div className="font-medium">Tier 2 - ElevenLabs Pro</div>
                      <div className="text-xs text-muted-foreground">$30/mo • Advanced models</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTierSelect(3)}>
                    <div className="flex flex-col">
                      <div className="font-medium">Tier 3 - Enterprise</div>
                      <div className="text-xs text-muted-foreground">$50/mo • Custom functions</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading exhibits...
                </CardContent>
              </Card>
            ) : agents.length === 0 ? (
              /* Empty State */
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-primary/10 p-6 mb-6">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">No exhibits yet</h2>
                  <p className="text-muted-foreground text-center max-w-md mb-8">
                    Create your first AI voice agent exhibit. Choose a tier based on your needs and capabilities.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                    {/* Tier 1 Card */}
                    <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => handleTierSelect(1)}>
                      <CardHeader>
                        <Badge className="w-fit mb-2">Tier 1</Badge>
                        <CardTitle className="text-lg">ElevenLabs</CardTitle>
                        <CardDescription className="text-2xl font-bold">$20<span className="text-sm font-normal">/mo</span></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>✓ 100+ voice library</li>
                          <li>✓ AI voice synthesis</li>
                          <li>✓ QR code access</li>
                        </ul>
                        <Button className="w-full mt-4" variant="outline">
                          Build Tier 1
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Tier 2 Card */}
                    <Card className="hover:border-primary transition-colors cursor-pointer border-primary" onClick={() => handleTierSelect(2)}>
                      <CardHeader>
                        <Badge className="w-fit mb-2">Tier 2</Badge>
                        <CardTitle className="text-lg">ElevenLabs Pro</CardTitle>
                        <CardDescription className="text-2xl font-bold">$30<span className="text-sm font-normal">/mo</span></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>✓ Advanced models</li>
                          <li>✓ Voice cloning</li>
                          <li>✓ Higher quality</li>
                        </ul>
                        <Button className="w-full mt-4">
                          Build Tier 2
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Tier 3 Card */}
                    <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => handleTierSelect(3)}>
                      <CardHeader>
                        <Badge className="w-fit mb-2">Tier 3</Badge>
                        <CardTitle className="text-lg">Enterprise</CardTitle>
                        <CardDescription className="text-2xl font-bold">$50<span className="text-sm font-normal">/mo</span></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>✓ Custom functions</li>
                          <li>✓ Email & SMS hooks</li>
                          <li>✓ API integrations</li>
                        </ul>
                        <Button className="w-full mt-4" variant="outline">
                          Build Tier 3
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Agent Grid */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {agents.map((agent) => (
                  <Card key={agent.id} className="hover:border-primary transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{agent.name}</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">Tier {agent.tier}</Badge>
                            <Badge variant={getStatusColor(agent.status) as any}>
                              {agent.status}
                            </Badge>
                            {agent.tier === 1 && (
                              <Badge variant="secondary" className="text-xs">
                                {agent.languages.join('/')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        Updated {formatDate(agent.updated_at || agent.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {agent.bio || 'No description'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/exhibits/new?id=${agent.id}`)}
                          title="Edit agent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAgent(agent.id, agent.name)}
                          title="Delete agent"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/exhibits/${agent.id}`)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        {agent.status !== 'published' ? (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/exhibits/${agent.id}`)}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => router.push(`/exhibits/${agent.id}`)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Rail */}
          <div className="hidden lg:block w-80">
            {/* Paywall Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Visitor Paywall</CardTitle>
                </div>
                <CardDescription>Organization-level access control</CardDescription>
              </CardHeader>
              <CardContent>
                {paywall && paywall.active ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-primary/5 p-4">
                      <div className="text-sm text-muted-foreground mb-1">Current Amount</div>
                      <div className="text-2xl font-bold">{formatCurrency(paywall.amount_cents)}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starts</span>
                        <span>{new Date(paywall.starts_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ends</span>
                        <span>{new Date(paywall.ends_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setPaywallEditorOpen(true)}
                    >
                      Edit Paywall
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      No active paywall window. Add one to charge visitors for exhibit access.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setPaywallEditorOpen(true)}
                    >
                      Create Paywall
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Exhibits</span>
                  <span className="font-medium">{agents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium">
                    {agents.filter((a) => a.status === 'published').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">In Testing</span>
                  <span className="font-medium">
                    {agents.filter((a) => a.status === 'testing').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-medium">
                    {agents.filter((a) => a.status === 'draft').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Paywall Editor Modal */}
      {organizationId && (
        <PaywallEditor
          open={paywallEditorOpen}
          onOpenChange={handlePaywallEditorClose}
          organizationId={organizationId}
        />
      )}
    </>
  )
}
