-- Lead research persistence (Issue #56)

CREATE TABLE public.lead_research (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id         uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tech_stack      text[],
  hiring_info     text,
  pricing_model   text,
  news_summary    text,
  impressum       jsonb,
  handelsregister text,
  locations       text[],
  full_report     text NOT NULL,
  sources         jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id)
);

-- RLS
ALTER TABLE public.lead_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_research" ON public.lead_research
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_lead_research_lead_id ON public.lead_research(lead_id);
CREATE INDEX idx_lead_research_user_id ON public.lead_research(user_id);

-- updated_at trigger
CREATE TRIGGER set_lead_research_updated_at
  BEFORE UPDATE ON public.lead_research
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
