import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Hand } from 'lucide-react';
import type { InteractiveZone, ZoneId } from '../../data/portfolioData';
import { mobileInput, resetMobileInput } from '../../state/inputState';

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
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      pointerIdRef.current = null;
      setIsDragging(false);
      setKnobOffset({ x: 0, y: 0 });
      resetMobileInput();
    }
  }, [modalOpen]);

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

    setKnobOffset({ x: dx, y: dy });

    const normX = dx / MAX_RADIUS;
    const normZ = dy / MAX_RADIUS;
    const mag = Math.hypot(normX, normZ);

    // Small deadzone so tiny thumb drift doesn't move the character
    if (mag < 0.12) {
      mobileInput.moveX = 0;
      mobileInput.moveZ = 0;
      mobileInput.sprint = false;
    } else {
      mobileInput.moveX = normX;
      mobileInput.moveZ = normZ;
      mobileInput.sprint = mag > 0.85;
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
    setKnobOffset({ x: 0, y: 0 });
    mobileInput.moveX = 0;
    mobileInput.moveZ = 0;
    mobileInput.sprint = false;
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
        <div
          className="joystick-knob"
          style={{
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
        />
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
  );
}
