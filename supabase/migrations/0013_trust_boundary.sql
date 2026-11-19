-- NeuroBloom LearningSphere · Trust boundary for membership, roles and quizzes
--
-- Three things still moved through the client-editable user_state blob:
--
--   class membership   a guardian could enroll a child into any known class,
--                      or remove them from a claimed one, without the teacher
--   role changes       profiles could be self-inserted with role = 'admin'
--                      while no row existed (missing trigger, deleted row)
--   quiz scores        the browser computed and stored its own marks
--
-- This migration moves each behind the database:
--
--   * enrollments        a trigger lets the class teacher (or an admin) change
--                        the roll; a guardian may only enroll or withdraw a
--                        child while the class is still unclaimed
--   * profiles           a trigger derives the signup role from the verified
--                        auth.users metadata and rejects any client change to
--                        an existing role. Admin promotion stays a service-role
--                        operation (npm run grant:admin)
--   * quiz_keys          the answer key for every practice quiz and mock paper
--   * quiz_attempts      one best score per learner and quiz, written only by
--                        record_quiz_attempt(), which marks the answers itself
--
-- Apply after 0012. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Class membership
-- ---------------------------------------------------------------------------

-- A scheduled class keeps its timetable on the row, not only in the browser.
alter table public.classes add column if not exists schedule_time text not null default '';
alter table public.classes add column if not exists duration text not null default '';

create or replace function public.class_is_open(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes where id = target and teacher_id is null
  );
$$;

create or replace function public.guard_enrollment_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_class uuid;
  target_child uuid;
begin
  if tg_op = 'DELETE' then
    target_class := old.class_id;
    target_child := old.child_id;
  else
    target_class := new.class_id;
    target_child := new.child_id;
  end if;

  -- Webhooks, back-office tools and the seed importer run as the service role.
  if auth.role() = 'service_role' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if public.is_admin() or public.teaches_class(target_class) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if not public.is_guardian_of(target_child) then
    raise exception 'Not allowed to change this class roll' using errcode = '42501';
  end if;

  -- Before a teacher claims a class a family manages its own enrolments, which
  -- is how signup seeds a learner's subjects. Once claimed, the teacher decides.
  if public.class_is_open(target_class) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  raise exception 'Only the class teacher can change the roll of a claimed class'
    using errcode = '42501';
end;
$$;

drop trigger if exists enrollments_guard_writes on public.enrollments;
create trigger enrollments_guard_writes
  before insert or delete on public.enrollments
  for each row execute function public.guard_enrollment_writes();

-- ---------------------------------------------------------------------------
-- Role changes
-- ---------------------------------------------------------------------------

create or replace function public.guard_profile_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_role text;
  safe_role text;
begin
  -- Promotion and demotion are service-role operations (grant:admin), never a
  -- browser or an authenticated REST call.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'A profile cannot be moved to another account' using errcode = '42501';
    end if;
    if new.role is distinct from old.role then
      raise exception 'Roles are fixed at sign-up' using errcode = '42501';
    end if;
    return new;
  end if;

  -- A self-insert is only trusted as far as the verified auth.users record.
  -- This mirrors handle_new_user(), so a crafted client insert cannot choose
  -- a role the signup trigger would have refused.
  select raw_user_meta_data ->> 'role' into metadata_role
    from auth.users where id = new.id;
  safe_role := case
    when metadata_role in ('junior', 'senior', 'special', 'teacher', 'parent') then metadata_role
    else 'junior'
  end;
  if new.role is distinct from safe_role then
    raise exception 'Roles are fixed at sign-up' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_writes on public.profiles;
create trigger profiles_guard_writes
  before insert or update on public.profiles
  for each row execute function public.guard_profile_writes();

-- ---------------------------------------------------------------------------
-- Quiz scores
-- ---------------------------------------------------------------------------

create table if not exists public.quiz_keys (
  quiz_id text primary key,
  label text not null default '',
  question_count integer not null check (question_count between 1 and 200),
  answer_key jsonb not null check (jsonb_typeof(answer_key) = 'array'),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  quiz_id text not null references public.quiz_keys (quiz_id) on delete cascade,
  score integer not null check (score between 0 and 100),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count >= 0),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quiz_id)
);

create index if not exists quiz_attempts_user_idx
  on public.quiz_attempts (user_id);

-- Marks the current transaction as the trusted scorer. Only
-- record_quiz_attempt() sets it before writing.
create or replace function public.guard_quiz_attempt_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role'
     or current_setting('neurobloom.quiz_writer', true) = 'rpc' then
    return new;
  end if;
  raise exception 'Quiz scores are recorded by the server' using errcode = '42501';
end;
$$;

drop trigger if exists quiz_attempts_guard_writes on public.quiz_attempts;
create trigger quiz_attempts_guard_writes
  before insert or update on public.quiz_attempts
  for each row execute function public.guard_quiz_attempt_writes();

-- The client sends the options it picked, never a score. The function marks
-- them against the answer key and keeps the learner's best result.
create or replace function public.record_quiz_attempt(p_quiz_id text, p_answers integer[])
returns table (quiz_id text, score integer, best integer, question_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  key_row public.quiz_keys%rowtype;
  learner uuid := auth.uid();
  answered integer := coalesce(array_length(p_answers, 1), 0);
  correct integer := 0;
  computed integer;
  i integer;
begin
  if learner is null then
    raise exception 'Sign in to save a quiz result' using errcode = '42501';
  end if;

  select * into key_row from public.quiz_keys where quiz_keys.quiz_id = p_quiz_id;
  if not found then
    raise exception 'Unknown quiz: %', p_quiz_id using errcode = '22023';
  end if;
  if answered <> key_row.question_count then
    raise exception 'Expected % answers, received %', key_row.question_count, answered
      using errcode = '22023';
  end if;

  for i in 0 .. key_row.question_count - 1 loop
    if p_answers[i + 1] = (key_row.answer_key ->> i)::integer then
      correct := correct + 1;
    end if;
  end loop;

  computed := round((correct::numeric / key_row.question_count) * 100);

  perform set_config('neurobloom.quiz_writer', 'rpc', true);
  insert into public.quiz_attempts (user_id, quiz_id, score, correct_count, question_count, answers)
  values (learner, p_quiz_id, computed, correct, key_row.question_count, to_jsonb(p_answers))
  on conflict (user_id, quiz_id) do update
    set score = greatest(public.quiz_attempts.score, excluded.score),
        correct_count = case
          when excluded.score > public.quiz_attempts.score then excluded.correct_count
          else public.quiz_attempts.correct_count
        end,
        question_count = excluded.question_count,
        answers = case
          when excluded.score > public.quiz_attempts.score then excluded.answers
          else public.quiz_attempts.answers
        end,
        updated_at = now();

  return query
    select a.quiz_id, computed, a.score, a.question_count
    from public.quiz_attempts a
    where a.user_id = learner and a.quiz_id = p_quiz_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.quiz_keys enable row level security;
alter table public.quiz_attempts enable row level security;

-- Answer keys are read only by record_quiz_attempt() (SECURITY DEFINER), never
-- by a browser: the quiz itself is marked from the question bundle.
drop policy if exists "quiz keys are server only" on public.quiz_keys;

drop policy if exists "attempts readable by owner" on public.quiz_attempts;
create policy "attempts readable by owner"
  on public.quiz_attempts for select
  using (user_id = auth.uid());

-- No insert/update/delete policy for clients: results arrive only through the
-- function, which stamps the correct score. The trigger is the second lock.

revoke all on public.quiz_keys from anon, authenticated;
revoke all on public.quiz_attempts from anon, authenticated;
grant select on public.quiz_attempts to authenticated;

revoke all on function public.record_quiz_attempt(text, integer[]) from public, anon;
grant execute on function public.record_quiz_attempt(text, integer[]) to authenticated;

revoke all on function public.class_is_open(uuid) from public, anon;
grant execute on function public.class_is_open(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Answer keys
insert into public.quiz_keys (quiz_id, label, question_count, answer_key) values
  ('j-maths-profit', 'Mathematics · Profit and loss at the market', 4, '[1,0,0,1]'::jsonb),
  ('j-maths-ratio', 'Mathematics · Sharing money at home', 4, '[1,0,1,2]'::jsonb),
  ('j-maths-interest', 'Mathematics · Saving for a school bag', 4, '[2,2,0,2]'::jsonb),
  ('j-eng-letter', 'English Language · Writing to Uncle Emeka', 4, '[1,1,2,2]'::jsonb),
  ('j-eng-timetable', 'English Language · Reading a bus timetable', 4, '[1,1,1,1]'::jsonb),
  ('j-eng-past', 'English Language · Telling a story in the past tense', 4, '[2,2,1,2]'::jsonb),
  ('j-sci-water', 'Basic Science · Clean water at home', 4, '[1,1,1,1]'::jsonb),
  ('j-sci-food', 'Basic Science · Why food spoils', 4, '[1,1,3,1]'::jsonb),
  ('j-sci-heat', 'Basic Science · Heat in the kitchen', 4, '[1,2,1,2]'::jsonb),
  ('j-soc-rules', 'Social Studies · Rules that keep us safe', 4, '[1,0,1,1]'::jsonb),
  ('j-soc-culture', 'Social Studies · Culture in our market', 4, '[2,0,1,0]'::jsonb),
  ('j-soc-lga', 'Social Studies · Who leads the local government?', 4, '[1,1,1,1]'::jsonb),
  ('j-art-draw', 'Fine Arts · Drawing what you see', 4, '[1,1,1,0]'::jsonb),
  ('j-art-colour', 'Fine Arts · Mixing colour with local materials', 4, '[1,1,2,1]'::jsonb),
  ('j-art-poster', 'Fine Arts · Making a poster that speaks', 4, '[1,0,1,1]'::jsonb),
  ('j-music-beat', 'Music · Keeping the beat', 4, '[1,1,1,1]'::jsonb),
  ('j-music-inst', 'Music · Instruments of Nigeria', 4, '[1,1,1,1]'::jsonb),
  ('j-music-harmony', 'Music · Singing together', 4, '[1,1,1,1]'::jsonb),
  ('s-maths-value', 'Mathematics · Data plans and airtime', 4, '[1,1,1,2]'::jsonb),
  ('s-maths-compound', 'Mathematics · Saving with compound interest', 4, '[1,1,0,1]'::jsonb),
  ('s-maths-area', 'Mathematics · Measuring a farm plot', 4, '[2,1,1,0]'::jsonb),
  ('s-eng-formal', 'English Language · Applying for a scholarship', 4, '[1,1,1,1]'::jsonb),
  ('s-eng-inference', 'English Language · Reading between the lines', 4, '[1,1,1,1]'::jsonb),
  ('s-eng-concord', 'English Language · Choosing the right word', 4, '[1,1,1,1]'::jsonb),
  ('s-phy-braking', 'Physics · Stopping distance on a wet road', 4, '[1,1,2,1]'::jsonb),
  ('s-phy-energy', 'Physics · The electricity bill at home', 4, '[2,2,1,0]'::jsonb),
  ('s-phy-refraction', 'Physics · Why a straw looks bent', 4, '[1,0,1,1]'::jsonb),
  ('s-chem-hardness', 'Chemistry · Hard water and soap', 4, '[1,1,1,1]'::jsonb),
  ('s-chem-ph', 'Chemistry · Cooking with acids and bases', 4, '[1,0,2,1]'::jsonb),
  ('s-chem-rust', 'Chemistry · Rust and the cost of iron', 4, '[0,1,1,1]'::jsonb),
  ('s-bio-malaria', 'Biology · Malaria and mosquitoes', 4, '[1,1,1,1]'::jsonb),
  ('s-bio-diet', 'Biology · Food and energy', 4, '[1,0,1,0]'::jsonb),
  ('s-bio-genetics', 'Biology · Genetics in the family', 4, '[0,1,1,1]'::jsonb),
  ('s-gov-bill', 'Government · How a bill becomes law', 4, '[2,1,1,1]'::jsonb),
  ('s-gov-federalism', 'Government · Federal, state, local', 4, '[1,1,2,1]'::jsonb),
  ('s-gov-elections', 'Government · Voting and your voice', 4, '[2,1,1,1]'::jsonb),
  ('maths-paper', 'Mock paper · maths-paper', 5, '[1,1,1,1,0]'::jsonb),
  ('english-paper', 'Mock paper · english-paper', 5, '[1,2,1,1,1]'::jsonb),
  ('physics-paper', 'Mock paper · physics-paper', 5, '[1,1,2,2,2]'::jsonb)
on conflict (quiz_id) do update set label = excluded.label, question_count = excluded.question_count, answer_key = excluded.answer_key, updated_at = now();
-- ---------------------------------------------------------------------------
