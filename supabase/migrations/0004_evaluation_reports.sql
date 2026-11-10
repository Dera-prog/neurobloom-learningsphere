-- Private bucket for special-needs evaluation reports uploaded at parent signup.
-- Each guardian can write and read only files inside their own folder.

insert into storage.buckets (id, name, public)
values ('evaluation-reports', 'evaluation-reports', false)
on conflict (id) do nothing;

drop policy if exists "guardians upload evaluation reports" on storage.objects;
create policy "guardians upload evaluation reports"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'evaluation-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "guardians read own evaluation reports" on storage.objects;
create policy "guardians read own evaluation reports"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'evaluation-reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
