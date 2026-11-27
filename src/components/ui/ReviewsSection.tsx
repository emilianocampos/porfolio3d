import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Pencil, Send, Star, Trash2, X } from 'lucide-react';
import { DEMO_REVIEWS, type ReviewItem } from '../../data/portfolioData';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface ReviewsSectionProps {
  defaultOpenForm?: boolean;
}

interface OwnReviewItem extends ReviewItem {
  approved?: boolean;
}

const SESSION_TOKEN_KEY = 'portfolio_review_session_token_v1';
const LOCAL_OWN_REVIEW_KEY = 'portfolio_own_review_v1';

function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return 'ssr-session-token-000000';
  try {
    const existing = window.localStorage.getItem(SESSION_TOKEN_KEY);
    if (existing && existing.length >= 16) return existing;
    const next =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `${crypto.randomUUID()}-${Date.now().toString(36)}`
        : `sess-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}-portfolio`;
    window.localStorage.setItem(SESSION_TOKEN_KEY, next);
    return next;
  } catch {
    return `mem-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}-portfolio`;
  }
}

function readCachedOwnReview(): OwnReviewItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_OWN_REVIEW_KEY);
    return raw ? (JSON.parse(raw) as OwnReviewItem) : null;
  } catch {
    return null;
  }
}

function saveCachedOwnReview(item: OwnReviewItem | null) {
  if (typeof window === 'undefined') return;
  try {
    if (item) {
      window.localStorage.setItem(LOCAL_OWN_REVIEW_KEY, JSON.stringify(item));
    } else {
      window.localStorage.removeItem(LOCAL_OWN_REVIEW_KEY);
    }
  } catch {
    // ignore storage quota/private mode errors
  }
}

export function ReviewsSection({ defaultOpenForm = false }: ReviewsSectionProps) {
  const [sessionToken] = useState<string>(() => getOrCreateSessionToken());
  const [ownReview, setOwnReview] = useState<OwnReviewItem | null>(() =>
    readCachedOwnReview()
  );
  const [reviews, setReviews] = useState<ReviewItem[]>(DEMO_REVIEWS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(() => defaultOpenForm && !readCachedOwnReview());
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [authorName, setAuthorName] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadAll = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);

    const [publicRes, ownRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, author_name, company, project_name, rating, comment, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false }),
      supabase.rpc('get_own_review', { p_session_token: sessionToken }),
    ]);

    if (!publicRes.error && publicRes.data) {
      setReviews(publicRes.data.length > 0 ? publicRes.data : DEMO_REVIEWS);
    }

    if (!ownRes.error && Array.isArray(ownRes.data)) {
      const mine = (ownRes.data[0] as OwnReviewItem | undefined) ?? null;
      setOwnReview(mine);
      saveCachedOwnReview(mine);
      if (mine) setShowForm(false);
    }

    setLoading(false);
  }, [sessionToken]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    loadAll();

    // Realtime subscription: newly approved/updated/deleted reviews sync live!
    const channel = supabase
      .channel('reviews-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          loadAll();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [loadAll]);

  const startEditing = () => {
    if (!ownReview) return;
    setAuthorName(ownReview.author_name);
    setCompany(ownReview.company ?? '');
    setProjectName(ownReview.project_name ?? '');
    setRating(ownReview.rating);
    setComment(ownReview.comment);
    setIsEditing(true);
    setShowForm(true);
    setConfirmDelete(false);
    setFeedbackMsg(null);
  };

  const cancelForm = () => {
    setIsEditing(false);
    setShowForm(false);
    setFeedbackMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authorName.trim().length < 2 || comment.trim().length < 5) return;
    if (!isEditing && ownReview) {
      setFeedbackMsg('Ya dejaste una reseña en esta sesión. Podés editarla o borrarla.');
      return;
    }

    setSubmitting(true);
    setFeedbackMsg(null);

    if (isSupabaseConfigured && supabase) {
      const rpcName = isEditing ? 'update_own_review' : 'create_own_review';
      const { data, error } = await supabase.rpc(rpcName, {
        p_session_token: sessionToken,
        p_author_name: authorName.trim(),
        p_company: company.trim(),
        p_project_name: projectName.trim(),
        p_rating: rating,
        p_comment: comment.trim(),
      });

      if (error) {
        if (error.message?.includes('SESSION_ALREADY_REVIEWED')) {
          setFeedbackMsg('Ya dejaste una reseña en esta sesión. Podés editarla o borrarla.');
          await loadAll();
        } else {
          setFeedbackMsg(
            'No se pudo guardar la reseña. Verificá tu conexión o ejecutá la migración 001 en Supabase.'
          );
        }
      } else {
        const saved = (Array.isArray(data) ? data[0] : data) as OwnReviewItem | undefined;
        if (saved) {
          setOwnReview(saved);
          saveCachedOwnReview(saved);
        }
        setFeedbackMsg(
          isEditing
            ? '¡Tu reseña fue actualizada correctamente!'
            : '¡Gracias por tu reseña! Ya podés editarla o borrarla cuando quieras.'
        );
        setIsEditing(false);
        setShowForm(false);
        await loadAll();
      }
    } else {
      // Demo preview mode without .env
      const localItem: OwnReviewItem = {
        id: isEditing && ownReview ? ownReview.id : `local-${Date.now()}`,
        author_name: authorName.trim(),
        company: company.trim(),
        project_name: projectName.trim(),
        rating,
        comment: comment.trim(),
        approved: true,
        created_at:
          isEditing && ownReview ? ownReview.created_at : new Date().toISOString(),
      };
      setOwnReview(localItem);
      saveCachedOwnReview(localItem);
      setReviews((prev) =>
        isEditing
          ? prev.map((r) => (r.id === localItem.id ? localItem : r))
          : [localItem, ...prev]
      );
      setFeedbackMsg(
        isEditing
          ? '¡Reseña editada en modo vista previa!'
          : '¡Reseña guardada en modo vista previa!'
      );
      setIsEditing(false);
      setShowForm(false);
    }

    setSubmitting(false);
  };

  const handleDeleteOwnReview = async () => {
    if (!ownReview) return;
    setDeleting(true);
    setFeedbackMsg(null);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('delete_own_review', {
        p_session_token: sessionToken,
      });
      if (error) {
        setFeedbackMsg('No se pudo borrar la reseña. Intentá de nuevo.');
      } else {
        const deletedId = ownReview.id;
        setOwnReview(null);
        saveCachedOwnReview(null);
        setReviews((prev) => prev.filter((r) => r.id !== deletedId));
        setConfirmDelete(false);
        setIsEditing(false);
        setFeedbackMsg('Tu reseña fue borrada. Podés escribir una nueva si querés.');
        await loadAll();
      }
    } else {
      const deletedId = ownReview.id;
      setOwnReview(null);
      saveCachedOwnReview(null);
      setReviews((prev) => prev.filter((r) => r.id !== deletedId));
      setConfirmDelete(false);
      setIsEditing(false);
      setFeedbackMsg('Tu reseña fue borrada.');
    }

    setDeleting(false);
  };

  const handleCopyClientLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?resena=1`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // ignore clipboard errors on non-https
    }
  };

  // Avoid duplicating ownReview inside the public list when already approved
  const publicReviews = ownReview
    ? reviews.filter((r) => r.id !== ownReview.id)
    : reviews;

  return (
    <div className="reviews-section">
      <div className="reviews-toolbar">
        {!ownReview ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setIsEditing(false);
              setShowForm((s) => !s);
              setFeedbackMsg(null);
            }}
          >
            {showForm ? 'Ver reseñas' : 'Escribir una reseña'}
          </button>
        ) : (
          <span className="reviews-session-badge">
            ✓ Ya dejaste tu reseña en esta sesión
          </span>
        )}

        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleCopyClientLink}
          title="Copiá este link para mandarlo por WhatsApp a tus clientes"
        >
          {copiedLink ? <Check size={15} /> : <Copy size={15} />}
          {copiedLink ? '¡Link copiado!' : 'Link para clientes (?resena=1)'}
        </button>
      </div>

      {feedbackMsg && <p className="review-feedback">{feedbackMsg}</p>}

      {/* Own review card with Edit & Delete controls */}
      {ownReview && !isEditing && (
        <article className="review-card review-card--own">
          <div className="review-card__own-header">
            <span className="review-own-badge">
              Tu reseña · {ownReview.approved ? 'Publicada' : 'Pendiente de aprobación'}
            </span>
            <div className="review-own-actions">
              {!confirmDelete ? (
                <>
                  <button
                    type="button"
                    className="review-action-btn"
                    onClick={startEditing}
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    className="review-action-btn review-action-btn--danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} />
                    <span>Borrar</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="review-action-btn review-action-btn--danger-solid"
                    disabled={deleting}
                    onClick={handleDeleteOwnReview}
                  >
                    {deleting ? 'Borrando...' : 'Sí, borrar'}
                  </button>
                  <button
                    type="button"
                    className="review-action-btn"
                    onClick={() => setConfirmDelete(false)}
                  >
                    <X size={14} />
                    <span>Cancelar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="review-card__stars" aria-label={`${ownReview.rating} de 5`}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                size={15}
                className={idx < ownReview.rating ? 'star--filled' : 'star--empty'}
                fill={idx < ownReview.rating ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <p className="review-card__comment">"{ownReview.comment}"</p>
          <div className="review-card__author">
            <strong>{ownReview.author_name}</strong>
            <span>
              {[ownReview.company, ownReview.project_name].filter(Boolean).join(' · ')}
            </span>
          </div>
        </article>
      )}

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form__row">
            <label>
              Tu nombre *
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                placeholder="Ej: Martín Gómez"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </label>
            <label>
              Empresa / Emprendimiento
              <input
                type="text"
                maxLength={80}
                placeholder="Ej: Café Sur"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
          </div>

          <div className="review-form__row">
            <label>
              Proyecto que realizamos
              <input
                type="text"
                maxLength={80}
                placeholder="Ej: Página web / App"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </label>
            <div className="rating-picker">
              <span>Calificación</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`star-btn ${n <= rating ? 'star-btn--active' : ''}`}
                    aria-label={`${n} estrellas`}
                  >
                    <Star size={20} fill={n <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label>
            ¿Cómo fue tu experiencia trabajando conmigo? *
            <textarea
              required
              minLength={5}
              maxLength={600}
              rows={3}
              placeholder="Contá brevemente qué te pareció el resultado..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>

          <div className="review-form__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              <Send size={15} />
              {submitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Enviar reseña'}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={cancelForm}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <p className="about-bio">Cargando reseñas...</p>
      ) : (
        <div className="reviews-grid">
          {publicReviews.map((rev) => (
            <article key={rev.id} className="review-card">
              <div className="review-card__stars" aria-label={`${rev.rating} de 5`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={15}
                    className={idx < rev.rating ? 'star--filled' : 'star--empty'}
                    fill={idx < rev.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="review-card__comment">"{rev.comment}"</p>
              <div className="review-card__author">
                <strong>{rev.author_name}</strong>
                <span>
                  {[rev.company, rev.project_name].filter(Boolean).join(' · ')}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
