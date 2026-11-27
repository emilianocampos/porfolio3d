import { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  FolderKanban,
  Gamepad2,
  Heart,
  HelpCircle,
  Mail,
  Menu,
  Newspaper,
  RotateCcw,
  Star,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { type InteractiveZone, ZONES, type ZoneId } from '../../data/portfolioData';
import { grabState } from '../../state/inputState';

interface HUDProps {
  activeZone: InteractiveZone | null;
  modalOpen: boolean;
  onlineCount: number;
  onNavigateZone: (id: ZoneId) => void;
  onOpenSection: (id: ZoneId) => void;
  onResetProps: () => void;
  onOpenTour: () => void;
  onSendEmote: (emoji: string) => void;
  audioMuted: boolean;
  audioPlaying: boolean;
  onToggleAudio: () => void;
}

const ZONE_ICONS: Record<ZoneId, typeof FolderKanban> = {
  projects: FolderKanban,
  creator: Video,
  about: User,
  skills: Cpu,
  press: Newspaper,
  reviews: Star,
  likes: Heart,
  contact: Mail,
  minigame: Gamepad2,
};

const QUICK_EMOTES = ['👋', '🔥', '🚀', '👏'];

export function HUD({
  activeZone,
  modalOpen,
  onlineCount,
  onNavigateZone,
  onOpenSection,
  onResetProps,
  onOpenTour,
  onSendEmote,
  audioMuted,
  audioPlaying,
  onToggleAudio,
}: HUDProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [grabUi, setGrabUi] = useState({
    held: grabState.heldIndex !== null,
    canGrab: grabState.canGrab,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (held: boolean, canGrab: boolean) => {
      setGrabUi({ held, canGrab });
    };
    grabState.listeners.add(listener);
    return () => {
      grabState.listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (modalOpen) setMenuOpen(false);
  }, [modalOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <div className="hud">
      {/* Top Bar: Live indicator (left) + Centered Hamburger Menu (desktop & mobile) */}
      <header className="hud__topbar">
        <div className="hud__brand">
          <span className="hud__brand-dot hud__brand-dot--live" />
          <span>{onlineCount} en la oficina</span>
        </div>

        <div className="hud__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`hud__menu-btn ${menuOpen ? 'hud__menu-btn--open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{menuOpen ? 'Cerrar' : 'Menú'}</span>
          </button>

          {menuOpen && (
            <nav className="hud__menu-panel" aria-label="Navegación rápida">
              <div className="hud__menu-grid">
                {ZONES.map((zone) => {
                  const Icon = ZONE_ICONS[zone.id];
                  const isNear = activeZone?.id === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigateZone(zone.id);
                      }}
                      className={`hud__menu-item ${isNear ? 'hud__menu-item--active' : ''}`}
                      style={{ ['--zone-color' as string]: zone.color }}
                    >
                      <Icon size={16} />
                      <span>{zone.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hud__menu-actions">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onResetProps();
                  }}
                  className="hud__menu-action-btn"
                  title="Reacomodar objetos tirados (R)"
                >
                  <RotateCcw size={15} />
                  <span>Reacomodar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenTour();
                  }}
                  className="hud__menu-action-btn"
                  title="Cómo moverte y girar la cámara"
                >
                  <HelpCircle size={15} />
                  <span>Guía</span>
                </button>
              </div>
            </nav>
          )}
        </div>

        <button
          type="button"
          className={`hud__audio-btn ${audioPlaying ? 'hud__audio-btn--playing' : ''}`}
          onClick={onToggleAudio}
          title={
            audioPlaying
              ? 'Silenciar bienvenida'
              : 'Escuchar audio de bienvenida'
          }
          aria-label={
            audioPlaying
              ? 'Silenciar audio de bienvenida'
              : 'Reproducir audio de bienvenida'
          }
        >
          {audioMuted && !audioPlaying ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
      </header>

      {/* Live Emote Bar */}
      {!modalOpen && (
        <div className="hud__emotes-wrap">
          <div className="hud__emotes" aria-label="Reacciones en vivo">
            {QUICK_EMOTES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="hud__emote-btn"
                onClick={() => onSendEmote(emoji)}
                title={`Enviar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Interact Prompt ([E]) */}
      {activeZone && !modalOpen && (
        <div className="hud__prompt-wrap">
          <button
            type="button"
            className="hud__prompt"
            onClick={() => onOpenSection(activeZone.id)}
            style={{ ['--zone-color' as string]: activeZone.color }}
          >
            <kbd className="hud__prompt-key">E</kbd>
            <div className="hud__prompt-text">
              <strong>{activeZone.actionLabel}</strong>
              <span>{activeZone.subtitle}</span>
            </div>
          </button>
        </div>
      )}

      {/* Contextual Grab / Throw Prompt ([F]) */}
      {!modalOpen && (grabUi.held || grabUi.canGrab) && (
        <div className="hud__grab-wrap">
          <button
            type="button"
            className={`hud__grab-btn ${grabUi.held ? 'hud__grab-btn--throw' : ''}`}
            onClick={() => {
              grabState.grabRequested = true;
            }}
          >
            <kbd className="hud__grab-key">F</kbd>
            <span>{grabUi.held ? '¡Tirar objeto!' : 'Agarrar objeto'}</span>
          </button>
        </div>
      )}

      {/* Bottom Controls Hint */}
      {!modalOpen && (
        <div className="hud__controls">
          <span>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Mover
          </span>
          <span>
            <kbd>Shift</kbd> Correr
          </span>
          <span>
            <kbd>Espacio</kbd> Saltar
          </span>
          <span>
            <kbd>F</kbd> Agarrar / Tirar
          </span>
          <span>
            <kbd>E</kbd> Interactuar
          </span>
          <span>
            <kbd>R</kbd> Reacomodar
          </span>
        </div>
      )}
    </div>
  );
}
