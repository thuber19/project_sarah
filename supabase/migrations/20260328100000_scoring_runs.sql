-- scoring_runs: tracks background scoring pipeline executions
create table if not exists public.scoring_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  total_leads int not null default 0,
  scored_leads int not null default 0,
  failed_leads int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.scoring_runs enable row level security;

create policy "Users see own scoring runs"
  on public.scoring_runs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert own scoring runs"
  on public.scoring_runs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own scoring runs"
  on public.scoring_runs for update
  to authenticated
  using ((select auth.uid()) = user_id);

-- Index for RLS performance
create index if not exists scoring_runs_user_id_idx on public.scoring_runs(user_id);
create index if not exists scoring_runs_status_idx on public.scoring_runs(status);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scoring_runs_updated_at
  before update on public.scoring_runs
  for each row execute function public.set_updated_at();

-- Enable Realtime
alter publication supabase_realtime add table public.scoring_runs;
