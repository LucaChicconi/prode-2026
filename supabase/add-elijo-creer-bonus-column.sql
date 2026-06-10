alter table public.profiles
add column if not exists elijo_creer_bonus int not null default 0;
