-- NeuroBloom LearningSphere · Teacher verification
--
--   teacher_verifications           one application per teacher
--   teacher_verification_documents  the uploaded evidence, one row per file
--
-- A teacher submits identity, qualification and safeguarding documents into a
-- private Storage bucket and an administrator decides. The teacher cannot
-- approve themselves: their writes always land on 'pending', and only an admin
-- may set 'approved' or 'rejected'. The review stamps reviewed_by/reviewed_at
-- server-side. Adding a document after a rejection reopens the application.
--
-- Files live in the private bucket `teacher-verification`, one folder per
-- teacher (auth.uid()/file). The bucket policies in this file make sure a
-- teacher only reads and writes inside their own folder; admins can read all.
--
-- Apply after 0008. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_verifications (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  teacher_name text not null default '',
  teacher_email text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text not null default '',
  review_note text not null default '',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create table if not exists public.teacher_verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.teacher_verifications (id) on delete cascade,
  teacher_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  doc_type text not null default 'Other' check (doc_type in ('Identity', 'Qualification', 'Safeguarding', 'Other')),
  storage_path text not null unique,
  mime_type text not null default '',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists teacher_verification_documents_verification_idx
  on public.teacher_verification_documents (verification_id, created_at);

-- ---------------------------------------------------------------------------
-- Write authority
-- ---------------------------------------------------------------------------

create or replace function public.guard_verification_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;

  if public.is_admin() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      if new.status not in ('approved', 'rejected') then
        raise exception 'An admin can only approve or reject a submission' using errcode = '42501';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.teacher_id := auth.uid();
    new.status := 'pending';
    new.review_note := '';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.submitted_at := now();
    -- The name shown to reviewers comes from the profile, not the request body.
    new.teacher_name := coalesce((select full_name from public.profiles where id = auth.uid()), '');
    new.teacher_email := coalesce((select email from public.profiles where id = auth.uid()), '');
    return new;
  end if;

  -- Teacher update: their own application only, and it goes back to pending.
  if old.teacher_id is distinct from auth.uid() then
    raise exception 'Only the teacher can update their own verification' using errcode = '42501';
  end if;
  if new.teacher_id is distinct from old.teacher_id then
    raise exception 'A verification cannot be moved to another account' using errcode = '42501';
  end if;
  new.status := 'pending';
  new.review_note := '';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.submitted_at := now();
  return new;
end;
$$;

drop trigger if exists teacher_verifications_guard on public.teacher_verifications;
create trigger teacher_verifications_guard
  before insert or update on public.teacher_verifications
  for each row execute function public.guard_verification_writes();

create or replace function public.guard_verification_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_op = 'DELETE' then
    -- auth.uid() is null when the auth service itself removes an account (its
    -- cascade has to reach the files' rows); a signed-in teacher still may not.
    if auth.role() = 'service_role' or auth.uid() is null or public.is_admin() then return old; end if;
    raise exception 'A submitted document cannot be deleted' using errcode = '42501';
  end if;

  if public.is_admin() then return new; end if;

  if tg_op = 'INSERT' then
    new.teacher_id := auth.uid();
    new.status := 'pending';
    if not exists (
      select 1 from public.teacher_verifications v
      where v.id = new.verification_id and v.teacher_id = auth.uid()
    ) then
      raise exception 'That verification does not belong to you' using errcode = '42501';
    end if;
    if new.storage_path not like auth.uid()::text || '/%' then
      raise exception 'Files must be stored under your own folder' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'Only an admin can change a submitted document' using errcode = '42501';
end;
$$;

drop trigger if exists teacher_verification_documents_guard on public.teacher_verification_documents;
create trigger teacher_verification_documents_guard
  before insert or update or delete on public.teacher_verification_documents
  for each row execute function public.guard_verification_documents();

-- New evidence on a decided application puts it back in the queue (a renewal
-- or a replacement after a rejection both need a fresh review).
create or replace function public.reopen_verification_on_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.teacher_verifications
     set status = 'pending',
         review_note = '',
         reviewed_by = null,
         reviewed_at = null,
         submitted_at = now()
   where id = new.verification_id and status <> 'pending';
  return new;
end;
$$;

drop trigger if exists teacher_verification_documents_reopen on public.teacher_verification_documents;
create trigger teacher_verification_documents_reopen
  after insert on public.teacher_verification_documents
  for each row execute function public.reopen_verification_on_document();

-- The decision covers every document that was waiting.
create or replace function public.apply_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    update public.teacher_verification_documents
       set status = new.status
     where verification_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists teacher_verifications_review on public.teacher_verifications;
create trigger teacher_verifications_review
  after update on public.teacher_verifications
  for each row execute function public.apply_verification_review();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.teacher_verifications enable row level security;
alter table public.teacher_verification_documents enable row level security;

drop policy if exists "verifications readable by owner or admin" on public.teacher_verifications;
create policy "verifications readable by owner or admin"
  on public.teacher_verifications for select
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "teachers submit their own verification" on public.teacher_verifications;
create policy "teachers submit their own verification"
  on public.teacher_verifications for insert
  with check (teacher_id = auth.uid());

drop policy if exists "verification update by owner or admin" on public.teacher_verifications;
create policy "verification update by owner or admin"
  on public.teacher_verifications for update
  using (teacher_id = auth.uid() or public.is_admin())
  with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "verification documents readable by owner or admin" on public.teacher_verification_documents;
create policy "verification documents readable by owner or admin"
  on public.teacher_verification_documents for select
  using (teacher_id = auth.uid() or public.is_admin());

drop policy if exists "teachers add their own verification documents" on public.teacher_verification_documents;
create policy "teachers add their own verification documents"
  on public.teacher_verification_documents for insert
  with check (teacher_id = auth.uid());

drop policy if exists "verification documents reviewable by admin" on public.teacher_verification_documents;
create policy "verification documents reviewable by admin"
  on public.teacher_verification_documents for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private Storage bucket (one folder per teacher)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-verification',
  'teacher-verification',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "teachers upload their verification files" on storage.objects;
create policy "teachers upload their verification files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'teacher-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification files readable by owner or admin" on storage.objects;
create policy "verification files readable by owner or admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'teacher-verification'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "verification files deletable by owner or admin" on storage.objects;
create policy "verification files deletable by owner or admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'teacher-verification'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows)
-- ---------------------------------------------------------------------------

revoke all on public.teacher_verifications from anon;
revoke all on public.teacher_verification_documents from anon;

grant select, insert, update, delete on public.teacher_verifications to authenticated;
grant select, insert, update, delete on public.teacher_verification_documents to authenticated;
