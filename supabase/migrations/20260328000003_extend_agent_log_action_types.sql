-- Extend agent_logs.action_type CHECK constraint for new features
-- Issues: #75 (CSV Export), #79 (AI Cost Tracking), #81 (Pipeline Timing),
-- #82 (Onboarding Funnel), #56 (Research), #57 (Outreach)

-- Drop existing CHECK constraint
ALTER TABLE public.agent_logs
  DROP CONSTRAINT IF EXISTS agent_logs_action_type_check;

-- Re-create with extended action types
ALTER TABLE public.agent_logs
  ADD CONSTRAINT agent_logs_action_type_check
  CHECK (action_type IN (
    -- Existing types
    'campaign_started',
    'campaign_completed',
    'campaign_failed',
    'leads_discovered',
    'lead_scored',
    'query_optimized',
    'website_scraped',
    'website_analyzed',
    -- New: Export (#75)
    'lead_exported',
    -- New: Onboarding funnel (#82)
    'onboarding_started',
    'onboarding_completed',
    -- New: Research (#56)
    'research_started',
    'research_completed',
    -- New: Outreach (#57)
    'outreach_generated',
    -- New: Conversations (#55)
    'conversation_created'
  ));

-- Add index on lead_scores(grade) for query optimization (#77)
CREATE INDEX IF NOT EXISTS idx_lead_scores_grade ON public.lead_scores(grade);
