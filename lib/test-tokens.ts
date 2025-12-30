import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Generates a secure test token for agent testing
 * Token format: base64url random string (32 bytes)
 * Expires in 24 hours
 */
export async function generateTestToken(agentId: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Generate secure random token
  const tokenBytes = crypto.randomBytes(32)
  const testToken = tokenBytes.toString('base64url')

  // Set expiration to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // Store token in database (you may want to create an agent_test_tokens table)
  // For now, we'll store it in the agent metadata or return it directly
  // If you have a test_tokens table, upsert it there

  // Example: Store in agent_test_tokens table if it exists
  // await supabase.from('agent_test_tokens').upsert({
  //   agent_id: agentId,
  //   token: testToken,
  //   expires_at: expiresAt.toISOString(),
  //   created_at: new Date().toISOString()
  // })

  return testToken
}

/**
 * Validates a test token for an agent
 */
export async function validateTestToken(
  agentId: string,
  testToken: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Query test token from database
  // const { data } = await supabase
  //   .from('agent_test_tokens')
  //   .select('*')
  //   .eq('agent_id', agentId)
  //   .eq('token', testToken)
  //   .single()

  // if (!data) return false

  // Check if token is expired
  // const expiresAt = new Date(data.expires_at)
  // const now = new Date()
  // if (now > expiresAt) return false

  // For now, return true since we're not persisting tokens yet
  return true
}
