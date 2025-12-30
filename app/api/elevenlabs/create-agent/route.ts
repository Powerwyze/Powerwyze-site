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
      name,
      voiceId,
      systemPrompt,
      temperature = 0.6,
      model = 'gpt-4o-mini',
      bargeIn = true,
      maxDurationMs = 900000,
      afterSilenceMs = 8000
    } = body

    if (!name || !voiceId || !systemPrompt) {
      return NextResponse.json(
        { error: 'name, voiceId, and systemPrompt are required' },
        { status: 400 }
      )
    }

    // Create ElevenLabs conversational agent
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        voice: {
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2'
        },
        conversation_config: {
          llm: {
            provider: 'openai',
            model,
            temperature
          },
          system_prompt: systemPrompt
        },
        settings: {
          barge_in: bargeIn,
          end_conditions: {
            after_silence_ms: afterSilenceMs,
            max_duration_ms: maxDurationMs
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs agent creation error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create ElevenLabs agent', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      agentId: data.agent_id,
      data
    })
  } catch (error: any) {
    console.error('Error creating ElevenLabs agent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
