-- ============================================================
-- Issue #123: Competitor Analysis — Tech-Stack & Wettbewerber
-- ============================================================

create table if not exists public.competitor_analyses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  lead_id         uuid not null references public.leads(id) on delete cascade,
  tech_stack      text[] not null default '{}',
  competitor_matches jsonb not null default '[]',
  icp_tech_matched   text[] not null default '{}',
  icp_tech_unmatched text[] not null default '{}',
  ai_summary      text,
  analyzed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS Policies
alter table public.competitor_analyses enable row level security;

create policy "Users can view own competitor analyses"
  on public.competitor_analyses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own competitor analyses"
  on public.competitor_analyses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own competitor analyses"
  on public.competitor_analyses for update
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete own competitor analyses"
  on public.competitor_analyses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Indexes
create index idx_competitor_analyses_user_lead
  on public.competitor_analyses(user_id, lead_id);

create index idx_competitor_analyses_analyzed_at
  on public.competitor_analyses(analyzed_at desc);
