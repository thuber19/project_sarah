-- ============================================================
-- Issue #68: Add missing indices for RLS policy performance
-- ============================================================
-- Every column referenced in an RLS policy MUST have a btree index.
-- Missing indices on user_id columns cause 10-100x query slowdowns.
-- See: .claude/rules/backend-data.md > RLS Performance

-- business_profiles: RLS uses auth.uid() = user_id
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id
  ON public.business_profiles(user_id);

-- icp_profiles: RLS uses auth.uid() = user_id
CREATE INDEX IF NOT EXISTS idx_icp_profiles_user_id
  ON public.icp_profiles(user_id);

-- lead_scores: RLS uses auth.uid() = user_id
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id
  ON public.lead_scores(user_id);

-- agent_logs: RLS uses auth.uid() = user_id (missing in initial schema)
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id
  ON public.agent_logs(user_id);
