-- ============================================================
-- Fix: Add UNIQUE constraints on user_id for upsert support
-- ============================================================
-- saveOnboardingAction and saveSettingsAction use
-- .upsert({...}, { onConflict: 'user_id' }) which requires
-- a UNIQUE constraint on user_id. Without it, PostgreSQL
-- rejects the ON CONFLICT clause.
--
-- business_profiles and icp_profiles are 1:1 per user,
-- so a UNIQUE constraint is semantically correct.

-- Replace regular index with unique index for business_profiles
DROP INDEX IF EXISTS idx_business_profiles_user_id;
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_user_id_key UNIQUE (user_id);

-- Replace regular index with unique index for icp_profiles
DROP INDEX IF EXISTS idx_icp_profiles_user_id;
ALTER TABLE public.icp_profiles
  ADD CONSTRAINT icp_profiles_user_id_key UNIQUE (user_id);
