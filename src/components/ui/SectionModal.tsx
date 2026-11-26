import { Briefcase, Code2, ExternalLink, Mail, MapPin, X } from 'lucide-react';
import {
  ABOUT_INFO,
  CONTACT_INFO,
  PROJECTS,
  SKILLS_GROUPS,
  type ZoneId,
} from '../../data/portfolioData';
import { PressSection } from './PressSection';
import { ReviewsSection } from './ReviewsSection';

interface SectionModalProps {
  section: ZoneId | null;
  openReviewForm?: boolean;
  onClose: () => void;
}

export function SectionModal({
  section,
  openReviewForm = false,
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
              {section === 'about' && 'Zona Lounge · Sobre Mí'}
              {section === 'skills' && 'Pizarra & Stack · Skills'}
              {section === 'press' && 'Muro de Prensa · Mascotas Perdidas'}
              {section === 'reviews' && 'Muro de Clientes · Reseñas'}
              {section === 'contact' && 'Recepción · Contacto'}
            </span>
            <h2>
              {section === 'projects' && 'Mis Proyectos'}
              {section === 'about' && ABOUT_INFO.name}
              {section === 'skills' && 'Stack & Habilidades'}
              {section === 'press' && 'Mi Paso por los Medios'}
              {section === 'reviews' && 'Reseñas de Clientes'}
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

          {section === 'contact' && (
            <div className="contact-section">
              <p className="about-bio">
                ¿Tenés una idea, propuesta laboral o proyecto freelance? Escribime
                por cualquiera de estos medios:
              </p>

              <div className="contact-links">
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
