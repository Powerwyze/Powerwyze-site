-- Add landing page spec columns to agents table
-- This allows agents to have custom landing pages with backgrounds

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS landing_spec JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS landing_last_generated_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN agents.landing_spec IS 'JSON spec for custom landing page layout, content, and background';
COMMENT ON COLUMN agents.landing_last_generated_at IS 'Timestamp when landing page was last AI-generated';
