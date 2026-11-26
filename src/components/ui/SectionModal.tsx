import { Briefcase, Code2, ExternalLink, Heart, Mail, MapPin, MessageCircle, Video, X } from 'lucide-react';
import {
  ABOUT_INFO,
  CONTACT_INFO,
  CREATOR_INFO,
  PROJECTS,
  SKILLS_GROUPS,
  type ZoneId,
} from '../../data/portfolioData';
import { PressSection } from './PressSection';
import { ReviewsSection } from './ReviewsSection';

interface SectionModalProps {
  section: ZoneId | null;
  openReviewForm?: boolean;
  likesCount: number;
  hasLiked: boolean;
  liking: boolean;
  onGiveLike: () => void;
  onClose: () => void;
}

export function SectionModal({
  section,
  openReviewForm = false,
  likesCount,
  hasLiked,
  liking,
  onGiveLike,
  onClose,
}: SectionModalProps) {
  if (!section) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">
              {section === 'projects' && 'Escritorio Dev · Proyectos'}
              {section === 'creator' && 'Setup Streamer · Creador de Contenido'}
              {section === 'about' && 'Zona Lounge · Sobre Mí'}
              {section === 'skills' && 'Pizarra & Stack · Skills'}
              {section === 'press' && 'Muro de Prensa · Mascotas Perdidas'}
              {section === 'reviews' && 'Muro de Clientes · Reseñas'}
              {section === 'likes' && 'Contador LED en Vivo · Apoyo'}
              {section === 'contact' && 'Recepción · Contacto'}
            </span>
            <h2>
              {section === 'projects' && 'Mis Proyectos'}
              {section === 'creator' && 'Creación de Contenido · Fútbol'}
              {section === 'about' && ABOUT_INFO.name}
              {section === 'skills' && 'Stack & Habilidades'}
              {section === 'press' && 'Mi Paso por los Medios'}
              {section === 'reviews' && 'Reseñas de Clientes'}
              {section === 'likes' && 'Dejá tu Me Gusta'}
              {section === 'contact' && '¡Hablemos!'}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {section === 'projects' && (
            <div className="projects-grid">
              {PROJECTS.map((project) => (
                <article key={project.id} className="project-card">
                  <div
                    className="project-card__banner"
                    style={{ background: project.gradient }}
                  />
                  <div className="project-card__content">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="tag-list">
                      {project.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="project-card__actions">
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--primary"
                      >
                        <ExternalLink size={15} />
                        Ver Demo
                      </a>
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--ghost"
                      >
                        <Code2 size={15} />
                        Código
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {section === 'creator' && (
            <div className="creator-section">
              <div className="creator-hero">
                <div className="creator-hero__badge">
                  <Video size={14} />
                  <span>⚽ {CREATOR_INFO.niche}</span>
                </div>
                <div className="creator-hero__stat">
                  <strong>{CREATOR_INFO.totalAudience}</strong>
                  <span>seguidores totales en comunidad</span>
                </div>
                <p>{CREATOR_INFO.bio}</p>
              </div>

              <div className="creator-socials-grid">
                {CREATOR_INFO.socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="creator-social-card"
                    style={{ ['--social-color' as string]: social.color }}
                  >
                    <div className="creator-social-card__top">
                      <span className="creator-social-card__dot" />
                      <strong>{social.platform}</strong>
                      <ExternalLink size={14} className="creator-social-card__ext" />
                    </div>
                    <div className="creator-social-card__count">
                      {social.followers}
                    </div>
                    <span className="creator-social-card__label">
                      {social.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {section === 'about' && (
            <div className="about-section">
              <p className="about-role">{ABOUT_INFO.role}</p>
              <p className="about-bio">{ABOUT_INFO.bio}</p>
              <h3>En los medios</h3>
              <div className="tag-list">
                {ABOUT_INFO.press.map((media) => (
                  <span key={media} className="tag tag--lg">
                    📰 {media}
                  </span>
                ))}
              </div>
              <h3>Tecnologías principales</h3>
              <div className="tag-list">
                {ABOUT_INFO.skills.map((skill) => (
                  <span key={skill} className="tag tag--lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section === 'skills' && (
            <div className="projects-grid">
              {SKILLS_GROUPS.map((group) => (
                <article key={group.category} className="project-card">
                  <div className="project-card__content">
                    <h3>{group.category}</h3>
                    <div className="tag-list">
                      {group.items.map((item) => (
                        <span key={item} className="tag tag--lg">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {section === 'press' && <PressSection />}

          {section === 'reviews' && (
            <ReviewsSection defaultOpenForm={openReviewForm} />
          )}

          {section === 'likes' && (
            <div className="likes-section">
              <div className="likes-digital-board">
                <span className="likes-digital-board__label">
                  ♥ CONTADOR DIGITAL EN VIVO
                </span>
                <div className="likes-digital-board__digits">
                  {String(Math.max(0, likesCount)).padStart(5, '0')}
                </div>
                <span className="likes-digital-board__hint">
                  Cada Me Gusta actualiza al instante el tablero LED en la pared 3D
                </span>
              </div>

              <button
                type="button"
                className={`likes-cta-btn ${hasLiked ? 'likes-cta-btn--liked' : ''}`}
                disabled={hasLiked || liking}
                onClick={onGiveLike}
              >
                <Heart size={22} fill={hasLiked ? 'currentColor' : 'none'} />
                <span>
                  {hasLiked
                    ? '¡Gracias por tu Me Gusta!'
                    : liking
                      ? 'Sumando...'
                      : 'Dejar mi Me Gusta'}
                </span>
              </button>
            </div>
          )}

          {section === 'contact' && (
            <div className="contact-section">
              <p className="about-bio">
                ¿Tenés una idea, propuesta laboral o proyecto freelance? Escribime
                por cualquiera de estos medios:
              </p>

              <div className="contact-links">
                <a
                  href={CONTACT_INFO.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-item"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp · ¡Charlemos sobre tu proyecto!</span>
                </a>
                <a href={`mailto:${CONTACT_INFO.email}`} className="contact-item">
                  <Mail size={18} />
                  <span>{CONTACT_INFO.email}</span>
                </a>
                <a
                  href={CONTACT_INFO.github}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-item"
                >
                  <Code2 size={18} />
                  <span>GitHub</span>
                </a>
                <a
                  href={CONTACT_INFO.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-item"
                >
                  <Briefcase size={18} />
                  <span>LinkedIn</span>
                </a>
                <div className="contact-item contact-item--static">
                  <MapPin size={18} />
                  <span>{CONTACT_INFO.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span>
            Presioná <kbd>ESC</kbd> para volver al mapa 3D
          </span>
        </div>
      </div>
    </div>
  );
}
