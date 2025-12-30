import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, visitorId } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Get agent details including voice settings
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, vapi_assistant_id, voice_name, voice_settings, elevenlabs_agent_id')
      .eq('id', agentId)
      .eq('status', 'published')
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check paywall status
    const now = new Date().toISOString()
    const { data: paywall } = await supabase
      .from('agent_public_paywall')
      .select('*')
      .eq('organization_id', agent.organization_id)
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .single()

    // If paywall is active, verify payment
    if (paywall && visitorId) {
      const { data: payment } = await supabase
        .from('visitor_payments')
        .select('*')
        .eq('organization_id', agent.organization_id)
        .eq('visitor_id', visitorId)
        .eq('status', 'paid')
        .gte('expires_at', now)
        .single()

      if (!payment) {
        return NextResponse.json(
          { success: false, error: 'Payment required' },
          { status: 402 }
        )
      }
    }

    // Generate ephemeral token for voice session
    const sessionToken = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour session

    // Store session
    await supabase.from('visitor_sessions').insert({
      agent_id: agentId,
      visitor_id: visitorId || 'anonymous',
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      tier: agent.tier,
      created_at: new Date().toISOString()
    })

    // Return configuration for ElevenLabs
    return NextResponse.json({
      success: true,
      tier: agent.tier,
      provider: 'elevenlabs',
      sessionToken,
      elevenLabsAgentId: agent.elevenlabs_agent_id, // For WebSocket conversation
      voiceId: agent.voice,
      voiceName: agent.voice_name,
      voiceSettings: agent.voice_settings || {
        stability: 0.55,
        similarity_boost: 0.65,
        style: 0.25,
        use_speaker_boost: true
      },
      config: {
        name: agent.name,
        systemPrompt: agent.system_prompt || agent.personality || 'You are a helpful assistant.',
        firstMessage: agent.first_message || `Hello! I'm ${agent.name}. How can I help you today?`
      }
    })
  } catch (error: any) {
    console.error('Talk session error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
