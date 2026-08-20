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

alter table public.animation_favorites enable row level security;

drop policy if exists "Users can read their own favorites" on public.animation_favorites;
create policy "Users can read their own favorites" on public.animation_favorites
  for select using (auth.uid() = user_id);
drop policy if exists "Users can favorite as themselves" on public.animation_favorites;
create policy "Users can favorite as themselves" on public.animation_favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unfavorite their own favorite" on public.animation_favorites;
create policy "Users can unfavorite their own favorite" on public.animation_favorites
  for delete using (auth.uid() = user_id);
