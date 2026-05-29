create table if not exists public.elijo_creer_selections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  team text not null,
  phase text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.elijo_creer_selections enable row level security;

drop policy if exists "Users can read their own elijo creer selection" on public.elijo_creer_selections;
create policy "Users can read their own elijo creer selection"
  on public.elijo_creer_selections
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own elijo creer selection" on public.elijo_creer_selections;
create policy "Users can create their own elijo creer selection"
  on public.elijo_creer_selections
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own elijo creer selection" on public.elijo_creer_selections;
create policy "Users can update their own elijo creer selection"
  on public.elijo_creer_selections
  for update
  using (false)
  with check (false);

drop policy if exists "Users can delete their own elijo creer selection" on public.elijo_creer_selections;
create policy "Users can delete their own elijo creer selection"
  on public.elijo_creer_selections
  for delete
  using (false);

create or replace function public.set_elijo_creer_selection_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_elijo_creer_selection_updated_at on public.elijo_creer_selections;
create trigger set_elijo_creer_selection_updated_at
before update on public.elijo_creer_selections
for each row
execute function public.set_elijo_creer_selection_updated_at();