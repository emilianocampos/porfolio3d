import { useState } from 'react';
import { ExternalLink, Film, Newspaper, PlayCircle } from 'lucide-react';
import { PRESS_MEDIA } from '../../data/portfolioData';

export function PressSection() {
  const [videoMissing, setVideoMissing] = useState(false);

  return (
    <div className="press-section">
      {/* Hero linked to the Pets App */}
      <div className="press-hero">
        <div className="press-hero__text">
          <span className="press-badge">
            <Newspaper size={14} /> Proyecto destacado en prensa
          </span>
          <h3>{PRESS_MEDIA.projectTitle}</h3>
          <p>{PRESS_MEDIA.projectSummary}</p>
        </div>

        <div className="press-hero__actions">
          <a
            href={PRESS_MEDIA.socialVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn--primary"
          >
            <PlayCircle size={16} />
            {PRESS_MEDIA.socialVideoLabel}
          </a>
          <a
            href={PRESS_MEDIA.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn--ghost"
          >
            <ExternalLink size={15} />
            Ver App de Mascotas
          </a>
        </div>
      </div>

      {/* Recorded Video Player */}
      <div className="press-video-box">
        <div className="press-video-box__header">
          <Film size={16} />
          <strong>Video en los medios</strong>
        </div>

        {!videoMissing ? (
          <video
            className="press-video"
            controls
            playsInline
            preload="metadata"
            src={PRESS_MEDIA.localVideoUrl}
            onError={() => setVideoMissing(true)}
          />
        ) : (
          <div className="press-video-placeholder">
            <Film size={28} />
            <p>
              Guardá tu video grabado en <code>public/press/video-medios.mp4</code>{' '}
              (o pasámelo por el chat) y aparecerá listo para reproducirse acá.
            </p>
          </div>
        )}
      </div>

      {/* Media Appearances Cards */}
      <div className="press-grid">
        {PRESS_MEDIA.appearances.map((item) => (
          <article key={item.id} className="press-card">
            <div className="press-card__img-wrap">
              <img
                src={item.imageUrl}
                alt={item.outlet}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="press-card__fallback">{item.outlet}</span>
            </div>
            <div className="press-card__body">
              <span className="press-card__role">{item.role}</span>
              <h4>{item.outlet}</h4>
              <p>{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
