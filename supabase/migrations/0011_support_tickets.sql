-- NeuroBloom LearningSphere · Support tickets (complaints)
--
--   support_tickets  a complaint or help request from any signed-in account
--                    to the Admin Manager support desk
--
-- The requester owns the row: a crafted insert cannot file on someone else's
-- behalf, the display name and role come from the profile, and every ticket
-- starts 'open'. The requester cannot edit or withdraw a ticket afterwards;
-- they send a new one. Only an admin can reply or move a ticket to
-- 'waiting'/'resolved', and the reviewer's name and time are stamped by the
-- database, so the requester can trust the reply they see.
--
-- Apply after 0010. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  requester_name text not null default '',
  requester_role text not null default 'teacher',
  category text not null default 'Something else'
    check (char_length(btrim(category)) between 2 and 60),
  subject text not null check (char_length(btrim(subject)) between 2 and 80),
  body text not null check (char_length(btrim(body)) between 5 and 4000),
  priority text not null default 'normal' check (priority in ('urgent', 'high', 'normal')),
  status text not null default 'open' check (status in ('open', 'waiting', 'resolved')),
  reply text not null default '',
  replied_by uuid references auth.users (id) on delete set null,
  replied_by_name text not null default '',
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_requester_idx
  on public.support_tickets (requester_id, created_at desc);

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Guard trigger
-- ---------------------------------------------------------------------------

create or replace function public.guard_support_ticket_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    new.requester_id := auth.uid();
    new.requester_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
    new.requester_role := coalesce((select role from public.profiles where id = auth.uid()), 'teacher');
    new.status := 'open';
    new.reply := '';
    new.replied_by := null;
    new.replied_by_name := '';
    new.replied_at := null;
    new.updated_at := now();
    return new;
  end if;

  if not public.is_admin() then
    raise exception 'Only the admin team can reply to a ticket' using errcode = '42501';
  end if;

  -- Identity and the original complaint are fixed; an admin answers it.
  if new.requester_id <> old.requester_id
     or new.requester_name <> old.requester_name
     or new.requester_role <> old.requester_role
     or new.category <> old.category
     or new.subject <> old.subject
     or new.body <> old.body
     or new.priority <> old.priority
     or new.created_at <> old.created_at
  then
    raise exception 'Only the status and reply can change' using errcode = '42501';
  end if;

  if new.reply is distinct from old.reply then
    new.replied_by := auth.uid();
    new.replied_by_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
    new.replied_at := now();
  else
    new.replied_by := old.replied_by;
    new.replied_by_name := old.replied_by_name;
    new.replied_at := old.replied_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists support_tickets_guard_writes on public.support_tickets;
create trigger support_tickets_guard_writes
  before insert or update on public.support_tickets
  for each row execute function public.guard_support_ticket_writes();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.support_tickets enable row level security;

drop policy if exists "tickets readable by requester or admin" on public.support_tickets;
create policy "tickets readable by requester or admin"
  on public.support_tickets for select
  using (requester_id = auth.uid() or public.is_admin());

drop policy if exists "accounts file their own tickets" on public.support_tickets;
create policy "accounts file their own tickets"
  on public.support_tickets for insert
  with check (requester_id = auth.uid());

drop policy if exists "admins answer tickets" on public.support_tickets;
create policy "admins answer tickets"
  on public.support_tickets for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows)
-- ---------------------------------------------------------------------------

revoke all on public.support_tickets from anon;
revoke all on public.support_tickets from authenticated;

grant select, insert, update on public.support_tickets to authenticated;
