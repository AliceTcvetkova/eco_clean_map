-- Phase 2: tasks table + Moscow seed data
-- Run in Supabase → SQL Editor → New query → Run

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location_name text not null,
  lat double precision not null,
  lng double precision not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  reward_points integer not null default 240,
  category text not null default 'Mixed',
  status text not null default 'open' check (status in ('open', 'accepted', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Public read open tasks" on public.tasks;
create policy "Public read open tasks"
  on public.tasks for select
  using (status = 'open');

-- Re-run safe: replace seed if empty
insert into public.tasks (title, location_name, lat, lng, severity, reward_points, category)
select * from (values
  ('Riverside plastic waste', 'Gorky Park, Moscow', 55.7310, 37.6010, 'medium', 240, 'Plastic'),
  ('Park bench litter', 'Patriarch Ponds, Moscow', 55.7642, 37.5917, 'high', 320, 'Mixed'),
  ('Glass near the path', 'Sparrow Hills, Moscow', 55.7103, 37.5593, 'low', 180, 'Glass')
) as seed(title, location_name, lat, lng, severity, reward_points, category)
where not exists (select 1 from public.tasks limit 1);
