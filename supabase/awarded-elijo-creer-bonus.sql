-- =============================================================
-- Elijo Creer bonus points
-- Run this script manually at the end of the tournament
-- =============================================================
--
-- Points table:
--   Predicted phase               Condition                          Bonus
--   Dieciseisavos de final        Team appears in dieciseisavos      +10
--   Octavos                       Team appears in octavos            +15
--   Cuartos                       Team appears in cuartos            +25
--   Semis                         Team appears in semifinal          +35
--   Final                         Team appears in final              +50
--   Campeon                       Team wins the final                +125
--   Fase de grupos                (no bonus)                         0
--
-- =============================================================
-- STEP 1: Preview (run this first to see who would get bonus)
-- =============================================================

with
normalized_matches as (
  select
    m.*,
    lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
    lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm,
    lower(translate(coalesce(m.stage, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as stage_norm
  from public.matches m
),
team_max_phase as (
  select
    team_norm,
    max(
      case
        when stage_norm like '%dieciseisavos%' then 1
        when stage_norm like '%octavos%' then 2
        when stage_norm like '%cuartos%' then 3
        when stage_norm like '%semifinal%' or stage_norm like '%semis%' then 4
        when stage_norm like '%final%' and stage_norm not like '%semifinal%' and stage_norm not like '%semis%' then 5
        else 0
      end
    ) as max_phase
  from (
    select home_team_norm as team_norm, stage_norm from normalized_matches
    union all
    select away_team_norm as team_norm, stage_norm from normalized_matches
  ) all_team_matches
  group by team_norm
),
final_winner as (
  select
    case
      when home_score > away_score then home_team_norm
      when away_score > home_score then away_team_norm
      else null
    end as winner_team_norm
  from normalized_matches
  where stage_norm like '%final%' and stage_norm not like '%semifinal%' and stage_norm not like '%semis%'
  limit 1
),
normalized_selections as (
  select
    ecs.user_id,
    lower(translate(coalesce(ecs.team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as team_norm,
    ecs.phase
  from public.elijo_creer_selections ecs
),
predicted_phase_level as (
  select
    user_id,
    team_norm,
    phase,
    case
      when phase = 'Dieciseisavos de final' then 1
      when phase = 'Octavos' then 2
      when phase = 'Cuartos' then 3
      when phase = 'Semis' then 4
      when phase = 'Final' then 5
      when phase = 'Campeón' then 6
      else 0
    end as predicted_level
  from normalized_selections
)
select
  pr.username,
  ecs.team as selected_team,
  ecs.phase as predicted_phase,
  coalesce(tmp.max_phase, 0) as team_reached_phase,
  case
    when ppl.predicted_level = 6 then
      case when fw.winner_team_norm = ppl.team_norm then 125 else 0 end
    when ppl.predicted_level between 1 and 5 then
      case
        when coalesce(tmp.max_phase, 0) >= ppl.predicted_level then
          case
            when ppl.predicted_level = 1 then 10
            when ppl.predicted_level = 2 then 15
            when ppl.predicted_level = 3 then 25
            when ppl.predicted_level = 4 then 35
            when ppl.predicted_level = 5 then 50
          end
        else 0
      end
    else 0
  end as bonus_points
from predicted_phase_level ppl
join public.elijo_creer_selections ecs on ecs.user_id = ppl.user_id
join public.profiles pr on pr.id = ppl.user_id
left join team_max_phase tmp on tmp.team_norm = ppl.team_norm
left join final_winner fw on true
where ppl.predicted_level > 0
order by bonus_points desc, pr.username;


-- =============================================================
-- STEP 2: Apply bonus (uncomment and run when ready)
-- =============================================================

-- begin;
--
-- with
-- normalized_matches as (
--   select
--     m.*,
--     lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
--     lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm,
--     lower(translate(coalesce(m.stage, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as stage_norm
--   from public.matches m
-- ),
-- team_max_phase as (
--   select
--     team_norm,
--     max(
--       case
--         when stage_norm like '%dieciseisavos%' then 1
--         when stage_norm like '%octavos%' then 2
--         when stage_norm like '%cuartos%' then 3
--         when stage_norm like '%semifinal%' or stage_norm like '%semis%' then 4
--         when stage_norm like '%final%' and stage_norm not like '%semifinal%' and stage_norm not like '%semis%' then 5
--         else 0
--       end
--     ) as max_phase
--   from (
--     select home_team_norm as team_norm, stage_norm from normalized_matches
--     union all
--     select away_team_norm as team_norm, stage_norm from normalized_matches
--   ) all_team_matches
--   group by team_norm
-- ),
-- final_winner as (
--   select
--     case
--       when home_score > away_score then home_team_norm
--       when away_score > home_score then away_team_norm
--       else null
--     end as winner_team_norm
--   from normalized_matches
--   where stage_norm like '%final%' and stage_norm not like '%semifinal%' and stage_norm not like '%semis%'
--   limit 1
-- ),
-- normalized_selections as (
--   select
--     ecs.user_id,
--     lower(translate(coalesce(ecs.team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as team_norm,
--     ecs.phase
--   from public.elijo_creer_selections ecs
-- ),
-- predicted_phase_level as (
--   select
--     user_id,
--     team_norm,
--     phase,
--     case
--       when phase = 'Dieciseisavos de final' then 1
--       when phase = 'Octavos' then 2
--       when phase = 'Cuartos' then 3
--       when phase = 'Semis' then 4
--       when phase = 'Final' then 5
--       when phase = 'Campeón' then 6
--       else 0
--     end as predicted_level
--   from normalized_selections
-- ),
-- elijo_creer_bonus as (
--   select
--     ppl.user_id,
--     case
--       when ppl.predicted_level = 0 then 0
--       when ppl.predicted_level = 6 then
--         case when fw.winner_team_norm = ppl.team_norm then 125 else 0 end
--       when coalesce(tmp.max_phase, 0) >= ppl.predicted_level then
--         case
--           when ppl.predicted_level = 1 then 10
--           when ppl.predicted_level = 2 then 15
--           when ppl.predicted_level = 3 then 25
--           when ppl.predicted_level = 4 then 35
--           when ppl.predicted_level = 5 then 50
--           else 0
--         end
--       else 0
--     end as bonus
--   from predicted_phase_level ppl
--   left join team_max_phase tmp on tmp.team_norm = ppl.team_norm
--   left join final_winner fw on true
-- )
-- update public.profiles pr
-- set elijo_creer_bonus = coalesce(eb.bonus, 0)
-- from elijo_creer_bonus eb
-- where pr.id = eb.user_id;
--
-- -- Recalculate total_points with the bonus included
-- with normalized_matches as (
--   select
--     m.*,
--     lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
--     lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm
--   from public.matches m
-- ), scored_predictions as (
--   select
--     p.user_id,
--     case
--       when m.home_score is null or m.away_score is null then 0
--       when p.home_score_pred is null or p.away_score_pred is null then 0
--       when p.home_score_pred = m.home_score and p.away_score_pred = m.away_score then
--         3 + case
--           when (
--             (
--               (m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
--                and m.away_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania'))
--               or
--               (m.away_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
--                and m.home_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania'))
--             )
--           )
--           and (
--             case
--               when m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
--                 then m.home_score
--               else m.away_score
--             end >= case
--               when m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
--                 then m.away_score
--               else m.home_score
--             end
--           )
--         then 5
--         else 0
--         end
--       when (
--         case
--           when p.home_score_pred > p.away_score_pred then 'home'
--           when p.away_score_pred > p.home_score_pred then 'away'
--           else 'draw'
--         end
--       ) = (
--         case
--           when m.home_score > m.away_score then 'home'
--           when m.away_score > m.home_score then 'away'
--           else 'draw'
--         end
--       ) then 1
--       else 0
--     end as points
--   from public.predictions p
--   join normalized_matches m
--     on m.id::text = p.match_id::text
-- ), totals as (
--   select user_id, sum(points)::int as total_points
--   from scored_predictions
--   group by user_id
-- )
-- update public.profiles pr
-- set total_points = coalesce(totals.total_points, 0) + coalesce(pr.elijo_creer_bonus, 0)
-- from (
--   select pr_all.id as user_id, totals.total_points
--   from public.profiles pr_all
--   left join totals on totals.user_id = pr_all.id
-- ) totals
-- where pr.id = totals.user_id;
--
-- commit;
