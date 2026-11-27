import { useState } from 'react';
import { ExternalLink, Film, Newspaper, PlayCircle } from 'lucide-react';
import { PRESS_MEDIA } from '../../data/portfolioData';

export function PressSection() {
  const [videoMissing, setVideoMissing] = useState(false);

  return (
    <div className="press-section">
      {/* 1. Hero linked to Mascotas Trelew & Instagram Note */}
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
            Ver Mascotas Trelew
          </a>
        </div>
      </div>

      {/* 2. Media Appearances Cards — right below Proyecto Destacado (2026 mobile-first UX) */}
      <div className="press-grid">
        {PRESS_MEDIA.appearances.map((item) => {
          const isYouTube = item.articleUrl?.includes('youtube.com');
          return (
            <article key={item.id} className="press-card">
              <div className="press-card__img-wrap">
                <img
                  src={item.imageUrl}
                  alt={item.outlet}
                  loading="lazy"
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
                {item.articleUrl && (
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--ghost"
                    style={{ marginTop: 8, alignSelf: 'flex-start', padding: '7px 12px', fontSize: 12.5 }}
                  >
                    {isYouTube ? <PlayCircle size={14} /> : <ExternalLink size={14} />}
                    {isYouTube ? 'Ver entrevista en YouTube' : 'Ver publicación'}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* 3. Optional Recorded Video Player (hidden automatically if not uploaded) */}
      {!videoMissing && (
        <div className="press-video-box">
          <div className="press-video-box__header">
            <Film size={16} />
            <strong>Video en los medios</strong>
          </div>
          <video
            className="press-video"
            controls
            playsInline
            preload="metadata"
            src={PRESS_MEDIA.localVideoUrl}
            onError={() => setVideoMissing(true)}
          />
        </div>
      )}
    </div>
  );
}
