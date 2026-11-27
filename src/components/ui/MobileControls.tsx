import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Grab, Hand, Send, Zap } from 'lucide-react';
import type { InteractiveZone, ZoneId } from '../../data/portfolioData';
import { grabState, mobileInput, resetMobileInput } from '../../state/inputState';

interface MobileControlsProps {
  activeZone: InteractiveZone | null;
  modalOpen: boolean;
  onOpenSection: (id: ZoneId) => void;
}

const MAX_RADIUS = 44;

export function MobileControls({
  activeZone,
  modalOpen,
  onOpenSection,
}: MobileControlsProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [grabUi, setGrabUi] = useState({
    held: grabState.heldIndex !== null,
    canGrab: grabState.canGrab,
  });

  useEffect(() => {
    const listener = (held: boolean, canGrab: boolean) => {
      setGrabUi({ held, canGrab });
    };
    grabState.listeners.add(listener);
    return () => {
      grabState.listeners.delete(listener);
    };
  }, []);

  const setKnobTransform = (x: number, y: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  };

  useEffect(() => {
    if (modalOpen) {
      pointerIdRef.current = null;
      setIsDragging(false);
      setIsSprinting(false);
      setKnobTransform(0, 0);
      resetMobileInput();
    }
  }, [modalOpen]);

  useEffect(() => {
    mobileInput.sprint = isSprinting;
  }, [isSprinting]);

  const updateFromClientPos = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS;
      dy = (dy / dist) * MAX_RADIUS;
    }

    setKnobTransform(dx, dy);

    const normX = dx / MAX_RADIUS;
    const normZ = dy / MAX_RADIUS;
    const mag = Math.hypot(normX, normZ);

    // Small deadzone so tiny thumb drift doesn't move the character
    if (mag < 0.12) {
      mobileInput.moveX = 0;
      mobileInput.moveZ = 0;
    } else {
      mobileInput.moveX = normX;
      mobileInput.moveZ = normZ;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    setKnobTransform(0, 0);
    mobileInput.moveX = 0;
    mobileInput.moveZ = 0;
  };

  if (modalOpen) return null;

  return (
    <div className="mobile-controls" aria-label="Controles táctiles">
      {/* Left Virtual Joystick */}
      <div
        ref={baseRef}
        className={`joystick-base ${isDragging ? 'joystick-base--active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="joystick-ring" />
        <div ref={knobRef} className="joystick-knob" />
      </div>

      {/* Right Action Buttons */}
      <div className="mobile-actions">
        {activeZone && (
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--interact"
            style={{ ['--zone-color' as string]: activeZone.color }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenSection(activeZone.id);
            }}
            aria-label={activeZone.actionLabel}
          >
            <Hand size={22} />
            <span>Abrir</span>
          </button>
        )}

        {(grabUi.held || grabUi.canGrab) && (
          <button
            type="button"
            className={`mobile-action-btn ${
              grabUi.held ? 'mobile-action-btn--throw' : 'mobile-action-btn--grab'
            }`}
            onPointerDown={(e) => {
              e.stopPropagation();
              grabState.grabRequested = true;
            }}
            aria-label={grabUi.held ? 'Tirar objeto' : 'Agarrar objeto'}
          >
            {grabUi.held ? <Send size={20} /> : <Grab size={20} />}
            <span>{grabUi.held ? 'Tirar' : 'Agarrar'}</span>
          </button>
        )}

        <div className="mobile-actions__row">
          <button
            type="button"
            className={`mobile-action-btn mobile-action-btn--sprint ${isSprinting ? 'mobile-action-btn--sprint-active' : ''
              }`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsSprinting((prev) => !prev);
            }}
            aria-label="Correr"
            aria-pressed={isSprinting}
          >
            <Zap size={20} fill={isSprinting ? 'currentColor' : 'none'} />
            <span>Correr</span>
          </button>

          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--jump"
            onPointerDown={(e) => {
              e.stopPropagation();
              mobileInput.jumpRequested = true;
            }}
            aria-label="Saltar"
          >
            <ArrowUp size={22} />
            <span>Saltar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
