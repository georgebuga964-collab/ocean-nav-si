-- Store trip departure times and notification times as real timestamps.
--
-- Both columns were previously written as display strings ("05 Oct 2026,
-- 14:30", "10 May 2025 • 7:30 AM"), which cannot be ordered correctly with
-- `order()`. The apps now send ISO timestamps and format at render time.
-- Legacy values that cannot be parsed become NULL instead of aborting.

create or replace function public.oceannav_parse_timestamptz(text)
returns timestamptz
language plpgsql
as $$
begin
  if $1 is null or btrim($1) = '' then
    return null;
  end if;
  return $1::timestamptz;
exception when others then
  begin
    return to_timestamp($1, 'DD Mon YYYY, HH24:MI');
  exception when others then
    begin
      return to_timestamp($1, 'DD Mon YYYY');
    exception when others then
      return null;
    end;
  end;
end;
$$;

do $$
declare
  col_type text;
begin
  select data_type into col_type
    from information_schema.columns
   where table_schema = 'public' and table_name = 'trips' and column_name = 'date';

  if col_type in ('text', 'character varying') then
    alter table public.trips
      alter column "date" type timestamptz
      using (public.oceannav_parse_timestamptz("date"::text));
  elsif col_type = 'date' then
    alter table public.trips
      alter column "date" type timestamptz
      using ("date"::timestamp at time zone 'UTC');
  elsif col_type = 'timestamp without time zone' then
    alter table public.trips
      alter column "date" type timestamptz
      using ("date" at time zone 'UTC');
  end if;
end $$;

do $$
declare
  col_type text;
begin
  select data_type into col_type
    from information_schema.columns
   where table_schema = 'public' and table_name = 'notifications' and column_name = 'time';

  if col_type in ('text', 'character varying') then
    alter table public.notifications
      alter column "time" type timestamptz
      using (public.oceannav_parse_timestamptz("time"::text));
  elsif col_type = 'timestamp without time zone' then
    alter table public.notifications
      alter column "time" type timestamptz
      using ("time" at time zone 'UTC');
  end if;
end $$;

drop function if exists public.oceannav_parse_timestamptz(text);
