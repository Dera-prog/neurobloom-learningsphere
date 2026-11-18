-- NeuroBloom LearningSphere · Grades belong to the school
--
-- submissions already carries the grade (score, feedback, graded_at). What it
-- lacked was authority: the 0005 policy let a guardian update any column of
-- their child's row, so a browser could award itself full marks.
--
--   * the class teacher (or an admin) may write the grade
--   * the guardian may submit an answer, never a score
--   * a teacherless class keeps the demo seeding path, because there is no
--     grader to defer to yet; the moment a teacher claims the class, only the
--     teacher can grade
--
-- Apply after 0006. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_class_grader(target_assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.assignments a
        where a.id = target_assignment and public.teaches_class(a.class_id)
      );
$$;

create or replace function public.class_is_unclaimed(target_assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    join public.classes c on c.id = a.class_id
    where a.id = target_assignment and c.teacher_id is null
  );
$$;

create or replace function public.guard_submission_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_assignment uuid := new.assignment_id;
  target_child uuid := new.child_id;
begin
  -- The service role is the school's own back office (webhooks, admin tools);
  -- it is not a browser session and keeps full authority.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if public.is_class_grader(target_assignment) then
    return new;
  end if;

  if not public.is_guardian_of(target_child) then
    raise exception 'Not allowed to change this submission' using errcode = '42501';
  end if;

  if public.class_is_unclaimed(target_assignment) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.score is not null
       or new.feedback is not null
       or new.graded_at is not null
       or new.status = 'graded' then
      raise exception 'Only the class teacher can record a grade' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.assignment_id is distinct from old.assignment_id
     or new.child_id is distinct from old.child_id then
    raise exception 'A submission cannot be moved to another learner or task' using errcode = '42501';
  end if;

  if new.score is distinct from old.score
     or new.feedback is distinct from old.feedback
     or new.graded_at is distinct from old.graded_at
     or (new.status = 'graded') is distinct from (old.status = 'graded') then
    raise exception 'Only the class teacher can grade this submission' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists submissions_guard_writes on public.submissions;
create trigger submissions_guard_writes
  before insert or update on public.submissions
  for each row execute function public.guard_submission_writes();

-- A teacher may claim a class nobody owns yet, which is how a class set up by
-- a family becomes a real, graded class once a teacher takes it on.
drop policy if exists "classes claimable by teacher" on public.classes;
create policy "classes claimable by teacher"
  on public.classes for update
  using (teacher_id is null or teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());
