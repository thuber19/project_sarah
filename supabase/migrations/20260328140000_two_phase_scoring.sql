-- ============================================================
-- Two-Phase Scoring: Company Score + Person Score
-- ============================================================

-- Add two-phase scoring columns to lead_scores
alter table public.lead_scores
  add column if not exists company_score integer,
  add column if not exists person_score integer,
  add column if not exists company_qualified boolean default true;

-- Add exclusion criteria to icp_profiles
alter table public.icp_profiles
  add column if not exists excluded_industries text[] default '{}',
  add column if not exists excluded_company_sizes text[] default '{}',
  add column if not exists excluded_countries text[] default '{}',
  add column if not exists excluded_keywords text[] default '{}';
