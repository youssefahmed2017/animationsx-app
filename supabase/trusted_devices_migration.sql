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
alter table public.trusted_devices enable row level security;
