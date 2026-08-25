alter table public.comments add column if not exists parent_id uuid references public.comments (id) on delete cascade;
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

alter table public.comment_reactions enable row level security;

drop policy if exists "Reactions are publicly readable" on public.comment_reactions;
create policy "Reactions are publicly readable" on public.comment_reactions
  for select using (true);
drop policy if exists "Users can react as themselves" on public.comment_reactions;
create policy "Users can react as themselves" on public.comment_reactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can remove their own reaction" on public.comment_reactions;
create policy "Users can remove their own reaction" on public.comment_reactions
  for delete using (auth.uid() = user_id);
