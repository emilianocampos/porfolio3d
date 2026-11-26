import {
  Cpu,
  FolderKanban,
  Heart,
  Mail,
  Newspaper,
  RotateCcw,
  Star,
  User,
  Video,
} from 'lucide-react';
import { type InteractiveZone, ZONES, type ZoneId } from '../../data/portfolioData';

interface HUDProps {
  activeZone: InteractiveZone | null;
  modalOpen: boolean;
  onlineCount: number;
  onNavigateZone: (id: ZoneId) => void;
  onOpenSection: (id: ZoneId) => void;
  onResetProps: () => void;
  onSendEmote: (emoji: string) => void;
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
};

const QUICK_EMOTES = ['👋', '🔥', '🚀', '👏'];

export function HUD({
  activeZone,
  modalOpen,
  onlineCount,
  onNavigateZone,
  onOpenSection,
  onResetProps,
  onSendEmote,
}: HUDProps) {
  return (
    <div className="hud">
      {/* Top Quick Navigation */}
      <header className="hud__topbar">
        <div className="hud__brand">
          <span className="hud__brand-dot hud__brand-dot--live" />
          <span>{onlineCount} en la oficina</span>
        </div>

        <nav className="hud__nav" aria-label="Navegación rápida">
          {ZONES.map((zone) => {
            const Icon = ZONE_ICONS[zone.id];
            const isNear = activeZone?.id === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onNavigateZone(zone.id)}
                className={`hud__nav-btn ${isNear ? 'hud__nav-btn--active' : ''}`}
                title={`Ir a ${zone.title}`}
              >
                <Icon size={15} />
                <span>{zone.title}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onResetProps}
            className="hud__nav-btn"
            title="Reacomodar objetos tirados (R)"
          >
            <RotateCcw size={15} />
          </button>
        </nav>
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
            <kbd>E</kbd> Interactuar
          </span>
          <span>
            <kbd>R</kbd> Reacomodar objetos
          </span>
        </div>
      )}
    </div>
  );
}
