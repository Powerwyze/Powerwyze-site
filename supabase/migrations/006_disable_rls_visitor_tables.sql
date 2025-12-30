-- Disable RLS for visitor tables since we use service role key
ALTER TABLE visitor_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_public_paywall DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want RLS enabled but allow service role access,
-- you can create permissive policies instead (commented out):
-- ALTER TABLE visitor_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_public_paywall ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow service role full access to visitor_payments"
--   ON visitor_payments FOR ALL
--   USING (true)
--   WITH CHECK (true);
--
-- CREATE POLICY "Allow service role full access to visitor_sessions"
--   ON visitor_sessions FOR ALL
--   USING (true)
--   WITH CHECK (true);
--
-- CREATE POLICY "Allow service role full access to agent_public_paywall"
--   ON agent_public_paywall FOR ALL
--   USING (true)
--   WITH CHECK (true);
