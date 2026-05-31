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
)
select
  pr.id as profile_id,
  pr.username,
  coalesce(pr.total_points, 0) as stored_total_points,
  coalesce(s.computed_points, 0) as computed_points_from_predictions,
  coalesce(pr.total_points, 0) + coalesce(s.computed_points, 0) as preview_total_points
from public.profiles pr
left join (
  select user_id, sum(points)::int as computed_points
  from scored_predictions
  group by user_id
) s on s.user_id = pr.id
order by preview_total_points desc, pr.username;
