-- Lead enrichment tracking
-- Adds enrichment_status column to leads table for the enrichment pipeline

ALTER TABLE public.leads
  ADD COLUMN enrichment_status text NOT NULL DEFAULT 'pending'
  CONSTRAINT leads_enrichment_status_check
  CHECK (enrichment_status IN ('pending', 'enriching', 'enriched', 'skipped', 'failed'));

-- Partial index: only index rows that are actionable (pending or in-progress)
CREATE INDEX idx_leads_enrichment_status ON public.leads(enrichment_status)
  WHERE enrichment_status IN ('pending', 'enriching');
