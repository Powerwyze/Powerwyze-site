'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, QrCode, ArrowLeft } from 'lucide-react'

export default function ScanHelpPage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // TODO: Implement QR code reading from uploaded image
      // This would require a QR code scanning library like jsQR
      alert('QR code scanning from images is coming soon!')
    } catch (error) {
      console.error('QR scan error:', error)
      alert('Failed to scan QR code')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Scan QR Code</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Native Camera Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Use Your Phone Camera
            </CardTitle>
            <CardDescription>
              The easiest way to scan QR codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Open your camera app</p>
                  <p className="text-sm text-muted-foreground">
                    Use the default camera app on your phone
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Point at the QR code</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure the QR code is clearly visible and well-lit
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Tap the notification</p>
                  <p className="text-sm text-muted-foreground">
                    A notification should appear - tap it to open the link
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Most modern smartphones automatically detect QR codes when you open the camera app. No special app needed!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Fallback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload QR Code Image
            </CardTitle>
            <CardDescription>
              If you have a photo of the QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a photo containing a QR code
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Supported formats: JPG, PNG, HEIC
            </p>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">Camera won't focus?</p>
              <p className="text-muted-foreground">
                Try moving closer or further away from the QR code
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Nothing happens?</p>
              <p className="text-muted-foreground">
                Make sure your camera app is up to date and has permission to access the internet
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">QR code damaged?</p>
              <p className="text-muted-foreground">
                Contact the museum or venue staff for assistance
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
