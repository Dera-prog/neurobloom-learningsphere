-- NeuroBloom LearningSphere · server-owned plan entitlements
--
-- Plans used to live only in the per-account user_state blob, which the browser
-- can write. This table is the source of truth: rows are written by the Paystack
-- endpoints and admin tooling with the service role, and parents may only read
-- their own rows. The user_state mirror stays for the mobile app and for display.
--
-- Apply after 0005 (uses public.is_admin).

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_slot text not null,
  plan_id text not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  source text not null default 'paystack' check (source in ('paystack', 'legacy', 'admin')),
  reference text,
  amount integer not null default 0 check (amount >= 0),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active child plan at a time; the Parent Access add-on runs alongside it.
create unique index if not exists subscriptions_one_active_plan
  on public.subscriptions (user_id, child_slot)
  where status = 'active' and plan_id <> 'parent_access';

create unique index if not exists subscriptions_one_active_addon
  on public.subscriptions (user_id, child_slot, plan_id)
  where status = 'active' and plan_id = 'parent_access';

create index if not exists subscriptions_user_idx
  on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions readable by owner" on public.subscriptions;
create policy "subscriptions readable by owner"
  on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill so existing paid accounts keep their plan on first load.
-- 1. The latest successful charge per child wins when a ledger row exists.
-- 2. Otherwise the plan mirrored in user_state is grandfathered in.
-- 3. An unexpired Parent Access add-on becomes its own row.
-- ---------------------------------------------------------------------------

insert into public.subscriptions
  (user_id, child_slot, plan_id, status, source, reference, amount, started_at, current_period_end)
select distinct on (p.user_id, p.child_id)
  p.user_id,
  p.child_id,
  p.plan_id,
  'active',
  'paystack',
  p.reference,
  p.amount,
  coalesce(p.paid_at, p.created_at),
  coalesce(p.paid_at, p.created_at) + interval '1 month'
from public.payments p
where p.status = 'success'
  and p.plan_id <> 'parent_access'
order by p.user_id, p.child_id, coalesce(p.paid_at, p.created_at) desc
on conflict (user_id, child_slot) where status = 'active' and plan_id <> 'parent_access' do nothing;

insert into public.subscriptions
  (user_id, child_slot, plan_id, status, source, amount, started_at, current_period_end)
select
  us.user_id,
  entry.key,
  entry.value,
  'active',
  'legacy',
  0,
  now(),
  now() + interval '1 month'
from public.user_state us
cross join lateral jsonb_each_text(coalesce(us.state -> 'plans', '{}'::jsonb)) as entry(key, value)
where entry.value in ('general', 'premium', 'premium_plus', 'special')
on conflict (user_id, child_slot) where status = 'active' and plan_id <> 'parent_access' do nothing;

insert into public.subscriptions
  (user_id, child_slot, plan_id, status, source, amount, started_at, current_period_end)
select
  us.user_id,
  entry.key,
  'parent_access',
  'active',
  'legacy',
  0,
  now(),
  (entry.value ->> 'until')::timestamptz
from public.user_state us
cross join lateral jsonb_each(coalesce(us.state -> 'parentAccess', '{}'::jsonb)) as entry(key, value)
where entry.value ->> 'active' = 'true'
  and coalesce(entry.value ->> 'until', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
  and (entry.value ->> 'until')::timestamptz > now()
on conflict (user_id, child_slot, plan_id) where status = 'active' and plan_id = 'parent_access' do nothing;
