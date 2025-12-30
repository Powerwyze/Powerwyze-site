'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    recordPayment()
  }, [])

  const recordPayment = async () => {
    try {
      const sessionId = searchParams.get('session_id')
      const visitorId = searchParams.get('visitor_id')
      const orgId = searchParams.get('org_id')

      if (!sessionId || !visitorId || !orgId) {
        throw new Error('Missing payment information')
      }

      // Record the payment
      const response = await fetch('/api/visitor/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId,
          organizationId: orgId
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to record payment')
      }

      // Wait 2 seconds then redirect back
      setTimeout(() => {
        router.back()
      }, 2000)
    } catch (err: any) {
      console.error('Payment recording error:', err)
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {processing ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-green-600 animate-spin" />
              <CardTitle>Processing Payment...</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment
              </CardDescription>
            </>
          ) : error ? (
            <>
              <CardTitle className="text-destructive">Payment Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>
                You now have access to talk with the voice agents
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {!processing && !error && (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Redirecting you back...
              </p>
              <Button
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back Now
              </Button>
            </div>
          )}
          {error && (
            <Button
              onClick={() => router.back()}
              className="w-full"
              variant="outline"
            >
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
