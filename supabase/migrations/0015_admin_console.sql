-- NeuroBloom LearningSphere · Admin console backend
--
-- The Admin Manager used to keep its operational data in the browser
-- (localStorage): the moderation queue, payouts, catalogue, invoices,
-- payroll, feedback and settings. That meant two admins on two laptops saw
-- different numbers, and clearing site data silently wiped the console.
--
-- This migration gives that data a server home and lets admins read the
-- platform records they are responsible for:
--
--   1. admin_records      console-owned documents (one row per collection)
--   2. profiles.status    suspension state managed by an administrator
--   3. profiles.verified  approval flag for accounts outside the 0009 queue
--   4. admin visibility   admins may read every profile and payment row
--
-- Role changes stay blocked by the 0013 guard trigger; these policies only
-- add the reads and the status/verified writes the console needs.
--
-- Apply after 0014. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Console records
-- ---------------------------------------------------------------------------

create table if not exists public.admin_records (
  collection text not null
    check (collection in ('console', 'products', 'invoices', 'payroll', 'feedback', 'settings')),
  id text not null check (char_length(btrim(id)) between 1 and 64),
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) in ('object', 'array')),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists admin_records_updated_idx
  on public.admin_records (collection, updated_at desc);

alter table public.admin_records enable row level security;

drop policy if exists "admins manage console records" on public.admin_records;
create policy "admins manage console records"
  on public.admin_records for all
  using (public.is_admin())
  with check (public.is_admin());

-- Stamp who saved a document and when, so two admins can see whose edit won.
create or replace function public.touch_admin_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists admin_records_touch on public.admin_records;
create trigger admin_records_touch
  before insert or update on public.admin_records
  for each row execute function public.touch_admin_record();

revoke all on public.admin_records from anon;
grant select, insert, update, delete on public.admin_records to authenticated;

-- Cancelling a plan stops the renewal; it does not move money. The Paystack
-- endpoints own the entitlement mirror, so the console only flips this row.
create or replace function public.admin_cancel_subscription(target uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Only an administrator can cancel a subscription' using errcode = '42501';
  end if;
  update public.subscriptions
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = target and status = 'active';
  return found;
end;
$$;

revoke all on function public.admin_cancel_subscription(uuid) from public, anon;
grant execute on function public.admin_cancel_subscription(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Account status and approval
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists verified boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active', 'suspended'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Admin visibility
-- ---------------------------------------------------------------------------

drop policy if exists "admins read every profile" on public.profiles;
create policy "admins read every profile"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins manage account status" on public.profiles;
create policy "admins manage account status"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read every payment" on public.payments;
create policy "admins read every payment"
  on public.payments for select
  using (public.is_admin());
