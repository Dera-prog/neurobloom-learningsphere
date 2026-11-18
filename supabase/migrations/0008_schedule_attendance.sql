-- NeuroBloom LearningSphere · Timetables and the class register
--
--   class_sessions  the weekly timetable for a class (one row per slot)
--   attendance      one row per learner per class per school day
--
-- Schedules belong to the class teacher and the families in that class read
-- them. The register is the school's record: only the teacher who owns the
-- class (or an admin) may mark it, and the row records who really marked it
-- rather than trusting the browser. Guardians never write attendance; an
-- absence request belongs in messages/complaints, not here.
--
-- Apply after 0007. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  room text not null default '',
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint class_sessions_time_order check (ends_at > starts_at),
  unique (class_id, weekday, starts_at)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  session_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  marked_by uuid references auth.users (id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (class_id, child_id, session_date)
);

create index if not exists class_sessions_class_idx
  on public.class_sessions (class_id, weekday, starts_at);

create index if not exists attendance_child_date_idx
  on public.attendance (child_id, session_date desc);

create index if not exists attendance_class_date_idx
  on public.attendance (class_id, session_date);

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_enrolled(target_class uuid, target_child uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where class_id = target_class and child_id = target_child
  );
$$;

create or replace function public.can_take_register(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or public.teaches_class(target_class);
$$;

create or replace function public.guard_attendance_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The service role is the school's own back office; it is not a browser.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.can_take_register(new.class_id) then
    raise exception 'Only the class teacher can take the register' using errcode = '42501';
  end if;

  if not public.is_enrolled(new.class_id, new.child_id) then
    raise exception 'That learner is not in this class' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and (new.class_id is distinct from old.class_id
          or new.child_id is distinct from old.child_id) then
    raise exception 'An attendance record cannot be moved to another learner or class' using errcode = '42501';
  end if;

  -- The record says who marked it, not who the browser claims marked it.
  new.marked_by := auth.uid();
  new.marked_at := now();
  return new;
end;
$$;

drop trigger if exists attendance_guard_writes on public.attendance;
create trigger attendance_guard_writes
  before insert or update on public.attendance
  for each row execute function public.guard_attendance_writes();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.class_sessions enable row level security;
alter table public.attendance enable row level security;

-- Timetable: everyone in the class reads it; the class teacher or an admin
-- changes it.
drop policy if exists "sessions readable by class members" on public.class_sessions;
create policy "sessions readable by class members"
  on public.class_sessions for select
  using (public.can_read_class(class_id));

drop policy if exists "sessions insertable by teacher" on public.class_sessions;
create policy "sessions insertable by teacher"
  on public.class_sessions for insert
  with check (public.teaches_class(class_id) or public.is_admin());

drop policy if exists "sessions updatable by teacher" on public.class_sessions;
create policy "sessions updatable by teacher"
  on public.class_sessions for update
  using (public.teaches_class(class_id) or public.is_admin())
  with check (public.teaches_class(class_id) or public.is_admin());

drop policy if exists "sessions deletable by teacher" on public.class_sessions;
create policy "sessions deletable by teacher"
  on public.class_sessions for delete
  using (public.teaches_class(class_id) or public.is_admin());

-- Register: the family and the child's teachers read it; only the class
-- teacher (or an admin) writes it.
drop policy if exists "attendance readable by family or teacher" on public.attendance;
create policy "attendance readable by family or teacher"
  on public.attendance for select
  using (public.can_read_child(child_id));

drop policy if exists "attendance insertable by class teacher" on public.attendance;
create policy "attendance insertable by class teacher"
  on public.attendance for insert
  with check (public.can_take_register(class_id));

drop policy if exists "attendance updatable by class teacher" on public.attendance;
create policy "attendance updatable by class teacher"
  on public.attendance for update
  using (public.can_take_register(class_id))
  with check (public.can_take_register(class_id));

drop policy if exists "attendance deletable by class teacher" on public.attendance;
create policy "attendance deletable by class teacher"
  on public.attendance for delete
  using (public.can_take_register(class_id));

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows)
-- ---------------------------------------------------------------------------

revoke all on public.class_sessions from anon;
revoke all on public.attendance from anon;

grant select, insert, update, delete on public.class_sessions to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
