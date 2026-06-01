create or replace function public.get_hoy_la_vieron()
returns table(username text)
language sql
security definer
set search_path = public
as $$
  with normalized_matches as (
    select
      m.*,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm
    from public.matches m
  )
  select distinct pr.username
  from public.predictions p
  join normalized_matches m
    on m.id::text = p.match_id::text
  join public.profiles pr
    on pr.id = p.user_id
  where p.home_score_pred is not null
    and p.away_score_pred is not null
    and m.home_score is not null
    and m.away_score is not null
    and p.home_score_pred = m.home_score
    and p.away_score_pred = m.away_score
    and (
      (
        m.home_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
        and m.away_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania')
        and m.home_score >= m.away_score
      )
      or
      (
        m.away_team_norm in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia')
        and m.home_team_norm in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania')
        and m.away_score >= m.home_score
      )
    )
  order by pr.username;
$$;