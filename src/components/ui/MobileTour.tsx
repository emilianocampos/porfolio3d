import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const TOUR_SEEN_KEY = 'portfolio_3d_mobile_tour_v1';

interface TourStep {
  id: 'joystick' | 'orbit' | 'pinch' | 'actions';
  title: string;
  description: string;
  targetSelector?: string;
}

const STEPS: TourStep[] = [
  {
    id: 'joystick',
    title: '1. Mové tu robot',
    description:
      'Usá el joystick izquierdo con el pulgar para caminar por toda la oficina 3D y chocar objetos.',
    targetSelector: '.joystick-base',
  },
  {
    id: 'orbit',
    title: '2. Girá la cámara 360°',
    description:
      'Deslizá 1 dedo sobre la pantalla hacia los costados o hacia arriba/abajo para rotar la cámara (¡hasta vista aérea de 90°!).',
  },
  {
    id: 'pinch',
    title: '3. Acercá y alejá (Zoom)',
    description:
      'Usá 2 dedos en pinza (pellizcar / separar) en cualquier parte del mapa para hacer zoom in o zoom out.',
  },
  {
    id: 'actions',
    title: '4. Correr, Saltar y Abrir',
    description:
      'Tocá ⚡ Correr para ir rápido, ⬆ Saltar para subir a mesas o explotar el dron, y ✋ Abrir al acercarte a una compu.',
    targetSelector: '.mobile-actions',
  },
];

/** Stylized cyan/white SVG robotic hand used in gesture animations */
function RobotHandSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`tour-robo-hand ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Wrist cuff */}
      <rect x="20" y="47" width="24" height="11" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="32" cy="52.5" r="2.2" fill="#38bdf8" />
      {/* Palm */}
      <rect x="17" y="25" width="30" height="23" rx="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
      {/* Index finger extended (touching) */}
      <rect x="23" y="6" width="9" height="22" rx="4.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="27.5" cy="11" r="2.5" fill="#38bdf8" />
      {/* Other folded mechanical fingers */}
      <rect x="33" y="18" width="7" height="11" rx="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
      <rect x="40" y="20" width="7" height="10" rx="3" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
      {/* Thumb */}
      <rect x="11" y="29" width="8" height="13" rx="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
      {/* Glowing tech knuckle line */}
      <line x1="23" y1="36" x2="41" y2="36" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

interface MobileTourProps {
  open: boolean;
  onClose: () => void;
}

export function shouldAutoOpenMobileTour(): boolean {
  if (typeof window === 'undefined') return false;
  const isTouchOrMobile =
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
  if (!isTouchOrMobile) return false;
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export function MobileTour({ open, onClose }: MobileTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);

  const step = STEPS[stepIdx];

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updateRect = () => {
      if (!step.targetSelector) {
        setSpotRect(null);
        return;
      }
      const el = document.querySelector(step.targetSelector);
      if (el) {
        setSpotRect(el.getBoundingClientRect());
      } else {
        setSpotRect(null);
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [open, step.targetSelector]);

  if (!open) return null;

  const finishTour = () => {
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, '1');
    } catch {
      // ignore storage errors
    }
    onClose();
  };

  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Guía de controles">
      {/* Driver.js-style spotlight cutout over target element, or full dim backdrop */}
      {spotRect ? (
        <div
          className="tour-spotlight"
          style={{
            top: spotRect.top - 10,
            left: spotRect.left - 10,
            width: spotRect.width + 20,
            height: spotRect.height + 20,
          }}
        />
      ) : (
        <div className="tour-backdrop" />
      )}

      {/* Animated Robotic Hand Demonstration Stage (for Orbit & Pinch steps) */}
      {step.id === 'orbit' && (
        <div className="tour-gesture-stage" aria-hidden="true">
          <div className="tour-swipe-track">
            <span className="tour-swipe-arrow tour-swipe-arrow--left">◀</span>
            <span className="tour-swipe-line" />
            <span className="tour-swipe-arrow tour-swipe-arrow--right">▶</span>
          </div>
          <div className="tour-hand-orbit-anim">
            <span className="tour-touch-ripple" />
            <RobotHandSvg />
          </div>
        </div>
      )}

      {step.id === 'pinch' && (
        <div className="tour-gesture-stage" aria-hidden="true">
          <div className="tour-pinch-ring" />
          <div className="tour-hand-pinch-left">
            <span className="tour-touch-ripple" />
            <RobotHandSvg />
          </div>
          <div className="tour-hand-pinch-right">
            <span className="tour-touch-ripple" />
            <RobotHandSvg />
          </div>
        </div>
      )}

      {/* Driver.js-style Popover Card */}
      <div className="tour-popover">
        <div className="tour-popover__header">
          <span className="tour-popover__badge">
            🤖 Guía · Paso {stepIdx + 1} de {STEPS.length}
          </span>
          <button
            type="button"
            className="tour-popover__close"
            onClick={finishTour}
            aria-label="Cerrar guía"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="tour-popover__title">{step.title}</h3>
        <p className="tour-popover__desc">{step.description}</p>

        <div className="tour-popover__footer">
          <div className="tour-dots">
            {STEPS.map((s, idx) => (
              <span
                key={s.id}
                className={`tour-dot ${idx === stepIdx ? 'tour-dot--active' : ''}`}
              />
            ))}
          </div>

          <div className="tour-popover__actions">
            {stepIdx > 0 ? (
              <button
                type="button"
                className="tour-btn tour-btn--ghost"
                onClick={() => setStepIdx((n) => n - 1)}
              >
                <ChevronLeft size={15} />
                Atrás
              </button>
            ) : (
              <button
                type="button"
                className="tour-btn tour-btn--ghost"
                onClick={finishTour}
              >
                Omitir
              </button>
            )}

            <button
              type="button"
              className="tour-btn tour-btn--primary"
              onClick={() => {
                if (isLast) finishTour();
                else setStepIdx((n) => n + 1);
              }}
            >
              {isLast ? '¡Listo, a explorar!' : 'Siguiente'}
              {!isLast && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
