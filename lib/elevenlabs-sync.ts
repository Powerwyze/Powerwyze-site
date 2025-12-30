/**
 * ElevenLabs Agent Sync Utility
 *
 * Syncs PowerWyze agents to ElevenLabs Conversational AI
 */

export async function syncAgentToElevenLabs(agent: any) {
  // Build system prompt from agent configuration
  const systemPrompt = buildSystemPrompt(agent)

  const payload = {
    name: agent.name,
    voiceId: agent.voice || '21m00Tcm4TlvDq8ikWAM',
    systemPrompt,
    temperature: 0.6,
    model: 'gpt-4o-mini',
    bargeIn: true,
    maxDurationMs: 900000, // 15 minutes
    afterSilenceMs: 8000 // 8 seconds of silence ends conversation
  }

  // Check if agent already has an ElevenLabs agent ID
  if (agent.elevenlabs_agent_id) {
    // Update existing agent
    return await updateElevenLabsAgent(agent.elevenlabs_agent_id, payload)
  } else {
    // Create new agent
    return await createElevenLabsAgent(payload)
  }
}

function buildSystemPrompt(agent: any): string {
  let prompt = ''

  // Add persona
  if (agent.persona) {
    prompt += `${agent.persona}\n\n`
  } else {
    prompt += 'You are a helpful and engaging assistant.\n\n'
  }

  // Add bio
  if (agent.bio) {
    prompt += `About you: ${agent.bio}\n\n`
  }

  // Add important facts
  if (agent.important_facts && agent.important_facts.length > 0) {
    prompt += 'Important facts you should know:\n'
    agent.important_facts.forEach((fact: string, index: number) => {
      prompt += `${index + 1}. ${fact}\n`
    })
    prompt += '\n'
  }

  // Add topics to avoid
  if (agent.do_nots) {
    prompt += `Important - Topics to avoid:\n${agent.do_nots}\n\n`
  }

  // Add end script
  if (agent.end_script) {
    prompt += `When ending the conversation, say: "${agent.end_script}"\n\n`
  }

  // Add general instructions
  prompt += 'Detect the language the user is speaking (English or Spanish) and respond in that language. '
  prompt += 'Keep responses brief and engaging, under 3 sentences unless more detail is requested. '
  prompt += 'Stay focused on the exhibit and facts provided.'

  return prompt
}

async function createElevenLabsAgent(payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/elevenlabs/create-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create ElevenLabs agent')
  }

  return await response.json()
}

async function updateElevenLabsAgent(agentId: string, payload: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/elevenlabs/update-agent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, ...payload })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update ElevenLabs agent')
  }

  return await response.json()
}
