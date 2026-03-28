-- ============================================================
-- Issue #56: Lead Research Agent mit Website Deep Dive
-- ============================================================

create table if not exists public.lead_research (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  lead_id               uuid not null references public.leads(id) on delete cascade,
  tech_stack            text[],
  hiring_activity       text,
  growth_signals        text,
  dach_data             jsonb,
  full_report           text,
  research_at           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- RLS Policies
alter table public.lead_research enable row level security;

create policy "Users can view own lead research"
  on public.lead_research for select
  using (auth.uid() = user_id);

create policy "Users can insert own lead research"
  on public.lead_research for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lead research"
  on public.lead_research for update
  using (auth.uid() = user_id);

create policy "Users can delete own lead research"
  on public.lead_research for delete
  using (auth.uid() = user_id);

-- Index for faster lookups
create index idx_lead_research_user_lead
  on public.lead_research(user_id, lead_id);

create index idx_lead_research_research_at
  on public.lead_research(research_at desc);
