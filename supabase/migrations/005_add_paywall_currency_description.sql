-- Add currency and description columns to agent_public_paywall
ALTER TABLE agent_public_paywall
ADD COLUMN currency TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN description TEXT;
