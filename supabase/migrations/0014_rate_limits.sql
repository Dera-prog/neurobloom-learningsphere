-- NeuroBloom LearningSphere · Durable rate limits
--
-- The OTP and email endpoints counted requests in a module-level Map, which a
-- serverless instance loses on every cold start. These limits live in the
-- database, so three sends in ten minutes means three across the whole fleet.
--
-- Clients never touch this table or call the function; the API uses the
-- service role. Apply after 0013. Safe to re-run.

create table if not exists public.rate_limit_hits (
  key text not null,
  hit_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_key_idx
  on public.rate_limit_hits (key, hit_at desc);

alter table public.rate_limit_hits enable row level security;

-- No policies: server only.
revoke all on public.rate_limit_hits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  if p_key is null or p_key = '' or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  -- Serialise requests for the same key so two tabs cannot both take the last
  -- slot at the same moment.
  perform pg_advisory_xact_lock(hashtext(p_key));

  delete from public.rate_limit_hits
   where key = p_key
     and hit_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into used from public.rate_limit_hits where key = p_key;
  if used >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
