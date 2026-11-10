-- The operations console needs an admin role on profiles. Signup still cannot
-- self-assign it: handle_new_user() only accepts the five learner roles, so an
-- operator promotes an existing account explicitly:
--
--   update public.profiles set role = 'admin' where email = 'ops@example.com';
--
-- or run: npm run grant:admin -- ops@example.com

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('junior', 'senior', 'special', 'teacher', 'parent', 'admin'));
