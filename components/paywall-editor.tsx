'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Loader2 } from 'lucide-react'

interface PaywallEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function PaywallEditor({ open, onOpenChange, organizationId }: PaywallEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [active, setActive] = useState(false)
  const [amount, setAmount] = useState('500') // $5.00 in cents
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPaywall()
    }
  }, [open, organizationId])

  const loadPaywall = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/paywall/get?organizationId=${organizationId}`)
      const result = await response.json()

      if (result.success && result.paywall) {
        const data = result.paywall
        setActive(data.active)
        setAmount(data.amount_cents.toString())
        setStartsAt(data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '')
        setEndsAt(data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '')
        setDescription(data.description || '')
      } else {
        // Set defaults for new paywall
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        setStartsAt(now.toISOString().slice(0, 16))
        setEndsAt(tomorrow.toISOString().slice(0, 16))
        setDescription('One-time access fee for voice agent conversations')
      }
    } catch (err: any) {
      console.error('Failed to load paywall:', err)
    }

    setLoading(false)
  }

  const validateDates = (): string | null => {
    if (!startsAt || !endsAt) {
      return 'Start and end dates are required'
    }

    const start = new Date(startsAt)
    const end = new Date(endsAt)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 8) {
      return 'Paywall window must be at least 8 hours'
    }

    if (diffDays > 365) {
      return 'Paywall window cannot exceed 365 days'
    }

    if (start < new Date() && active) {
      return 'Start date cannot be in the past when activating paywall'
    }

    return null
  }

  const handleSave = async () => {
    setError(null)

    // Validate dates
    const validationError = validateDates()
    if (validationError) {
      setError(validationError)
      return
    }

    // Validate amount
    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum < 50) {
      setError('Amount must be at least $0.50 (50 cents)')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/paywall/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          active,
          amount: amountNum,
          currency: 'usd',
          description,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save paywall settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Organization Paywall</DialogTitle>
          <DialogDescription>
            Set a one-time access fee for all visitors to your organization's voice agents
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <button
                id="active"
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  active ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD cents)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  min="50"
                  step="50"
                />
                <span className="text-sm text-muted-foreground">
                  = ${(parseInt(amount) || 0) / 100}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: $0.50 (50 cents)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One-time access fee"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts">Starts At</Label>
                <Input
                  id="starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends">Ends At</Label>
                <Input
                  id="ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Window: min 8 hours, max 365 days
            </p>

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Paywall'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
