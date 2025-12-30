'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function PaymentCancelledPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <CardTitle>Payment Cancelled</CardTitle>
          <CardDescription>
            You cancelled the payment process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            No charges were made to your account. You can try again whenever you're ready.
          </p>
          <Button
            onClick={() => router.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
