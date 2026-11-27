-- ============================================================================
-- Migración 001: Reseñas (1 por sesión + Editar y Borrar propia reseña)
-- Archivo: supabase/migrations/001_reviews_session_edit_delete.sql
-- Seguro, idempotente y listo para ejecutar en Supabase SQL Editor.
-- ============================================================================

-- 1. Columna session_token (identifica de forma anónima la sesión del navegador)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS session_token text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Índice único parcial: garantiza a nivel base de datos 1 sola reseña por sesión
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_session_token
  ON public.reviews (session_token)
  WHERE session_token IS NOT NULL;

-- Índice para lectura rápida del muro público ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_reviews_approved_created_at
  ON public.reviews (approved, created_at DESC);

-- 3. Asegurar que nadie pueda hacer UPDATE/DELETE directo desde anon (solo vía RPC con token)
DROP POLICY IF EXISTS "Public update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public delete reviews" ON public.reviews;

-- 4. RPC: Crear reseña de esta sesión (rechaza duplicados si la sesión ya dejó una)
CREATE OR REPLACE FUNCTION public.create_own_review(
  p_session_token text,
  p_author_name text,
  p_company text DEFAULT '',
  p_project_name text DEFAULT '',
  p_rating int DEFAULT 5,
  p_comment text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  author_name text,
  company text,
  project_name text,
  rating int,
  comment text,
  approved boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := trim(coalesce(p_session_token, ''));
  v_name text := trim(coalesce(p_author_name, ''));
  v_comment text := trim(coalesce(p_comment, ''));
BEGIN
  IF char_length(v_token) < 16 THEN
    RAISE EXCEPTION 'Token de sesión inválido';
  END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'El nombre debe tener entre 2 y 80 caracteres';
  END IF;
  IF char_length(v_comment) < 5 OR char_length(v_comment) > 600 THEN
    RAISE EXCEPTION 'El comentario debe tener entre 5 y 600 caracteres';
  END IF;
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La calificación debe estar entre 1 y 5';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews r WHERE r.session_token = v_token) THEN
    RAISE EXCEPTION 'SESSION_ALREADY_REVIEWED';
  END IF;

  RETURN QUERY
  INSERT INTO public.reviews (
    session_token,
    author_name,
    company,
    project_name,
    rating,
    comment,
    approved
  )
  VALUES (
    v_token,
    v_name,
    left(trim(coalesce(p_company, '')), 80),
    left(trim(coalesce(p_project_name, '')), 80),
    p_rating,
    v_comment,
    false
  )
  RETURNING
    reviews.id,
    reviews.author_name,
    reviews.company,
    reviews.project_name,
    reviews.rating,
    reviews.comment,
    reviews.approved,
    reviews.created_at;
END;
$$;

-- 5. RPC: Obtener la reseña propia de esta sesión (aunque todavía esté pendiente de aprobación)
CREATE OR REPLACE FUNCTION public.get_own_review(p_session_token text)
RETURNS TABLE (
  id uuid,
  author_name text,
  company text,
  project_name text,
  rating int,
  comment text,
  approved boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.author_name,
    r.company,
    r.project_name,
    r.rating,
    r.comment,
    r.approved,
    r.created_at
  FROM public.reviews r
  WHERE r.session_token = trim(coalesce(p_session_token, ''))
    AND char_length(trim(coalesce(p_session_token, ''))) >= 16
  LIMIT 1;
$$;

-- 6. RPC: Editar la reseña propia (verificando session_token)
CREATE OR REPLACE FUNCTION public.update_own_review(
  p_session_token text,
  p_author_name text,
  p_company text DEFAULT '',
  p_project_name text DEFAULT '',
  p_rating int DEFAULT 5,
  p_comment text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  author_name text,
  company text,
  project_name text,
  rating int,
  comment text,
  approved boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := trim(coalesce(p_session_token, ''));
  v_name text := trim(coalesce(p_author_name, ''));
  v_comment text := trim(coalesce(p_comment, ''));
BEGIN
  IF char_length(v_token) < 16 THEN
    RAISE EXCEPTION 'Token de sesión inválido';
  END IF;
  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'El nombre debe tener entre 2 y 80 caracteres';
  END IF;
  IF char_length(v_comment) < 5 OR char_length(v_comment) > 600 THEN
    RAISE EXCEPTION 'El comentario debe tener entre 5 y 600 caracteres';
  END IF;
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La calificación debe estar entre 1 y 5';
  END IF;

  RETURN QUERY
  UPDATE public.reviews
  SET
    author_name = v_name,
    company = left(trim(coalesce(p_company, '')), 80),
    project_name = left(trim(coalesce(p_project_name, '')), 80),
    rating = p_rating,
    comment = v_comment,
    updated_at = now()
  WHERE public.reviews.session_token = v_token
  RETURNING
    reviews.id,
    reviews.author_name,
    reviews.company,
    reviews.project_name,
    reviews.rating,
    reviews.comment,
    reviews.approved,
    reviews.created_at;
END;
$$;

-- 7. RPC: Borrar la reseña propia (verificando session_token)
CREATE OR REPLACE FUNCTION public.delete_own_review(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.reviews
  WHERE session_token = trim(coalesce(p_session_token, ''))
    AND char_length(trim(coalesce(p_session_token, ''))) >= 16;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- 8. Permisos de ejecución para visitantes anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.create_own_review(text, text, text, text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_review(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_review(text, text, text, text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_review(text) TO anon, authenticated;
