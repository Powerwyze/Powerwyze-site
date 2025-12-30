-- Add unique constraint on organization_id for agent_public_paywall
-- This allows upsert operations to work correctly

ALTER TABLE agent_public_paywall
ADD CONSTRAINT agent_public_paywall_organization_id_key UNIQUE (organization_id);
