import { useEffect, useState } from 'react';
import { Check, Copy, Send, Star } from 'lucide-react';
import { DEMO_REVIEWS, type ReviewItem } from '../../data/portfolioData';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface ReviewsSectionProps {
  defaultOpenForm?: boolean;
}

export function ReviewsSection({ defaultOpenForm = false }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(DEMO_REVIEWS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(defaultOpenForm);

  const [authorName, setAuthorName] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let cancelled = false;

    const loadReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase!
        .from('reviews')
        .select('id, author_name, company, project_name, rating, comment, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (!cancelled && !error && data) {
        setReviews(data.length > 0 ? data : DEMO_REVIEWS);
      }
      if (!cancelled) setLoading(false);
    };

    loadReviews();

    // Realtime subscription: newly approved reviews pop in live!
    const channel = supabase
      .channel('reviews-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase?.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authorName.trim().length < 2 || comment.trim().length < 5) return;

    setSubmitting(true);
    setFeedbackMsg(null);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('reviews').insert({
        author_name: authorName.trim(),
        company: company.trim(),
        project_name: projectName.trim(),
        rating,
        comment: comment.trim(),
        approved: false,
      });

      if (error) {
        setFeedbackMsg('No se pudo enviar la reseña. Verificá tu conexión.');
      } else {
        setFeedbackMsg(
          '¡Gracias por tu reseña! Fue enviada y aparecerá publicada apenas la apruebe.'
        );
        setAuthorName('');
        setCompany('');
        setProjectName('');
        setComment('');
        setRating(5);
      }
    } else {
      // Demo preview mode before .env is configured
      const localItem: ReviewItem = {
        id: `local-${Date.now()}`,
        author_name: authorName.trim(),
        company: company.trim(),
        project_name: projectName.trim(),
        rating,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [localItem, ...prev]);
      setFeedbackMsg(
        '¡Reseña agregada en modo vista previa! Cuando pegues tus claves en .env se guardará en Supabase.'
      );
      setAuthorName('');
      setCompany('');
      setProjectName('');
      setComment('');
      setRating(5);
    }

    setSubmitting(false);
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

  return (
    <div className="reviews-section">
      <div className="reviews-toolbar">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? 'Ver reseñas' : 'Escribir una reseña'}
        </button>

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

      {!isSupabaseConfigured && (
        <p className="reviews-notice">
          Modo demo local · Pegá tus claves en <code>.env</code> y corré{' '}
          <code>supabase/schema.sql</code> para activar reseñas y multijugador en
          tiempo real.
        </p>
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
                placeholder="Ej: Martín Gómez"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </label>
            <label>
              Empresa / Emprendimiento
              <input
                type="text"
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
              rows={3}
              placeholder="Contá brevemente qué te pareció el resultado..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>

          {feedbackMsg && <p className="review-feedback">{feedbackMsg}</p>}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            <Send size={15} />
            {submitting ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="about-bio">Cargando reseñas...</p>
      ) : (
        <div className="reviews-grid">
          {reviews.map((rev) => (
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
