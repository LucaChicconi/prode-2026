create or replace function public.recalculate_total_points()
returns void
language sql
security definer
as $$
  with normalized_matches as (
    select
      m.*,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania') as home_is_top,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania') as away_is_top,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia') as home_is_low,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia') as away_is_low
    from public.matches m
  ), scored_predictions as (
    select
      p.user_id,
      case
        when m.home_score is null or m.away_score is null then 0
        when p.home_score_pred is null or p.away_score_pred is null then 0
        when p.home_score_pred = m.home_score and p.away_score_pred = m.away_score then
          3 + case
            when (
              (m.home_is_low and m.away_is_top)
              or (m.away_is_low and m.home_is_top)
            ) and (
              case
                when m.home_is_low then m.home_score
                else m.away_score
              end >= case
                when m.home_is_low then m.away_score
                else m.home_score
              end
            ) then 5
            else 0
          end
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
    join normalized_matches m
      on m.id::text = p.match_id::text
  ), totals as (
    select user_id, sum(points)::int as total_points
    from scored_predictions
    group by user_id
  )
  update public.profiles pr
  set total_points = coalesce(totals.total_points, 0)
  from (
    select pr_all.id as user_id, totals.total_points
    from public.profiles pr_all
    left join totals on totals.user_id = pr_all.id
  ) totals
  where pr.id = totals.user_id;
$$;

create or replace function public.trigger_recalculate_total_points()
returns trigger
language plpgsql
security definer
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
