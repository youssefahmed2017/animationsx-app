-- Phase 1 of the ban/moderation plan: profiles columns, the RLS predicate
-- function, and updated insert policies. No application code depends on
-- this yet — it's safe to run standalone and leaves current behavior
-- unchanged (every existing account has banned_at = null).
alter table public.profiles
  add column if not exists banned_at           timestamptz,
  add column if not exists banned_until         timestamptz,
  add column if not exists ban_reason           text,
  add column if not exists banned_by            uuid references public.profiles (id) on delete set null,
  add column if not exists sessions_valid_from  timestamptz not null default now(),
  add column if not exists strike_count         integer not null default 0,
  add column if not exists signup_risk          integer not null default 0;

create index if not exists profiles_banned_at_idx on public.profiles (banned_at)
  where banned_at is not null;

-- Used by RLS insert policies below, and by the application-level guard
-- (src/lib/auth/guard.ts) for the equivalent check outside the database.
create or replace function public.author_is_active(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and banned_at is null
  );
$$;

drop policy if exists "Users can like as themselves" on public.animation_likes;
create policy "Users can like as themselves" on public.animation_likes
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));

drop policy if exists "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves" on public.comments
  for insert with check (auth.uid() = author_id and public.author_is_active(auth.uid()));

drop policy if exists "Users can react as themselves" on public.comment_reactions;
create policy "Users can react as themselves" on public.comment_reactions
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));

drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id and public.author_is_active(auth.uid()));

drop policy if exists "Users can favorite as themselves" on public.animation_favorites;
create policy "Users can favorite as themselves" on public.animation_favorites
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));

-- moderation_audit_log, account_signals, and the application-level guard
-- (src/lib/auth/guard.ts) are later steps in the plan (step 5 / step 2) —
-- deliberately not part of this migration.
