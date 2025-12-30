import { NextRequest, NextResponse } from 'next/server'

interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url?: string
  category?: string
  labels?: Record<string, string>
  description?: string
  samples?: Array<{
    sample_id: string
    file_name: string
    mime_type: string
    size_bytes: number
    hash: string
  }>
  settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

interface ElevenLabsResponse {
  voices: ElevenLabsVoice[]
  has_more?: boolean
  next_page_token?: string
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const pageSize = searchParams.get('page_size') || '100'
    const nextPageToken = searchParams.get('next_page_token')

    const url = new URL('https://api.elevenlabs.io/v2/voices')
    url.searchParams.set('page_size', pageSize)
    if (nextPageToken) {
      url.searchParams.set('next_page_token', nextPageToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'xi-api-key': apiKey,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch voices', details: errorText },
        { status: response.status }
      )
    }

    const data: ElevenLabsResponse = await response.json()

    // Format voices for easier consumption
    const formattedVoices = data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      previewUrl: voice.preview_url,
      category: voice.category || 'general',
      description: voice.description,
      labels: voice.labels,
      settings: voice.settings || {
        stability: 0.55,
        similarity_boost: 0.65,
        style: 0.25,
        use_speaker_boost: true
      }
    }))

    return NextResponse.json({
      success: true,
      voices: formattedVoices,
      hasMore: data.has_more,
      nextPageToken: data.next_page_token
    })
  } catch (error: any) {
    console.error('Error fetching ElevenLabs voices:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
