-- ============================================================
-- Issue #2: Supabase Setup – Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. business_profiles
-- ============================================================
create table if not exists public.business_profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  website_url   text not null,
  company_name  text,
  description   text,
  industry      text,
  product_summary text,
  value_proposition text,
  target_market text,
  raw_scraped_content text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- 2. icp_profiles
-- ============================================================
create table if not exists public.icp_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  job_titles        text[],
  seniority_levels  text[],
  industries        text[],
  company_sizes     text[],
  regions           text[],
  tech_stack        text[],
  revenue_ranges    text[],
  funding_stages    text[],
  keywords          text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 3. search_campaigns
-- ============================================================
create table if not exists public.search_campaigns (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  icp_profile_id      uuid references public.icp_profiles(id) on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending', 'running', 'completed', 'failed')),
  leads_found         integer not null default 0,
  leads_scored        integer not null default 0,
  started_at          timestamptz,
  completed_at        timestamptz,
  error_message       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- 4. leads
-- ============================================================
create table if not exists public.leads (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  campaign_id       uuid references public.search_campaigns(id) on delete cascade,
  -- Contact info
  first_name        text,
  last_name         text,
  full_name         text,
  email             text,
  linkedin_url      text,
  photo_url         text,
  -- Job info
  job_title         text,
  seniority         text,
  -- Company info
  company_name      text,
  company_domain    text,
  company_website   text,
  industry          text,
  company_size      text,
  revenue_range     text,
  funding_stage     text,
  location          text,
  country           text,
  -- Source
  source            text check (source in ('apollo', 'google_places', 'enriched')),
  apollo_id         text,
  -- Raw data
  raw_data          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- 5. lead_scores
-- ============================================================
create table if not exists public.lead_scores (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  campaign_id         uuid references public.search_campaigns(id) on delete set null,
  -- Rule-based score (0-100)
  total_score         integer not null default 0 check (total_score between 0 and 100),
  company_fit_score   integer not null default 0 check (company_fit_score between 0 and 40),
  contact_fit_score   integer not null default 0 check (contact_fit_score between 0 and 20),
  buying_signals_score integer not null default 0 check (buying_signals_score between 0 and 25),
  timing_score        integer not null default 0 check (timing_score between 0 and 15),
  grade               text not null default 'POOR'
                        check (grade in ('HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR')),
  -- AI layer (German)
  ai_reasoning        text,
  recommended_action  text,
  confidence          numeric(3,2) check (confidence between 0 and 1),
  dach_notes          text,
  key_insights        text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (lead_id)
);

-- ============================================================
-- 6. agent_logs
-- ============================================================
create table if not exists public.agent_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid references public.search_campaigns(id) on delete cascade,
  action_type   text not null check (action_type in (
                  'campaign_started',
                  'campaign_completed',
                  'campaign_failed',
                  'leads_discovered',
                  'lead_scored',
                  'query_optimized',
                  'website_scraped',
                  'website_analyzed'
                )),
  message       text not null,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.business_profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.icp_profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.search_campaigns
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.leads
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.lead_scores
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.business_profiles enable row level security;
alter table public.icp_profiles      enable row level security;
alter table public.search_campaigns  enable row level security;
alter table public.leads             enable row level security;
alter table public.lead_scores       enable row level security;
alter table public.agent_logs        enable row level security;

-- business_profiles
create policy "users can manage own business_profiles"
  on public.business_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- icp_profiles
create policy "users can manage own icp_profiles"
  on public.icp_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- search_campaigns
create policy "users can manage own search_campaigns"
  on public.search_campaigns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- leads
create policy "users can manage own leads"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lead_scores
create policy "users can manage own lead_scores"
  on public.lead_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- agent_logs
create policy "users can manage own agent_logs"
  on public.agent_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Realtime: enable for agent_logs
-- ============================================================
alter publication supabase_realtime add table public.agent_logs;

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index if not exists idx_leads_campaign_id        on public.leads(campaign_id);
create index if not exists idx_leads_user_id            on public.leads(user_id);
create index if not exists idx_lead_scores_lead_id      on public.lead_scores(lead_id);
create index if not exists idx_lead_scores_total_score  on public.lead_scores(total_score desc);
create index if not exists idx_agent_logs_campaign_id   on public.agent_logs(campaign_id);
create index if not exists idx_agent_logs_created_at    on public.agent_logs(created_at desc);
create index if not exists idx_search_campaigns_user_id on public.search_campaigns(user_id);
