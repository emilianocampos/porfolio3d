-- ============================================================
-- Portfolio 3D — Tabla de Reseñas + Supabase Realtime
-- Copiá y pegá todo este script en:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

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

-- Activar Row Level Security (RLS)
alter table public.reviews enable row level security;

-- 1. Cualquiera puede leer SOLO reseñas aprobadas por vos
create policy "Public can read approved reviews"
  on public.reviews
  for select
  using (approved = true);

-- 2. Cualquier cliente puede enviar una reseña nueva (entra con approved = false)
create policy "Anyone can submit a review"
  on public.reviews
  for insert
  with check (approved = false);

-- 3. Habilitar Realtime en la tabla reviews (para que aparezcan en vivo al aprobarlas)
alter publication supabase_realtime add table public.reviews;

-- (Opcional) Reseña de ejemplo ya aprobada para probar:
insert into public.reviews (author_name, company, project_name, rating, comment, approved)
values (
  'Cliente Ejemplo',
  'Emprendimiento Local',
  'Web Institucional',
  5,
  'Excelente trabajo, súper rápido y con un diseño moderno que encantó a nuestros clientes.',
  true
);
