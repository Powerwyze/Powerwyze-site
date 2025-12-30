import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      voiceId,
      text,
      modelId = 'eleven_multilingual_v2',
      settings = {
        stability: 0.55,
        similarity_boost: 0.65,
        style: 0.25,
        use_speaker_boost: true
      },
      optimizeStreamingLatency = 2,
      outputFormat = 'pcm_16000'
    } = body

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: 'voiceId and text are required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/octet-stream'
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: settings,
          optimize_streaming_latency: optimizeStreamingLatency,
          output_format: outputFormat
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs TTS error:', errorText)
      return NextResponse.json(
        { error: 'TTS synthesis failed', details: errorText },
        { status: response.status }
      )
    }

    // Stream the audio back to the client
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error: any) {
    console.error('Error in ElevenLabs TTS:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
