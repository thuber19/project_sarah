-- Add communication style JSONB column to business_profiles
-- Used by the Kommunikationsstil settings tab for personalized AI outreach
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS communication_style JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN business_profiles.communication_style IS 'User communication style preferences for AI-generated outreach (email, voice)';
