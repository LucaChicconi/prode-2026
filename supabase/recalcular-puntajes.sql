begin;

with normalized_matches as (
  select
    m.*,
    lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
    lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm
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
            (
              (m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
               and m.away_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania'))
              or
              (m.away_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
               and m.home_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania'))
            )
          )
          and (
            case
              when m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
                then m.home_score
              else m.away_score
            end >= case
              when m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
                then m.away_score
              else m.home_score
            end
          )
        then 5
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

commit;