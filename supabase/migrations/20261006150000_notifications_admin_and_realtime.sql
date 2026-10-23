-- Let an admin acknowledge an SOS by notifying the distressed user, and
-- make those notifications realtime so the app can surface them instantly.

drop policy if exists "notifications admin creates" on public.notifications;
create policy "notifications admin creates" on public.notifications for insert
  with check (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'publication supabase_realtime not found; skipping notifications';
end $$;

-- Quietly allow the existing policy set to remain permissive (OR). No extra
-- update/delete needed — the owner policies already cover reads.
