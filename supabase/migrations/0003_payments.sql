-- NeuroBloom LearningSphere · Paystack payment ledger
-- Plans stay in user_state.state.plans; this table is the audit trail of charges.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id text not null,
  plan_id text not null check (plan_id in ('general', 'premium', 'special')),
  reference text not null unique,
  amount integer not null,
  currency text not null default 'NGN',
  status text not null default 'success',
  channel text,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_created_idx
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

drop policy if exists "payments are self readable" on public.payments;
create policy "payments are self readable"
  on public.payments for select
  using (auth.uid() = user_id);

-- No insert/update policies: only the Vercel functions (service role) write here,
-- so a client cannot mint a receipt or flip a plan on its own.
