-- AnimationsX — Phase 1 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- Public profile row, one per auth.users entry.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  -- Ban system (see supabase/ban_system_migration.sql for the full plan).
  -- banned_at is the authoritative predicate every request check reads;
  -- banned_until supports time-limited bans; sessions_valid_from lets a
  -- session be revoked (banned or not) independent of the JWT's own expiry.
  banned_at timestamptz,
  banned_until timestamptz,
  ban_reason text,
  banned_by uuid references public.profiles (id) on delete set null,
  sessions_valid_from timestamptz not null default now(),
  strike_count integer not null default 0,
  signup_risk integer not null default 0
);

create index if not exists profiles_banned_at_idx on public.profiles (banned_at)
  where banned_at is not null;

-- Used by RLS insert policies below, and by the application-level guard
-- (src/lib/auth/guard.ts, not yet built) for the equivalent check outside
-- the database.
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

create table if not exists public.animations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  css_content text not null,
  js_source text,
  category text not null,
  use_case text,
  tags text[] not null default '{}',
  author_id uuid not null references public.profiles (id) on delete cascade,
  jsdelivr_url text not null,
  view_count integer not null default 0,
  fork_count integer not null default 0,
  like_count integer not null default 0,
  forked_from_id uuid references public.animations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists animations_created_at_idx on public.animations (created_at desc);
create index if not exists animations_category_idx on public.animations (category);
create index if not exists animations_tags_idx on public.animations using gin (tags);

-- Auto-create a profile row whenever a new auth user signs up.
-- OAuth providers (GitHub/Google) don't populate raw_user_meta_data ->> 'username'
-- the way email/password signup does — GitHub sets 'user_name' / 'preferred_username'
-- instead, and neither is guaranteed unique against our existing usernames, so a
-- naive insert would abort OAuth sign-in on any collision. This sanitizes and
-- de-duplicates the candidate username, and carries over the provider's avatar.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.increment_view_count(animation_slug text)
returns void
language sql
security definer set search_path = public
as $$
  update public.animations set view_count = view_count + 1 where slug = animation_slug;
$$;

create or replace function public.increment_fork_count(animation_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.animations set fork_count = fork_count + 1 where id = animation_id;
$$;

create or replace function public.increment_like_count(animation_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.animations set like_count = like_count + 1 where id = animation_id;
$$;

create or replace function public.decrement_like_count(animation_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.animations set like_count = greatest(like_count - 1, 0) where id = animation_id;
$$;

-- Devices that have completed the email-code confirmation step for a given
-- user, so subsequent password logins from that device skip the challenge.
-- Written/read only by server routes via the service role key.
create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null,
  last_ip text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index if not exists trusted_devices_user_id_idx on public.trusted_devices (user_id);

-- Social: likes, comments, follows. Unlike animations, these are written
-- directly by their owner from API routes using the RLS-scoped client (not
-- the service role), so each has real insert/delete policies below.
create table if not exists public.animation_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  animation_id uuid not null references public.animations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, animation_id)
);
create index if not exists animation_likes_animation_id_idx on public.animation_likes (animation_id);
create index if not exists animation_likes_user_id_idx on public.animation_likes (user_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  animation_id uuid not null references public.animations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_animation_id_idx on public.comments (animation_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '😂', '🎉', '👀')),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id, emoji)
);
create index if not exists comment_reactions_comment_id_idx on public.comment_reactions (comment_id);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);
create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);

-- Favorites are a private "save for later" list, unlike likes: no public
-- count is kept on animations, only the join row itself.
create table if not exists public.animation_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  animation_id uuid not null references public.animations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, animation_id)
);
create index if not exists animation_favorites_animation_id_idx on public.animation_favorites (animation_id);
create index if not exists animation_favorites_user_id_idx on public.animation_favorites (user_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.animations enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.animation_likes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.follows enable row level security;
alter table public.animation_favorites enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Animations are publicly readable" on public.animations
  for select using (true);

-- Inserts/updates to animations only happen via the server (service role key)
-- from the /api/publish and /api/animations/[slug] routes, so no
-- client-facing insert/update policy is needed.

-- trusted_devices has no policies at all: it's only ever read/written by
-- server routes using the service role key, never directly by clients.

create policy "Likes are publicly readable" on public.animation_likes
  for select using (true);
create policy "Users can like as themselves" on public.animation_likes
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));
create policy "Users can unlike their own like" on public.animation_likes
  for delete using (auth.uid() = user_id);

create policy "Comments are publicly readable" on public.comments
  for select using (true);
create policy "Users can comment as themselves" on public.comments
  for insert with check (auth.uid() = author_id and public.author_is_active(auth.uid()));
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

create policy "Reactions are publicly readable" on public.comment_reactions
  for select using (true);
create policy "Users can react as themselves" on public.comment_reactions
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));
create policy "Users can remove their own reaction" on public.comment_reactions
  for delete using (auth.uid() = user_id);

create policy "Follows are publicly readable" on public.follows
  for select using (true);
create policy "Users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id and public.author_is_active(auth.uid()));
create policy "Users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

create policy "Users can read their own favorites" on public.animation_favorites
  for select using (auth.uid() = user_id);
create policy "Users can favorite as themselves" on public.animation_favorites
  for insert with check (auth.uid() = user_id and public.author_is_active(auth.uid()));
create policy "Users can unfavorite their own favorite" on public.animation_favorites
  for delete using (auth.uid() = user_id);
