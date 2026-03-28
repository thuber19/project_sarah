-- Extend agent_logs.action_type CHECK constraint for enrichment pipeline
-- Adds: enrichment_started, enrichment_completed, enrichment_failed

-- Drop existing CHECK constraint
ALTER TABLE public.agent_logs
  DROP CONSTRAINT IF EXISTS agent_logs_action_type_check;

-- Re-create with enrichment action types added
ALTER TABLE public.agent_logs
  ADD CONSTRAINT agent_logs_action_type_check
  CHECK (action_type IN (
    -- Original types
    'campaign_started',
    'campaign_completed',
    'campaign_failed',
    'leads_discovered',
    'lead_scored',
    'query_optimized',
    'website_scraped',
    'website_analyzed',
    -- Export (#75)
    'lead_exported',
    -- Onboarding funnel (#82)
    'onboarding_started',
    'onboarding_completed',
    -- Research (#56)
    'research_started',
    'research_completed',
    -- Outreach (#57)
    'outreach_generated',
    -- Conversations (#55)
    'conversation_created',
    -- Enrichment pipeline
    'enrichment_started',
    'enrichment_completed',
    'enrichment_failed'
  ));
