import { useEffect, useRef } from 'react';
import { Navigation } from 'lucide-react';
import { ZONES, type ZoneId } from '../../data/portfolioData';
import { waypointScreenMap } from '../../state/inputState';

interface RealtimeWaypointsProps {
  modalOpen: boolean;
  onNavigateZone: (id: ZoneId) => void;
}

export function RealtimeWaypoints({
  modalOpen,
  onNavigateZone,
}: RealtimeWaypointsProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const distRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const arrowRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const calloutRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (modalOpen) return;
    let rafId = 0;

    const tick = () => {
      for (const zone of ZONES) {
        const data = waypointScreenMap[zone.id];
        const el = itemRefs.current[zone.id];
        const distEl = distRefs.current[zone.id];
        const arrowEl = arrowRefs.current[zone.id];
        const calloutEl = calloutRefs.current[zone.id];

        if (!el) continue;

        el.style.transform = `translate3d(${data.screenX.toFixed(1)}px, ${data.screenY.toFixed(1)}px, 0) translate(-50%, -50%)`;
        el.dataset.offscreen = data.isOffscreen ? 'true' : 'false';
        el.dataset.inside = data.isInside ? 'true' : 'false';

        if (distEl) {
          distEl.textContent = data.isInside
            ? '¡Aquí!'
            : `${data.distance.toFixed(1)}m`;
        }

        if (arrowEl) {
          // Lucide Navigation icon points ~45deg up-right by default; align to screen angle
          const deg = (data.angleRad * 180) / Math.PI + 45;
          arrowEl.style.transform = `rotate(${deg.toFixed(1)}deg)`;
        }

        if (calloutEl) {
          calloutEl.textContent = data.isInside
            ? 'Tocá E para entrar'
            : zone.callout;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [modalOpen]);

  if (modalOpen) return null;

  return (
    <div className="waypoints-layer" aria-label="Etiquetas interactivas en tiempo real">
      {ZONES.map((zone) => (
        <button
          key={zone.id}
          ref={(el) => {
            itemRefs.current[zone.id] = el;
          }}
          type="button"
          className="waypoint-tag"
          style={{ ['--zone-color' as string]: zone.color }}
          onClick={() => onNavigateZone(zone.id)}
        >
          <span className="waypoint-tag__pulse" />
          <span
            ref={(el) => {
              arrowRefs.current[zone.id] = el;
            }}
            className="waypoint-tag__arrow"
          >
            <Navigation size={13} fill="currentColor" />
          </span>

          <div className="waypoint-tag__content">
            <div className="waypoint-tag__top">
              <strong>{zone.title}</strong>
              <span
                ref={(el) => {
                  distRefs.current[zone.id] = el;
                }}
                className="waypoint-tag__dist"
              >
                0.0m
              </span>
            </div>
            <span
              ref={(el) => {
                calloutRefs.current[zone.id] = el;
              }}
              className="waypoint-tag__callout"
            >
              {zone.callout}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
