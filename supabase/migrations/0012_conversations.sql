-- NeuroBloom LearningSphere · Conversations and messages
--
--   conversations        a private thread between two accounts
--   conversation_members who may see the thread (exactly two per conversation)
--   chat_messages        the messages, stamped with the sender by the database
--
-- Who may begin a conversation is a relationship, not a free-text choice:
--
--   * a guardian and the teacher of a class their child is enrolled in
--   * a student and the tutor who accepted their request
--   * anyone and an admin (the Admin team)
--
-- Clients never insert memberships. They call start_conversation(), which
-- checks the relationship, reuses an existing thread with the same person and
-- writes the first message. A crafted insert into chat_messages can only add a
-- message to a thread the caller already belongs to, and the sender id/name and
-- timestamp are written by the trigger, so nobody can post as someone else.
-- Messages are immutable once sent.
--
-- Apply after 0011. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  sender_name text not null default '',
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id);

create index if not exists chat_messages_conversation_idx
  on public.chat_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_conversation_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target and user_id = auth.uid()
  );
$$;

-- May the caller open a conversation with this person? The relationship is
-- read from class enrolments and accepted tutor requests, never from input.
create or replace function public.can_message(person uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select person is not null
     and person <> auth.uid()
     and (
       -- The admin team can open a conversation with any account.
       public.is_admin()
       or exists (
         select 1 from public.profiles
         where id = person and role = 'admin'
       )
       or exists (
         select 1
         from public.enrollments e
         join public.classes c on c.id = e.class_id
         join public.children ch on ch.id = e.child_id
         where (ch.guardian_id = auth.uid() and c.teacher_id = person)
            or (c.teacher_id = auth.uid() and ch.guardian_id = person)
       )
       or exists (
         select 1 from public.tutor_requests tr
         where tr.status = 'accepted'
           and (
             (tr.student_id = auth.uid() and tr.accepted_by = person)
             or (tr.accepted_by = auth.uid() and tr.student_id = person)
           )
       )
     );
$$;

-- ---------------------------------------------------------------------------
-- Read RPCs
-- ---------------------------------------------------------------------------

-- Everyone the caller has a reason to message, with a short context line
-- ("Mathematics · JSS2 Gold", "Parent of Ada", "Admin team", …).
create or replace function public.my_contacts()
returns table (id uuid, full_name text, role text, context text)
language sql
stable
security definer
set search_path = public
as $$
  with people as (
    select c.teacher_id as person, c.subject || ' · ' || c.name as note
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    join public.children ch on ch.id = e.child_id
    where ch.guardian_id = auth.uid() and c.teacher_id is not null

    union all

    select ch.guardian_id, 'Parent of ' || ch.full_name
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    join public.children ch on ch.id = e.child_id
    where c.teacher_id = auth.uid()

    union all

    select tr.accepted_by, 'Your tutor · ' || tr.topic
    from public.tutor_requests tr
    where tr.student_id = auth.uid() and tr.status = 'accepted' and tr.accepted_by is not null

    union all

    select tr.student_id, 'Tutoring student · ' || tr.topic
    from public.tutor_requests tr
    where tr.accepted_by = auth.uid() and tr.status = 'accepted'

    union all

    select p.id, 'Admin team'
    from public.profiles p
    where p.role = 'admin' and p.id <> auth.uid()
  )
  select people.person as id,
         coalesce(p.full_name, 'Account') as full_name,
         coalesce(p.role, 'member') as role,
         string_agg(distinct people.note, ' · ') as context
  from people
  join public.profiles p on p.id = people.person
  where people.person <> auth.uid()
  group by people.person, p.full_name, p.role
  order by (p.role = 'admin') desc, p.full_name;
$$;

-- The caller's threads with the other person's name and the last line.
create or replace function public.my_conversations()
returns table (
  conversation_id uuid,
  peer_id uuid,
  peer_name text,
  peer_role text,
  last_message_at timestamptz,
  last_body text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,
         other.user_id,
         coalesce(p.full_name, 'Account'),
         coalesce(p.role, 'member'),
         c.last_message_at,
         coalesce((
           select m.body
           from public.chat_messages m
           where m.conversation_id = c.id
           order by m.created_at desc
           limit 1
         ), '')
  from public.conversation_members mine
  join public.conversations c on c.id = mine.conversation_id
  join public.conversation_members other
    on other.conversation_id = c.id and other.user_id <> mine.user_id
  left join public.profiles p on p.id = other.user_id
  where mine.user_id = auth.uid()
  order by c.last_message_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Start a conversation
-- ---------------------------------------------------------------------------

create or replace function public.start_conversation(peer uuid, body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  text_body text := btrim(coalesce(body, ''));
  existing uuid;
  convo uuid;
  sender text;
begin
  if me is null then
    raise exception 'Sign in to send a message' using errcode = '42501';
  end if;
  if peer is null or peer = me then
    raise exception 'Choose someone to message' using errcode = '22023';
  end if;
  if char_length(text_body) < 1 then
    raise exception 'Write a message first' using errcode = '22023';
  end if;
  if not public.can_message(peer) then
    raise exception 'You can only message your teachers, students, parents and the admin team'
      using errcode = '42501';
  end if;

  select c.id into existing
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = peer
  where (select count(*) from public.conversation_members x where x.conversation_id = c.id) = 2
  order by c.last_message_at desc
  limit 1;

  if existing is not null then
    convo := existing;
  else
    insert into public.conversations (created_by) values (me) returning id into convo;
    insert into public.conversation_members (conversation_id, user_id)
    values (convo, me), (convo, peer);
  end if;

  select full_name into sender from public.profiles where id = me;

  insert into public.chat_messages (conversation_id, sender_id, sender_name, body)
  values (convo, me, coalesce(sender, ''), text_body);

  return convo;
end;
$$;

-- ---------------------------------------------------------------------------
-- Message guards
-- ---------------------------------------------------------------------------

create or replace function public.guard_chat_message_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    -- Account deletion and other server-side cascades run without a JWT role.
    -- Let those through so the foreign keys can clean up.
    if auth.role() is null or auth.role() = 'service_role' then return old; end if;
    raise exception 'Sent messages cannot be changed' using errcode = '42501';
  end if;

  if auth.role() = 'service_role' then return new; end if;

  if tg_op <> 'INSERT' then
    raise exception 'Sent messages cannot be changed' using errcode = '42501';
  end if;

  if not public.is_conversation_member(new.conversation_id) then
    raise exception 'You are not part of this conversation' using errcode = '42501';
  end if;

  new.sender_id := auth.uid();
  new.sender_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
  new.body := btrim(new.body);
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists chat_messages_guard_writes on public.chat_messages;
create trigger chat_messages_guard_writes
  before insert or update or delete on public.chat_messages
  for each row execute function public.guard_chat_message_writes();

create or replace function public.bump_conversation_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return null;
end;
$$;

drop trigger if exists chat_messages_bump_activity on public.chat_messages;
create trigger chat_messages_bump_activity
  after insert on public.chat_messages
  for each row execute function public.bump_conversation_activity();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "threads readable by members" on public.conversations;
create policy "threads readable by members"
  on public.conversations for select
  using (public.is_conversation_member(id));

drop policy if exists "memberships readable by members" on public.conversation_members;
create policy "memberships readable by members"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "messages readable by members" on public.chat_messages;
create policy "messages readable by members"
  on public.chat_messages for select
  using (public.is_conversation_member(conversation_id));

drop policy if exists "members post into their threads" on public.chat_messages;
create policy "members post into their threads"
  on public.chat_messages for insert
  with check (public.is_conversation_member(conversation_id) and sender_id = auth.uid());

-- No client insert/update/delete on conversations or memberships: threads are
-- created only through start_conversation(), which checks the relationship.

-- ---------------------------------------------------------------------------
-- Privileges and function access
-- ---------------------------------------------------------------------------

revoke all on public.conversations from anon;
revoke all on public.conversations from authenticated;
revoke all on public.conversation_members from anon;
revoke all on public.conversation_members from authenticated;
revoke all on public.chat_messages from anon;
revoke all on public.chat_messages from authenticated;

grant select on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant select, insert on public.chat_messages to authenticated;

revoke all on function public.is_conversation_member(uuid) from public, anon;
revoke all on function public.can_message(uuid) from public, anon;
revoke all on function public.my_contacts() from public, anon;
revoke all on function public.my_conversations() from public, anon;
revoke all on function public.start_conversation(uuid, text) from public, anon;

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.can_message(uuid) to authenticated;
grant execute on function public.my_contacts() to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.start_conversation(uuid, text) to authenticated;
