import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
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
      agentId,
      name,
      voiceId,
      systemPrompt,
      temperature,
      model,
      bargeIn,
      maxDurationMs,
      afterSilenceMs
    } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    // Build update payload
    const updatePayload: any = {}

    if (name) updatePayload.name = name

    if (voiceId) {
      updatePayload.voice = {
        voice_id: voiceId,
        model_id: 'eleven_multilingual_v2'
      }
    }

    if (systemPrompt || temperature || model) {
      updatePayload.conversation_config = {
        llm: {
          provider: 'openai',
          model: model || 'gpt-4o-mini',
          temperature: temperature || 0.6
        },
        system_prompt: systemPrompt
      }
    }

    if (bargeIn !== undefined || maxDurationMs || afterSilenceMs) {
      updatePayload.settings = {
        barge_in: bargeIn ?? true,
        end_conditions: {
          after_silence_ms: afterSilenceMs || 8000,
          max_duration_ms: maxDurationMs || 900000
        }
      }
    }

    // Update ElevenLabs agent
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs agent update error:', errorText)
      return NextResponse.json(
        { error: 'Failed to update ElevenLabs agent', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error updating ElevenLabs agent:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
