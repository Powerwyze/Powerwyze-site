-- Visitor payments table
CREATE TABLE visitor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(visitor_id, organization_id)
);

-- Visitor sessions table
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  tier INT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_visitor_payments_organization ON visitor_payments(organization_id);
CREATE INDEX idx_visitor_payments_visitor ON visitor_payments(visitor_id);
CREATE INDEX idx_visitor_payments_status ON visitor_payments(status);
CREATE INDEX idx_visitor_payments_expires ON visitor_payments(expires_at);
CREATE INDEX idx_visitor_sessions_agent ON visitor_sessions(agent_id);
CREATE INDEX idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);
CREATE INDEX idx_visitor_sessions_token ON visitor_sessions(session_token);
CREATE INDEX idx_visitor_sessions_expires ON visitor_sessions(expires_at);
