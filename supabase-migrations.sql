-- Visitor-related tables for paywall and sessions
-- Run this in Supabase SQL Editor

-- Agent public paywall configuration (one per organization)
CREATE TABLE IF NOT EXISTS agent_public_paywall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT false,
  amount INTEGER NOT NULL, -- in cents (e.g., 500 = $5.00)
  currency TEXT DEFAULT 'usd',
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_paywall_org_active ON agent_public_paywall(organization_id, active);

-- Visitor payment records
CREATE TABLE IF NOT EXISTS visitor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id, organization_id)
);

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_visitor_payments_org_visitor ON visitor_payments(organization_id, visitor_id, status);

-- Visitor talk sessions (ephemeral tokens for voice calls)
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  tier INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session token lookups
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_token ON visitor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_expires ON visitor_sessions(expires_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE agent_public_paywall ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access to paywall config (visitors need to check if paywall is active)
CREATE POLICY "Public can read active paywalls" ON agent_public_paywall
  FOR SELECT USING (active = true);

-- Authenticated users can manage their org's paywall
CREATE POLICY "Org members can manage paywall" ON agent_public_paywall
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Service role can manage everything (needed for API routes)
-- No policy needed - service role bypasses RLS

-- Landing page spec for agents
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS landing_spec JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS landing_last_generated_at TIMESTAMPTZ DEFAULT NULL;
