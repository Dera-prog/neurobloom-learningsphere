-- NeuroBloom LearningSphere · Phase 1 school data model
-- Homework now lives in real tables instead of the per-account user_state blob.
--
--   children             a guardian's learners (the page's child switcher)
--   classes              a subject taught by one teacher
--   enrollments          which child sits in which class
--   assignments          work set by a class teacher
--   submissions          one per child + assignment (status, score, feedback)
--   activity_completions at-home practice marked done by a guardian
--
-- Apply after 0004. Safe to re-run (drops policies before creating them).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  class_level text not null default 'JSS1',
  special_needs boolean not null default false,
  created_at timestamptz not null default now(),
  unique (guardian_id, full_name)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  level text not null default 'JSS1',
  teacher_id uuid references public.profiles (id) on delete set null,
  teacher_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  class_id uuid not null references public.classes (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, child_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  title text not null,
  subject text not null,
  type text not null default 'Homework',
  description text not null default '',
  instructions text,
  points integer not null default 0 check (points >= 0),
  stage text not null default 'junior' check (stage in ('junior', 'senior')),
  due_at timestamptz,
  auto_grade boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'graded')),
  score integer check (score is null or score >= 0),
  feedback text,
  answer_text text,
  attachment_name text,
  submitted_at timestamptz,
  graded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, child_id)
);

create table if not exists public.activity_completions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  activity_id text not null,
  minutes integer not null default 0 check (minutes >= 0),
  points integer not null default 0 check (points >= 0),
  completed_by uuid references auth.users (id) on delete set null,
  completed_at timestamptz not null default now(),
  unique (child_id, activity_id)
);

create index if not exists children_guardian_idx
  on public.children (guardian_id);

create index if not exists enrollments_child_idx
  on public.enrollments (child_id);

create index if not exists classes_teacher_idx
  on public.classes (teacher_id);

create index if not exists assignments_class_due_idx
  on public.assignments (class_id, due_at);

create index if not exists submissions_child_idx
  on public.submissions (child_id);

create index if not exists submissions_assignment_idx
  on public.submissions (assignment_id);

create index if not exists activity_completions_child_idx
  on public.activity_completions (child_id);

-- ---------------------------------------------------------------------------
-- Access helpers
--
-- These are SECURITY DEFINER so a policy can check another table without
-- re-entering row level security (which would recurse between children,
-- enrollments and classes). They only ever answer questions about auth.uid().
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_guardian_of(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.children
    where id = target and guardian_id = auth.uid()
  );
$$;

create or replace function public.teaches_class(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes
    where id = target and teacher_id = auth.uid()
  );
$$;

create or replace function public.can_read_child(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.is_guardian_of(target)
      or exists (
        select 1
        from public.enrollments e
        join public.classes c on c.id = e.class_id
        where e.child_id = target and c.teacher_id = auth.uid()
      );
$$;

create or replace function public.can_read_class(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.teaches_class(target)
      or exists (
        select 1
        from public.enrollments e
        join public.classes c on c.id = e.class_id
        where e.class_id = target and public.is_guardian_of(e.child_id)
      );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.children enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.activity_completions enable row level security;

-- children: a guardian owns their learners; class teachers and admins can read.
drop policy if exists "children readable by guardian or teacher" on public.children;
create policy "children readable by guardian or teacher"
  on public.children for select
  using (public.can_read_child(id));

drop policy if exists "children insertable by guardian" on public.children;
create policy "children insertable by guardian"
  on public.children for insert
  with check (guardian_id = auth.uid());

drop policy if exists "children updatable by guardian" on public.children;
create policy "children updatable by guardian"
  on public.children for update
  using (guardian_id = auth.uid() or public.is_admin())
  with check (guardian_id = auth.uid() or public.is_admin());

drop policy if exists "children deletable by guardian" on public.children;
create policy "children deletable by guardian"
  on public.children for delete
  using (guardian_id = auth.uid() or public.is_admin());

-- classes: the whole school can read its own classes; the assigned teacher
-- (or an admin) writes them.
drop policy if exists "classes readable by members" on public.classes;
create policy "classes readable by members"
  on public.classes for select
  using (public.can_read_class(id));

drop policy if exists "classes writable by teacher" on public.classes;
create policy "classes writable by teacher"
  on public.classes for insert
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "classes updatable by teacher" on public.classes;
create policy "classes updatable by teacher"
  on public.classes for update
  using (teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "classes deletable by teacher" on public.classes;
create policy "classes deletable by teacher"
  on public.classes for delete
  using (teacher_id = auth.uid() or public.is_admin());

-- enrollments: the guardian places their own child; the class teacher and
-- admins can also manage the roll.
drop policy if exists "enrollments readable by members" on public.enrollments;
create policy "enrollments readable by members"
  on public.enrollments for select
  using (public.is_admin() or public.can_read_child(child_id));

drop policy if exists "enrollments insertable by guardian or teacher" on public.enrollments;
create policy "enrollments insertable by guardian or teacher"
  on public.enrollments for insert
  with check (
    public.is_guardian_of(child_id)
    or public.teaches_class(class_id)
    or public.is_admin()
  );

drop policy if exists "enrollments deletable by guardian or teacher" on public.enrollments;
create policy "enrollments deletable by guardian or teacher"
  on public.enrollments for delete
  using (
    public.is_guardian_of(child_id)
    or public.teaches_class(class_id)
    or public.is_admin()
  );

-- assignments: families read work set for their child's classes; only the
-- class teacher or an admin sets or edits it.
drop policy if exists "assignments readable by class members" on public.assignments;
create policy "assignments readable by class members"
  on public.assignments for select
  using (public.can_read_class(class_id));

drop policy if exists "assignments insertable by teacher" on public.assignments;
create policy "assignments insertable by teacher"
  on public.assignments for insert
  with check (public.teaches_class(class_id) or public.is_admin());

drop policy if exists "assignments updatable by teacher" on public.assignments;
create policy "assignments updatable by teacher"
  on public.assignments for update
  using (public.teaches_class(class_id) or public.is_admin())
  with check (public.teaches_class(class_id) or public.is_admin());

drop policy if exists "assignments deletable by teacher" on public.assignments;
create policy "assignments deletable by teacher"
  on public.assignments for delete
  using (public.teaches_class(class_id) or public.is_admin());

-- submissions: guardian sees their child's work; the child's teachers grade.
drop policy if exists "submissions readable by family or teacher" on public.submissions;
create policy "submissions readable by family or teacher"
  on public.submissions for select
  using (public.can_read_child(child_id));

drop policy if exists "submissions writable by family or teacher" on public.submissions;
create policy "submissions writable by family or teacher"
  on public.submissions for insert
  with check (
    public.is_guardian_of(child_id)
    or public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  );

drop policy if exists "submissions updatable by family or teacher" on public.submissions;
create policy "submissions updatable by family or teacher"
  on public.submissions for update
  using (
    public.is_guardian_of(child_id)
    or public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  )
  with check (
    public.is_guardian_of(child_id)
    or public.is_admin()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.teaches_class(a.class_id)
    )
  );

-- at-home practice: the guardian marks it, the family and class teacher read it.
drop policy if exists "activities readable by family or teacher" on public.activity_completions;
create policy "activities readable by family or teacher"
  on public.activity_completions for select
  using (public.can_read_child(child_id));

drop policy if exists "activities insertable by guardian" on public.activity_completions;
create policy "activities insertable by guardian"
  on public.activity_completions for insert
  with check (public.is_guardian_of(child_id) or public.is_admin());

drop policy if exists "activities deletable by guardian" on public.activity_completions;
create policy "activities deletable by guardian"
  on public.activity_completions for delete
  using (public.is_guardian_of(child_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows)
-- ---------------------------------------------------------------------------

revoke all on public.children from anon;
revoke all on public.classes from anon;
revoke all on public.enrollments from anon;
revoke all on public.assignments from anon;
revoke all on public.submissions from anon;
revoke all on public.activity_completions from anon;

grant select, insert, update, delete on public.children to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, update on public.submissions to authenticated;
grant select, insert, delete on public.activity_completions to authenticated;
