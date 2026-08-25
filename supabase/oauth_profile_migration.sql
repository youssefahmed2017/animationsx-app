-- OAuth providers (GitHub/Google) don't populate raw_user_meta_data ->> 'username'
-- the way email/password signup does — GitHub sets 'user_name' / 'preferred_username'
-- instead, and neither is guaranteed unique against our existing usernames, so the
-- original handle_new_user() (which just inserted and let the unique constraint
-- fail) would abort OAuth sign-in on any collision. This replaces it with a
-- sanitize + de-duplicate version, and also carries over the provider's avatar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
    split_part(new.email, '@', 1)
  );
  -- USERNAME_PATTERN in src/lib/validateUsername.ts is /^[a-zA-Z0-9_-]{3,24}$/.
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
  base_username := left(base_username, 20); -- leave room for a "-<suffix>"
  if length(base_username) < 3 then
    base_username := rpad(base_username, 3, '0');
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 20) || '-' || suffix;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, candidate, new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;
