-- Temporary trigger logging for diagnosing recalculate_total_points
-- Run this in Supabase SQL editor as an admin (service_role / owner)

-- 1) Create log table
create table if not exists public.trigger_log(
  id serial primary key,
  when_called timestamptz default now(),
  event_table text,
  operation text,
  who_called text,
  meta jsonb
);

-- 2) Create logging function (security definer so it can write to log despite RLS)
create or replace function public.log_trigger_event()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.trigger_log(event_table, operation, who_called, meta)
  values (TG_TABLE_NAME, TG_OP, current_user, jsonb_build_object('tg_name', TG_NAME, 'when', now()));
  return null;
end;
$$;

-- 3) Attach statement-level logging triggers to matches and predictions
drop trigger if exists trigger_log_on_matches on public.matches;
create trigger trigger_log_on_matches
after insert or update or delete on public.matches
for each statement
execute function public.log_trigger_event();

drop trigger if exists trigger_log_on_predictions on public.predictions;
create trigger trigger_log_on_predictions
after insert or update or delete on public.predictions
for each statement
execute function public.log_trigger_event();

-- 4) How to test
-- a) Run an update that should fire the trigger:
--    update public.matches set home_score = home_score where id = 2;
-- b) Inspect the log:
--    select * from public.trigger_log order by when_called desc limit 50;

-- 5) Cleanup (run when finished debugging)
-- drop trigger if exists trigger_log_on_matches on public.matches;
-- drop trigger if exists trigger_log_on_predictions on public.predictions;
-- drop function if exists public.log_trigger_event();
-- drop table if exists public.trigger_log;
