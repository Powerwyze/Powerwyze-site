-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('museum', 'event')),
  display_name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  default_paywall_enabled BOOLEAN DEFAULT FALSE,
  default_paywall_amount_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  tier INT NOT NULL CHECK (tier IN (1, 2, 3)),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  persona TEXT,
  do_nots TEXT,
  important_facts JSONB DEFAULT '[]',
  end_script TEXT,
  voice_id TEXT,
  languages TEXT[] DEFAULT '{en,es}',
  multilingual BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'testing', 'published')) DEFAULT 'draft',
  public_id UUID UNIQUE DEFAULT gen_random_uuid(),
  qr_shape TEXT CHECK (qr_shape IN ('square', 'circle')) DEFAULT 'square',
  first_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent capabilities (Tier 3 only)
CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  can_send_email BOOLEAN DEFAULT FALSE,
  can_send_sms BOOLEAN DEFAULT FALSE,
  can_take_orders BOOLEAN DEFAULT FALSE,
  can_post_social BOOLEAN DEFAULT FALSE,
  function_manifest JSONB DEFAULT '{}'
);

-- Pricing plans
CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier INT NOT NULL UNIQUE,
  monthly_cents INT NOT NULL,
  annual_cents INT NOT NULL
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  discount_percent INT DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 30),
  billing_cycle_anchor TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent public paywall
CREATE TABLE agent_public_paywall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  amount_cents INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  CHECK (EXTRACT(EPOCH FROM (ends_at - starts_at)) >= 28800), -- minimum 8 hours
  CHECK (EXTRACT(EPOCH FROM (ends_at - starts_at)) <= 31536000) -- maximum 1 year
);

-- Publish events
CREATE TABLE publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('created', 'updated', 'published')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage logs
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('test', 'live')),
  seconds INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venues_organization ON venues(organization_id);
CREATE INDEX idx_agents_organization ON agents(organization_id);
CREATE INDEX idx_agents_venue ON agents(venue_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_public_id ON agents(public_id);
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_publish_events_agent ON publish_events(agent_id);
CREATE INDEX idx_usage_logs_agent ON usage_logs(agent_id);
CREATE INDEX idx_usage_logs_started_at ON usage_logs(started_at);
