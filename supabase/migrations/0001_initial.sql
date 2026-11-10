-- NeuroBloom LearningSphere · initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('junior', 'senior', 'special', 'teacher', 'parent')),
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  recipient text not null,
  kind text not null check (kind in ('plan', 'booking', 'support')),
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_user_kind_idx
  on public.email_log (user_id, kind, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.email_log enable row level security;

drop policy if exists "profiles are self readable" on public.profiles;
create policy "profiles are self readable"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles are self insertable" on public.profiles;
create policy "profiles are self insertable"
  on public.profiles for insert
  with check (auth.uid() = id);

-- No update policy on profiles: the role is fixed at signup so a user cannot
-- promote themselves into another dashboard.

drop policy if exists "state is self readable" on public.user_state;
create policy "state is self readable"
  on public.user_state for select
  using (auth.uid() = user_id);

drop policy if exists "state is self insertable" on public.user_state;
create policy "state is self insertable"
  on public.user_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "state is self updatable" on public.user_state;
create policy "state is self updatable"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- email_log is server-only: RLS on, no policies for anon/authenticated.
-- The Vercel function reads and writes it with the service role key.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', '');
  safe_role text := case
    when requested in ('junior', 'senior', 'special', 'teacher', 'parent') then requested
    else 'junior'
  end;
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    safe_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;

  insert into public.user_state (user_id, state)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
