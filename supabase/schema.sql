-- ============================================================
-- Portfolio 3D — Tablas de Reseñas y Contador de Me Gusta
-- Script 100% idempotente (puedes ejecutarlo varias veces sin error)
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. TABLA DE RESEÑAS
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(trim(author_name)) >= 2),
  company text default '',
  project_name text default '',
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(trim(comment)) >= 5),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
  on public.reviews
  for select
  using (approved = true);

drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review"
  on public.reviews
  for insert
  with check (approved = false);

-- 2. TABLA DEL CONTADOR DIGITAL DE ME GUSTA
create table if not exists public.site_stats (
  id text primary key,
  likes integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_stats (id, likes)
values ('portfolio', 0)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

drop policy if exists "Public can read site stats" on public.site_stats;
create policy "Public can read site stats"
  on public.site_stats
  for select
  using (true);

create or replace function public.increment_portfolio_likes()
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into public.site_stats (id, likes, updated_at)
  values ('portfolio', 1, now())
  on conflict (id) do update
    set likes = public.site_stats.likes + 1,
        updated_at = now()
  returning likes into new_count;
  return new_count;
end;
$$;

grant execute on function public.increment_portfolio_likes() to anon, authenticated;

-- 3. HABILITAR REALTIME SOLO SI NO ESTÁN AGREGADAS AÚN
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reviews'
  ) then
    alter publication supabase_realtime add table public.reviews;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_stats'
  ) then
    alter publication supabase_realtime add table public.site_stats;
  end if;
end $$;
