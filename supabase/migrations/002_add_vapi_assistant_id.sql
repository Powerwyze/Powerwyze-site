-- Add vapi_assistant_id column to agents table
-- This stores the Vapi assistant ID after syncing with Vapi API

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS vapi_assistant_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_vapi_assistant_id
ON agents(vapi_assistant_id);

-- Add comment
COMMENT ON COLUMN agents.vapi_assistant_id IS 'Vapi assistant ID returned from Vapi API after creating/updating the assistant';
