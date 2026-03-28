-- ============================================================
-- Contact Preferences for Person Scoring
-- ============================================================

-- Add contact preferences to icp_profiles
alter table public.icp_profiles
  add column if not exists ideal_titles text[] default '{}',
  add column if not exists ideal_seniority text[] default '{}',
  add column if not exists ideal_departments text[] default '{}',
  add column if not exists preferred_channels text[] default '{email,linkedin}';

-- Add person score fields to lead_scores
alter table public.lead_scores
  add column if not exists person_breakdown jsonb,
  add column if not exists persona_tag text;
