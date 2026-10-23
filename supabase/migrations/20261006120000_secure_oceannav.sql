-- OceanNav security hardening: Supabase Auth, admin roles, RLS and realtime.
--
-- Supersedes (and must sort after) any earlier revision of this file: it
-- defines the single canonical public.handle_new_user() trigger, including
-- the legacy-profile linking behaviour, so nothing can overwrite it later.
--
-- Existing plaintext passwords are deliberately removed; users must reset or
-- recreate accounts through Supabase Auth.

alter table public.users drop column if exists password;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- Mirrors an Auth signup into public.users. When a legacy profile already
-- owns the signup email, its related rows are re-parented onto the new Auth
-- identity before the legacy row is removed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  legacy_profile_id uuid;
begin
  select id into legacy_profile_id
  from public.users
  where lower(email) = lower(new.email)
    and id <> new.id
  order by created_at
  limit 1;

  if legacy_profile_id is not null then
    -- Free the unique email before creating the Auth-linked profile.
    update public.users
    set email = 'legacy-' || legacy_profile_id::text || '@invalid.local'
    where id = legacy_profile_id;

    insert into public.users (id, name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email
    );

    update public.notifications set user_id = new.id where user_id = legacy_profile_id;
    update public.sos_logs set user_id = new.id where user_id = legacy_profile_id;
    update public.trips set user_id = new.id where user_id = legacy_profile_id;
    delete from public.users where id = legacy_profile_id;
  else
    insert into public.users (id, name, phone, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      new.email
    )
    on conflict (id) do update set
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep public.users.email in sync when a user changes address in the app
-- (fires only once Supabase Auth has actually applied the change).
create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    begin
      update public.users set email = new.email where id = new.id;
    exception when others then
      raise notice 'could not sync email for %: %', new.id, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_auth_user_email();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.trips enable row level security;
alter table public.sos_logs enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "users read own or admin" on public.users;
create policy "users read own or admin" on public.users for select
  using (id = auth.uid() or public.is_admin());
drop policy if exists "users update own" on public.users;
create policy "users update own" on public.users for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "roles read own or admin" on public.user_roles;
create policy "roles read own or admin" on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "trips read own or admin" on public.trips;
create policy "trips read own or admin" on public.trips for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "trips create own" on public.trips;
create policy "trips create own" on public.trips for insert
  with check (user_id = auth.uid());
drop policy if exists "trips update own or admin" on public.trips;
create policy "trips update own or admin" on public.trips for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "sos read own or admin" on public.sos_logs;
create policy "sos read own or admin" on public.sos_logs for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "sos create own" on public.sos_logs;
create policy "sos create own" on public.sos_logs for insert
  with check (user_id = auth.uid() and status = 'sent');
drop policy if exists "sos admin updates" on public.sos_logs;
create policy "sos admin updates" on public.sos_logs for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications read own or admin" on public.notifications;
create policy "notifications read own or admin" on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications create own" on public.notifications;
create policy "notifications create own" on public.notifications for insert
  with check (user_id = auth.uid());
drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: the admin console listens to INSERT/UPDATE on these tables.
-- postgres_changes silently delivers nothing when a table is absent from the
-- publication, so this must ship with the app that depends on it.
do $$
begin
  alter publication supabase_realtime add table public.sos_logs;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'publication supabase_realtime not found; skipping sos_logs';
end $$;

do $$
begin
  alter publication supabase_realtime add table public.trips;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'publication supabase_realtime not found; skipping trips';
end $$;

-- After creating the first Auth user for an administrator, run once:
-- insert into public.user_roles (user_id, role) values ('AUTH_USER_UUID', 'admin');
