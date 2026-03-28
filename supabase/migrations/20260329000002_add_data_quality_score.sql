-- Data quality score column for lead scoring
-- Tracks completeness/quality of lead data (0-100)

ALTER TABLE public.lead_scores
  ADD COLUMN data_quality_score integer DEFAULT 0
  CONSTRAINT lead_scores_data_quality_check
  CHECK (data_quality_score >= 0 AND data_quality_score <= 100);
