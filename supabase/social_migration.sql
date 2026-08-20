alter table public.animations add column if not exists like_count integer not null default 0;

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

alter table public.animation_likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

-- drop-then-create so this script is safe to run more than once
-- ("create policy" has no "if not exists" form in Postgres).
drop policy if exists "Likes are publicly readable" on public.animation_likes;
create policy "Likes are publicly readable" on public.animation_likes
  for select using (true);
drop policy if exists "Users can like as themselves" on public.animation_likes;
create policy "Users can like as themselves" on public.animation_likes
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unlike their own like" on public.animation_likes;
create policy "Users can unlike their own like" on public.animation_likes
  for delete using (auth.uid() = user_id);

drop policy if exists "Comments are publicly readable" on public.comments;
create policy "Comments are publicly readable" on public.comments
  for select using (true);
drop policy if exists "Users can comment as themselves" on public.comments;
create policy "Users can comment as themselves" on public.comments
  for insert with check (auth.uid() = author_id);
drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

drop policy if exists "Follows are publicly readable" on public.follows;
create policy "Follows are publicly readable" on public.follows
  for select using (true);
drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);
drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);
