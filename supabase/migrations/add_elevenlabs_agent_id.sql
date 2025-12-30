-- Add elevenlabs_agent_id column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_elevenlabs_agent_id ON agents(elevenlabs_agent_id);

-- Add comment
COMMENT ON COLUMN agents.elevenlabs_agent_id IS 'ElevenLabs Conversational AI agent ID for real-time voice conversations';
