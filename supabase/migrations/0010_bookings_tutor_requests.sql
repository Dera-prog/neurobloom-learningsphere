-- NeuroBloom LearningSphere · Bookings and tutor requests
--
--   bookings        a learner's reservation with a tutor from the catalogue
--   tutor_requests  a learner asking the teacher pool for help on a topic
--
-- The account that books owns the row: a crafted insert cannot book on someone
-- else's behalf, a booking always starts 'upcoming', and the only change the
-- owner can make is to cancel it. A tutor request is stamped with the poster's
-- name from their profile; only a teacher (or an admin) can answer one, and the
-- accept stamps are written server-side. Accepting is what puts a session on the
-- teacher's calendar, so the learner sees the decision on their next load.
--
-- The tutor catalogue itself is display content, so a booking stores the tutor
-- name and rate shown at the time it was made.
--
-- Apply after 0009. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  requester_name text not null default '',
  tutor_name text not null check (char_length(btrim(tutor_name)) between 2 and 80),
  tutor_emoji text not null default '',
  subject text not null check (char_length(btrim(subject)) between 2 and 60),
  slot text not null check (char_length(btrim(slot)) between 2 and 80),
  rate integer not null default 0 check (rate between 0 and 1000000),
  audience text not null default 'senior' check (audience in ('senior', 'parent')),
  child_id uuid references public.children (id) on delete set null,
  notes text not null default '',
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_requester_idx
  on public.bookings (requester_id, created_at desc);

create table if not exists public.tutor_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  student_name text not null default '',
  level text not null default 'JSS1' check (char_length(btrim(level)) between 2 and 20),
  topic text not null check (char_length(btrim(topic)) between 3 and 120),
  rate integer not null default 15000 check (rate between 0 and 1000000),
  specialist boolean not null default false,
  preferred_time text not null default '',
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_by_name text not null default '',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tutor_requests_status_idx
  on public.tutor_requests (status, created_at desc);
create index if not exists tutor_requests_accepted_by_idx
  on public.tutor_requests (accepted_by);

-- ---------------------------------------------------------------------------
-- Guard triggers
-- ---------------------------------------------------------------------------

create or replace function public.guard_booking_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Account deletion and other server-side cascades run without a JWT role.
  if auth.role() is null then return new; end if;
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    new.requester_id := auth.uid();
    new.requester_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
    new.status := 'upcoming';
    if new.child_id is not null then
      if not public.is_guardian_of(new.child_id) and not public.is_admin() then
        raise exception 'You can only book for your own child' using errcode = '42501';
      end if;
      new.audience := 'parent';
    end if;
    return new;
  end if;

  if public.is_admin() then return new; end if;

  -- The owner may cancel an upcoming session and change nothing else.
  if old.requester_id = auth.uid()
     and old.status = 'upcoming'
     and new.status = 'cancelled'
     and new.requester_id = old.requester_id
     and new.requester_name = old.requester_name
     and new.tutor_name = old.tutor_name
     and new.tutor_emoji = old.tutor_emoji
     and new.subject = old.subject
     and new.slot = old.slot
     and new.rate = old.rate
     and new.audience = old.audience
     and new.child_id is not distinct from old.child_id
     and new.notes = old.notes
  then
    return new;
  end if;

  raise exception 'A booking can only be cancelled by the account that made it' using errcode = '42501';
end;
$$;

drop trigger if exists bookings_guard_writes on public.bookings;
create trigger bookings_guard_writes
  before insert or update on public.bookings
  for each row execute function public.guard_booking_writes();

create or replace function public.guard_tutor_request_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Account deletion and other server-side cascades run without a JWT role.
  if auth.role() is null then return new; end if;
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'INSERT' then
    new.student_id := auth.uid();
    new.student_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
    new.status := 'open';
    new.accepted_by := null;
    new.accepted_by_name := '';
    new.accepted_at := null;
    return new;
  end if;

  if not public.is_admin() and not public.is_teacher() then
    raise exception 'Only a teacher can answer a tutoring request' using errcode = '42501';
  end if;
  if old.status <> 'open' then
    raise exception 'This request has already been answered' using errcode = '42501';
  end if;
  if old.student_id = auth.uid() then
    raise exception 'You cannot answer your own request' using errcode = '42501';
  end if;
  if new.status not in ('accepted', 'declined') then
    raise exception 'Answer a request with accepted or declined' using errcode = '42501';
  end if;
  if new.student_id <> old.student_id
     or new.student_name <> old.student_name
     or new.level <> old.level
     or new.topic <> old.topic
     or new.rate <> old.rate
     or new.specialist <> old.specialist
     or new.preferred_time <> old.preferred_time
  then
    raise exception 'Only the request status can change' using errcode = '42501';
  end if;
  new.accepted_by := auth.uid();
  new.accepted_by_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
  new.accepted_at := now();
  return new;
end;
$$;

drop trigger if exists tutor_requests_guard_writes on public.tutor_requests;
create trigger tutor_requests_guard_writes
  before insert or update on public.tutor_requests
  for each row execute function public.guard_tutor_request_writes();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.bookings enable row level security;
alter table public.tutor_requests enable row level security;

drop policy if exists "bookings readable by owner or admin" on public.bookings;
create policy "bookings readable by owner or admin"
  on public.bookings for select
  using (requester_id = auth.uid() or public.is_admin());

drop policy if exists "learners book for themselves" on public.bookings;
create policy "learners book for themselves"
  on public.bookings for insert
  with check (requester_id = auth.uid());

drop policy if exists "bookings cancellable by owner or admin" on public.bookings;
create policy "bookings cancellable by owner or admin"
  on public.bookings for update
  using (requester_id = auth.uid() or public.is_admin())
  with check (requester_id = auth.uid() or public.is_admin());

drop policy if exists "tutor requests readable by poster, teachers and admin" on public.tutor_requests;
create policy "tutor requests readable by poster, teachers and admin"
  on public.tutor_requests for select
  using (
    student_id = auth.uid()
    or public.is_admin()
    or (public.is_teacher() and (status = 'open' or accepted_by = auth.uid()))
  );

drop policy if exists "learners post their own tutor requests" on public.tutor_requests;
create policy "learners post their own tutor requests"
  on public.tutor_requests for insert
  with check (student_id = auth.uid());

drop policy if exists "teachers answer tutor requests" on public.tutor_requests;
create policy "teachers answer tutor requests"
  on public.tutor_requests for update
  using (public.is_teacher() or public.is_admin())
  with check (public.is_teacher() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows)
-- ---------------------------------------------------------------------------

revoke all on public.bookings from anon;
revoke all on public.tutor_requests from anon;

grant select, insert, update on public.bookings to authenticated;
grant select, insert, update on public.tutor_requests to authenticated;
