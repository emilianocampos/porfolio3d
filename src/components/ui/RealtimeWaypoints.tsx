import { useEffect, useRef } from 'react';
import { Navigation } from 'lucide-react';
import { ZONES, type ZoneId } from '../../data/portfolioData';
import { waypointScreenMap } from '../../state/inputState';

interface RealtimeWaypointsProps {
  modalOpen: boolean;
  onNavigateZone: (id: ZoneId) => void;
}

interface CachedDomState {
  offscreen: boolean | null;
  inside: boolean | null;
  distText: string;
  calloutText: string;
  deg: number;
}

export function RealtimeWaypoints({
  modalOpen,
  onNavigateZone,
}: RealtimeWaypointsProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const distRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const arrowRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const calloutRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const cacheRef = useRef<Record<string, CachedDomState>>({});

  useEffect(() => {
    if (modalOpen) return;
    // Reset DOM cache whenever buttons mount/remount so first frame always syncs everything
    cacheRef.current = {};
    let rafId = 0;

    const tick = () => {
      const cache = cacheRef.current;

      for (let i = 0; i < ZONES.length; i++) {
        const zone = ZONES[i];
        const data = waypointScreenMap[zone.id];
        const el = itemRefs.current[zone.id];
        if (!el || !data) continue;

        let prev = cache[zone.id];
        if (!prev) {
          prev = {
            offscreen: null,
            inside: null,
            distText: '',
            calloutText: '',
            deg: -9999,
          };
          cache[zone.id] = prev;
        }

        // Always keep 3D-projected screen position smoothly synced at 60fps
        el.style.transform = `translate3d(${data.screenX.toFixed(1)}px, ${data.screenY.toFixed(1)}px, 0) translate(-50%, -50%)`;

        // Only mutate dataset attributes & textContent when they actually change
        if (data.isOffscreen !== prev.offscreen) {
          prev.offscreen = data.isOffscreen;
          el.dataset.offscreen = data.isOffscreen ? 'true' : 'false';
        }
        if (data.isInside !== prev.inside) {
          prev.inside = data.isInside;
          el.dataset.inside = data.isInside ? 'true' : 'false';
        }

        const nextDistText = data.isInside
          ? '¡Aquí!'
          : `${data.distance.toFixed(1)}m`;
        if (nextDistText !== prev.distText) {
          prev.distText = nextDistText;
          const distEl = distRefs.current[zone.id];
          if (distEl) distEl.textContent = nextDistText;
        }

        const deg = Math.round((data.angleRad * 180) / Math.PI + 45);
        if (deg !== prev.deg) {
          prev.deg = deg;
          const arrowEl = arrowRefs.current[zone.id];
          if (arrowEl) arrowEl.style.transform = `rotate(${deg}deg)`;
        }

        const nextCallout = data.isInside ? 'Tocá E para entrar' : zone.callout;
        if (nextCallout !== prev.calloutText) {
          prev.calloutText = nextCallout;
          const calloutEl = calloutRefs.current[zone.id];
          if (calloutEl) calloutEl.textContent = nextCallout;
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
