-- AnimationsX — Phase 1 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- Public profile row, one per auth.users entry.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.animations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  css_content text not null,
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
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
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
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_animation_id_idx on public.comments (animation_id);

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
  for insert with check (auth.uid() = user_id);
create policy "Users can unlike their own like" on public.animation_likes
  for delete using (auth.uid() = user_id);

create policy "Comments are publicly readable" on public.comments
  for select using (true);
create policy "Users can comment as themselves" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

create policy "Follows are publicly readable" on public.follows
  for select using (true);
create policy "Users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

create policy "Users can read their own favorites" on public.animation_favorites
  for select using (auth.uid() = user_id);
create policy "Users can favorite as themselves" on public.animation_favorites
  for insert with check (auth.uid() = user_id);
create policy "Users can unfavorite their own favorite" on public.animation_favorites
  for delete using (auth.uid() = user_id);
