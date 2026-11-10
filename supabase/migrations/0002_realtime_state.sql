-- NeuroBloom LearningSphere · live state for the mobile app
-- Streams user_state row changes to signed-in clients (RLS still applies, so a
-- user only receives their own row). Without this, the mobile profile falls
-- back to polling.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_state'
  ) then
    alter publication supabase_realtime add table public.user_state;
  end if;
end
$$;
