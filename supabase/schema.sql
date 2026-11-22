-- BayaniHan backend (Supabase / Postgres).
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Who can do what (enforced by Row Level Security, not by the app):
--   • Anyone (anonymous app users): submit reports and surveys, read APPROVED reports,
--     read survey stats WITHOUT free-text comments, check the status of reports they submitted.
--   • Coordinators (rows in public.coordinators): read everything, approve/reject/flag/edit reports.

create extension if not exists pgcrypto;

-- ---------- Coordinators ----------
create table if not exists public.coordinators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  barangay text,
  created_at timestamptz not null default now()
);
alter table public.coordinators enable row level security;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.coordinators where user_id = auth.uid());
$$;

drop policy if exists "coordinators see coordinators" on public.coordinators;
create policy "coordinators see coordinators" on public.coordinators
  for select to authenticated using (public.is_coordinator());

-- ---------- Reports ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('lighting', 'harassment', 'abandoned', 'route', 'flooding', 'other')),
  severity int not null check (severity between 1 and 5),
  barangay text not null check (char_length(barangay) between 2 and 60),
  time_of_day text not null check (time_of_day in ('day', 'evening', 'night')),
  "group" text not null check ("group" in ('everyone', 'girls', 'lgbtq', 'pwd', 'osy')),
  description text not null check (char_length(description) between 5 and 400),
  lat double precision not null check (lat between 13.4 and 13.8),
  lng double precision not null check (lng between 123.0 and 123.45),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  confirmations int not null default 0,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
alter table public.reports enable row level security;

-- Anyone may submit, but only as a fresh pending report.
drop policy if exists "anyone submits pending reports" on public.reports;
create policy "anyone submits pending reports" on public.reports
  for insert to anon, authenticated
  with check (status = 'pending' and confirmations = 0);

-- The public map only ever sees approved reports.
drop policy if exists "public reads approved" on public.reports;
create policy "public reads approved" on public.reports
  for select to anon, authenticated
  using (status = 'approved' or public.is_coordinator());

drop policy if exists "coordinators moderate" on public.reports;
create policy "coordinators moderate" on public.reports
  for update to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- Status lookup for "My reports": a device only knows the ids it generated itself.
create or replace function public.report_status(ids uuid[])
returns table (id uuid, status text)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.status from public.reports r where r.id = any(ids) limit 100;
$$;

-- "Me too": anyone can add one confirmation to an approved report.
create or replace function public.confirm_report(report_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update public.reports set confirmations = confirmations + 1
  where id = report_id and status = 'approved'
  returning confirmations;
$$;

-- ---------- Surveys ----------
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  barangay text not null check (char_length(barangay) between 2 and 60),
  feeling text not null check (feeling in ('safe', 'mostly_safe', 'sometimes_unsafe', 'unsafe')),
  time_of_day text not null check (time_of_day in ('day', 'evening', 'night')),
  "group" text not null check ("group" in ('everyone', 'girls', 'lgbtq', 'pwd', 'osy')),
  wants text[] not null default '{}',
  comment text not null default '' check (char_length(comment) <= 400),
  created_at timestamptz not null default now()
);
alter table public.surveys enable row level security;

drop policy if exists "anyone submits surveys" on public.surveys;
create policy "anyone submits surveys" on public.surveys
  for insert to anon, authenticated with check (true);

drop policy if exists "coordinators read surveys" on public.surveys;
create policy "coordinators read surveys" on public.surveys
  for select to authenticated using (public.is_coordinator());

-- Public findings use this view: everything except the free-text comment.
create or replace view public.survey_stats as
  select id, barangay, feeling, time_of_day, "group", wants, created_at from public.surveys;
grant select on public.survey_stats to anon, authenticated;

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated;
grant select, insert on public.reports to anon, authenticated;
grant update on public.reports to authenticated;
grant insert on public.surveys to anon, authenticated;
grant select on public.surveys to authenticated;
grant execute on function public.report_status(uuid[]) to anon, authenticated;
grant execute on function public.confirm_report(uuid) to anon, authenticated;
grant execute on function public.is_coordinator() to anon, authenticated;

-- ---------- Add a coordinator ----------
-- 1. Dashboard → Authentication → Users → "Add user" (email + password). Turn OFF "Allow new users to sign up"
--    in Authentication → Sign In / Providers so strangers can't create accounts.
-- 2. Then run (replace the email):
--    insert into public.coordinators (user_id, name)
--    select id, 'Coordinator name' from auth.users where email = 'coordinator@example.com';
