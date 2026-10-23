-- OceanNav baseline schema.
--
-- These tables predate migration tracking on the hosted project, so every
-- statement is guarded: applying this file to the existing database is a
-- no-op, while applying it to a brand-new project creates everything the
-- apps read and write.

create table if not exists public.users (
  id uuid primary key,
  name text not null default '',
  phone text not null default '',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  route text not null default '',
  boat text not null default '',
  pax integer not null default 1,
  date timestamptz,
  status text not null default 'Scheduled',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  cat text not null default 'Updates',
  title text not null default '',
  body text not null default '',
  time timestamptz not null default now(),
  unread boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sos_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  status text not null default 'sent',
  lat double precision,
  lng double precision,
  time timestamptz not null default now()
);

-- Legacy versions of these tables may lack columns the apps rely on.
alter table public.users add column if not exists name text not null default '';
alter table public.users add column if not exists phone text not null default '';
alter table public.users add column if not exists email text;
alter table public.users add column if not exists created_at timestamptz not null default now();

alter table public.trips add column if not exists user_id uuid;
alter table public.trips add column if not exists route text not null default '';
alter table public.trips add column if not exists boat text not null default '';
alter table public.trips add column if not exists pax integer not null default 1;
alter table public.trips add column if not exists date timestamptz;
alter table public.trips add column if not exists status text not null default 'Scheduled';
alter table public.trips add column if not exists lat double precision;
alter table public.trips add column if not exists lng double precision;
alter table public.trips add column if not exists created_at timestamptz not null default now();

alter table public.notifications add column if not exists user_id uuid;
alter table public.notifications add column if not exists cat text not null default 'Updates';
alter table public.notifications add column if not exists title text not null default '';
alter table public.notifications add column if not exists body text not null default '';
alter table public.notifications add column if not exists time timestamptz not null default now();
alter table public.notifications add column if not exists unread boolean not null default true;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

alter table public.sos_logs add column if not exists user_id uuid;
alter table public.sos_logs add column if not exists status text not null default 'sent';
alter table public.sos_logs add column if not exists lat double precision;
alter table public.sos_logs add column if not exists lng double precision;
alter table public.sos_logs add column if not exists time timestamptz not null default now();

-- Foreign keys. Pre-existing tables may use a different id type than the
-- baseline above, so each constraint is attempted independently and a
-- mismatch is reported instead of aborting the whole migration.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_id_fkey' and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'skipping users_id_fkey: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trips_user_id_fkey' and conrelid = 'public.trips'::regclass
  ) then
    alter table public.trips
      add constraint trips_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'skipping trips_user_id_fkey: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_user_id_fkey' and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'skipping notifications_user_id_fkey: %', sqlerrm;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sos_logs_user_id_fkey' and conrelid = 'public.sos_logs'::regclass
  ) then
    alter table public.sos_logs
      add constraint sos_logs_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade;
  end if;
exception when others then
  raise notice 'skipping sos_logs_user_id_fkey: %', sqlerrm;
end $$;

-- Query paths used by both apps.
create index if not exists trips_user_id_date_idx on public.trips (user_id, date desc);
create index if not exists trips_status_idx on public.trips (status);
create index if not exists notifications_user_id_time_idx on public.notifications (user_id, time desc);
create index if not exists sos_logs_user_id_time_idx on public.sos_logs (user_id, time desc);
create index if not exists sos_logs_time_idx on public.sos_logs (time desc);
create index if not exists sos_logs_status_idx on public.sos_logs (status);
