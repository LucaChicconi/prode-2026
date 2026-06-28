-- =============================================
-- KNOCKOUT MATCHES TABLE
-- =============================================
create table if not exists public.knockout_matches (
  id int generated always as identity primary key,
  match_id text unique not null,
  home_team text not null,
  away_team text not null,
  home_score int,
  away_score int,
  home_penalties int,
  away_penalties int,
  match_time timestamptz not null,
  stage text not null,
  locked boolean not null default false
);

alter table public.knockout_matches enable row level security;

-- Everyone can read knockout matches
create policy "Knockout matches are readable by everyone"
  on public.knockout_matches for select
  using (true);

-- Only admins can insert/update knockout matches
create policy "Admins can insert knockout matches"
  on public.knockout_matches for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update knockout matches"
  on public.knockout_matches for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- =============================================
-- KNOCKOUT PREDICTIONS TABLE
-- =============================================
create table if not exists public.knockout_predictions (
  id int generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.knockout_matches(match_id) on delete cascade,
  home_score_pred int not null,
  away_score_pred int not null,
  home_penalties_pred int,
  away_penalties_pred int,
  unique(user_id, match_id)
);

alter table public.knockout_predictions enable row level security;

-- Users can read their own knockout predictions
create policy "Users can read own knockout predictions"
  on public.knockout_predictions for select
  using (auth.uid() = user_id);

-- Users can insert their own knockout predictions
create policy "Users can insert own knockout predictions"
  on public.knockout_predictions for insert
  with check (auth.uid() = user_id);

-- Users can update their own knockout predictions
create policy "Users can update own knockout predictions"
  on public.knockout_predictions for update
  using (auth.uid() = user_id);

-- Users can delete their own knockout predictions
create policy "Users can delete own knockout predictions"
  on public.knockout_predictions for delete
  using (auth.uid() = user_id);

-- =============================================
-- SCORING FUNCTION: knockout_points
-- 10 pts = exact penalties
--  6 pts = exact regular time score
--  3 pts = correct advancing team (winner)
--  0 pts = wrong winner
-- =============================================
create or replace function public.recalculate_knockout_points()
returns void
language sql
security definer
as $$
  with scored as (
    select
      kp.user_id,
      case
        -- match not played yet
        when km.home_score is null or km.away_score is null then 0

        -- user predicted regular time win and match was decided in regular time
        when kp.home_score_pred != kp.away_score_pred
          and km.home_score != km.away_score then
          case
            -- exact score
            when kp.home_score_pred = km.home_score and kp.away_score_pred = km.away_score then 6
            -- correct winner
            when (kp.home_score_pred > kp.away_score_pred and km.home_score > km.away_score)
              or (kp.away_score_pred > kp.home_score_pred and km.away_score > km.home_score) then 3
            else 0
          end

        -- user predicted draw and match went to penalties (draw in regular time)
        when kp.home_score_pred = kp.away_score_pred
          and km.home_score = km.away_score
          and km.home_penalties is not null
          and km.away_penalties is not null then
          case
            -- user also predicted penalties correctly
            when kp.home_penalties_pred is not null
              and kp.away_penalties_pred is not null
              and kp.home_penalties_pred = km.home_penalties
              and kp.away_penalties_pred = km.away_penalties then 10
            -- exact regular time score (draw with same goals)
            when kp.home_score_pred = km.home_score and kp.away_score_pred = km.away_score then 6
            -- user predicted a draw (any score) and match was a draw → correct that it goes to penalties
            else 3
          end

        -- user predicted draw but match was decided in regular time
        when kp.home_score_pred = kp.away_score_pred
          and km.home_score != km.away_score then 0

        -- user predicted a winner but match was a draw (went to penalties)
        when kp.home_score_pred != kp.away_score_pred
          and km.home_score = km.away_score
          and km.home_penalties is not null then 0

        else 0
      end as points
    from public.knockout_predictions kp
    join public.knockout_matches km on km.match_id = kp.match_id
  ), totals as (
    select user_id, sum(points)::int as knockout_points
    from scored
    group by user_id
  )
  update public.profiles pr
  set knockout_points = coalesce(totals.knockout_points, 0)
  from (
    select pr_all.id as user_id, totals.knockout_points
    from public.profiles pr_all
    left join totals on totals.user_id = pr_all.id
  ) totals
  where pr.id = totals.user_id;
$$;

-- =============================================
-- TRIGGER FUNCTION
-- =============================================
create or replace function public.trigger_recalculate_knockout_points()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.recalculate_knockout_points();
  return null;
end;
$$;

-- Triggers on knockout_matches
drop trigger if exists trigger_recalculate_knockout_on_matches on public.knockout_matches;
create trigger trigger_recalculate_knockout_on_matches
after insert or update or delete on public.knockout_matches
for each statement
execute function public.trigger_recalculate_knockout_points();

-- Triggers on knockout_predictions
drop trigger if exists trigger_recalculate_knockout_on_predictions on public.knockout_predictions;
create trigger trigger_recalculate_knockout_on_predictions
after insert or update or delete on public.knockout_predictions
for each statement
execute function public.trigger_recalculate_knockout_points();
