create or replace function public.recalculate_total_points()
returns void
language sql
as $$
  with scored_predictions as (
    select
      p.user_id,
      case
        when m.home_score is null or m.away_score is null then 0
        when p.home_score_pred is null or p.away_score_pred is null then 0
        when p.home_score_pred = m.home_score and p.away_score_pred = m.away_score then 3
        when (
          case
            when p.home_score_pred > p.away_score_pred then 'home'
            when p.away_score_pred > p.home_score_pred then 'away'
            else 'draw'
          end
        ) = (
          case
            when m.home_score > m.away_score then 'home'
            when m.away_score > m.home_score then 'away'
            else 'draw'
          end
        ) then 1
        else 0
      end as points
    from public.predictions p
    join public.matches m
      on m.id::text = p.match_id::text
  ), totals as (
    select user_id, sum(points)::int as total_points
    from scored_predictions
    group by user_id
  )
  update public.profiles pr
  set total_points = coalesce(totals.total_points, 0)
  from totals
  where pr.id = totals.user_id;
$$;

create or replace function public.trigger_recalculate_total_points()
returns trigger
language plpgsql
as $$
begin
  perform public.recalculate_total_points();
  return null;
end;
$$;

drop trigger if exists trigger_recalculate_total_points_on_matches on public.matches;
create trigger trigger_recalculate_total_points_on_matches
after insert or update or delete on public.matches
for each statement
execute function public.trigger_recalculate_total_points();

drop trigger if exists trigger_recalculate_total_points_on_predictions on public.predictions;
create trigger trigger_recalculate_total_points_on_predictions
after insert or update or delete on public.predictions
for each statement
execute function public.trigger_recalculate_total_points();
