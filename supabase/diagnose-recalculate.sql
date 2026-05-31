-- Diagnostic queries for recalculate_total_points trigger
-- 1) Compare stored totals vs computed totals
with scored_predictions as (
  select
    p.user_id,
    case
      when m.home_score is null or m.away_score is null then 0
      when p.home_score_pred is null or p.away_score_pred is null then 0
      when p.home_score_pred = m.home_score and p.away_score_pred = m.away_score then 3
      when (
        case when p.home_score_pred > p.away_score_pred then 'home' when p.away_score_pred > p.home_score_pred then 'away' else 'draw' end
      ) = (
        case when m.home_score > m.away_score then 'home' when m.away_score > m.home_score then 'away' else 'draw' end
      ) then 1
      else 0
    end as points
  from public.predictions p
  join public.matches m on m.id::text = p.match_id::text
), totals as (
  select user_id, sum(points)::int as computed_points
  from scored_predictions
  group by user_id
)
select
  pr.id as profile_id,
  pr.username,
  coalesce(pr.total_points,0) as stored_total_points,
  coalesce(t.computed_points,0) as computed_points,
  coalesce(pr.total_points,0) - coalesce(t.computed_points,0) as diff
from public.profiles pr
left join totals t on t.user_id = pr.id
order by diff desc, computed_points desc
limit 200;

-- 2) Create a temporary trigger log table (run once) and modify trigger to insert into it for verification.
-- If you want to enable logging, run the two statements below (requires admin):
-- create table if not exists public.trigger_log(id serial primary key, when_called timestamptz default now(), who text, event text);
-- then temporarily alter trigger function to insert: perform pg_notify('trig','called');

-- 3) Quick manual test: call the function and check count of updated profiles
select count(*) as profiles_with_points_before from public.profiles where total_points > 0;
begin; select public.recalculate_total_points(); commit;
select count(*) as profiles_with_points_after from public.profiles where total_points > 0;

-- 4) Force recalc for single user (example): replace '<USER_UUID>' with id
-- with scored as (
--   select p.user_id, sum(case ... end) as pts from public.predictions p join public.matches m on m.id::text = p.match_id::text where p.user_id = '<USER_UUID>' group by p.user_id
-- ) update public.profiles pr set total_points = coalesce((select pts from scored),0) where pr.id = '<USER_UUID>';
