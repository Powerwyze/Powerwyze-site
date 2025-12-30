import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateTestToken } from '@/lib/test-tokens'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Get agent configuration including vapi_assistant_id
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*, vapi_assistant_id')
      .eq('id', agentId)
      .single()

    if (fetchError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Generate test token in-app
    const testToken = await generateTestToken(agentId)

    return NextResponse.json({
      success: true,
      testToken,
      vapiAssistantId: agent.vapi_assistant_id,
      agentConfig: {
        name: agent.name,
        voice: agent.voice,
        personality: agent.personality,
        systemPrompt: agent.system_prompt,
        firstMessage: agent.first_message,
        tier: agent.tier
      }
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
