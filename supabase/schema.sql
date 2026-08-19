-- AnimationsX — Phase 1 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- Public profile row, one per auth.users entry.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.animations enable row level security;
alter table public.trusted_devices enable row level security;

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
