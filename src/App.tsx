import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, SkipForward, Square, Video, X } from 'lucide-react';
import { type InteractiveZone, ZONES, type ZoneId } from './data/portfolioData';
import { grabState, navigationState, realtimeEvents } from './state/inputState';
import { useRealtimeOffice } from './hooks/useRealtimeOffice';
import { usePortfolioLikes } from './hooks/usePortfolioLikes';
import { CINEMA_TOTAL_DURATION, cinemaClock } from './components/3d/CinemaCamera';
import { Scene } from './components/3d/Scene';
import { HUD } from './components/ui/HUD';
import { MobileControls } from './components/ui/MobileControls';
import { MobileTour, shouldAutoOpenMobileTour } from './components/ui/MobileTour';
import { RealtimeWaypoints } from './components/ui/RealtimeWaypoints';
import { SectionModal } from './components/ui/SectionModal';

function hasReviewQueryParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('resena') === '1' || params.get('review') === '1';
}

function hasCinemaQueryParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('cinema');
  return val === '1' || val === '9:16' || val === 'vertical';
}

function hasVerticalCinemaParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const cinema = params.get('cinema');
  const ratio = params.get('ratio');
  return cinema === '9:16' || cinema === 'vertical' || ratio === '9:16' || ratio === 'vertical';
}

const INTRO_SEEN_KEY = 'portfolio_3d_intro_seen_v1';

function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasReviewQueryParam() || hasCinemaQueryParam()) return false;
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export default function App() {
  const initialReviewOpen = hasReviewQueryParam();
  const [cinemaRecording, setCinemaRecording] = useState(() => hasCinemaQueryParam());
  const [introActive, setIntroActive] = useState(() => shouldPlayIntro());
  const cinemaMode = cinemaRecording || introActive;
  const isVerticalCinema = cinemaRecording && hasVerticalCinemaParam();
  const [activeZone, setActiveZone] = useState<InteractiveZone | null>(null);
  const [openSection, setOpenSection] = useState<ZoneId | null>(
    initialReviewOpen ? 'reviews' : null
  );
  const [openReviewForm, setOpenReviewForm] = useState(initialReviewOpen);
  const [resetPropsSignal, setResetPropsSignal] = useState(0);
  const [tourOpen, setTourOpen] = useState(
    () => !initialReviewOpen && !hasCinemaQueryParam() && shouldAutoOpenMobileTour()
  );
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgressSec, setExportProgressSec] = useState(0);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const exportTimerRef = useRef<number | null>(null);
  const anyOverlayOpen = openSection !== null || lightboxImage !== null;
  const hideUi = anyOverlayOpen || cinemaMode;

  // Welcome ElevenLabs voiceover: plays once per session with mobile autoplay-unlock fallback
  useEffect(() => {
    if (cinemaRecording) return;
    const WELCOME_SESSION_KEY = 'portfolio_welcome_played_v1';
    let alreadyPlayed = false;
    try {
      alreadyPlayed = window.sessionStorage.getItem(WELCOME_SESSION_KEY) === '1';
    } catch {
      alreadyPlayed = false;
    }

    const audio = new Audio('/audio/welcome.mp3');
    audio.preload = 'auto';
    audio.volume = 0.88;
    welcomeAudioRef.current = audio;

    const handleEnded = () => setAudioPlaying(false);
    const handlePause = () => setAudioPlaying(false);
    const handlePlay = () => setAudioPlaying(true);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    let unlocked = false;
    const tryPlayOnce = () => {
      if (unlocked || alreadyPlayed || audio.muted) return;
      audio
        .play()
        .then(() => {
          unlocked = true;
          try {
            window.sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
          } catch {
            // ignore storage errors
          }
          window.removeEventListener('pointerdown', tryPlayOnce, true);
          window.removeEventListener('keydown', tryPlayOnce, true);
        })
        .catch(() => {
          // Autoplay blocked until first user tap/keypress — listeners stay active
        });
    };

    if (!alreadyPlayed) {
      tryPlayOnce();
      window.addEventListener('pointerdown', tryPlayOnce, true);
      window.addEventListener('keydown', tryPlayOnce, true);
    }

    return () => {
      window.removeEventListener('pointerdown', tryPlayOnce, true);
      window.removeEventListener('keydown', tryPlayOnce, true);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      welcomeAudioRef.current = null;
    };
  }, [cinemaRecording]);

  const handleToggleWelcomeAudio = useCallback(() => {
    const audio = welcomeAudioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      audio.muted = true;
      setAudioMuted(true);
      return;
    }
    if (audioMuted) {
      audio.muted = false;
      setAudioMuted(false);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      // ignore
    });
  }, [audioMuted, audioPlaying]);

  const stopVideoExport = useCallback(() => {
    if (exportTimerRef.current !== null) {
      window.clearInterval(exportTimerRef.current);
      exportTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const startVideoExport = useCallback(() => {
    if (isExportingVideo) return;
    const canvas = document.querySelector('canvas');
    if (!canvas || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      setExportNotice('Tu navegador no soporta grabación directa. Usá Chrome o Edge.');
      return;
    }

    const mimeCandidates = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const isMp4 = mimeType.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const filename = isVerticalCinema
      ? `portfolio-3d-reels-9x16.${ext}`
      : `portfolio-3d-pc-16x9.${ext}`;

    // Restart the 3D scene & cinema timeline from exact t = 0
    cinemaClock.resetRequested = true;
    setResetPropsSignal((n) => n + 1);
    setExportNotice(null);
    setExportProgressSec(0);
    setIsExportingVideo(true);

    const stream = canvas.captureStream(60);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 12_000_000,
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    recorder.onstop = () => {
      if (exportTimerRef.current !== null) {
        window.clearInterval(exportTimerRef.current);
        exportTimerRef.current = null;
      }
      setIsExportingVideo(false);
      const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      setExportNotice(`¡Listo! Se descargó ${filename}`);
    };

    recorder.start(250);
    const startedAt = performance.now();
    const totalMs = Math.round(CINEMA_TOTAL_DURATION * 1000);

    exportTimerRef.current = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAt;
      setExportProgressSec(Math.min(CINEMA_TOTAL_DURATION, elapsedMs / 1000));
      if (elapsedMs >= totalMs) {
        stopVideoExport();
      }
    }, 120);
  }, [isExportingVideo, isVerticalCinema, stopVideoExport]);

  useEffect(() => {
    return () => {
      if (exportTimerRef.current !== null) {
        window.clearInterval(exportTimerRef.current);
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const {
    onlineCount,
    localColor,
    remoteIds,
    remoteColors,
    localEmote,
    remoteEmotes,
    sendEmote,
  } = useRealtimeOffice();

  const { likesCount, hasLiked, liking, giveLike } = usePortfolioLikes();

  const handleNavigateZone = useCallback(
    (id: ZoneId) => {
      if (activeZone?.id === id || openSection !== null) {
        navigationState.autoWalkTarget = null;
        setOpenReviewForm(false);
        setOpenSection(id);
        return;
      }

      const targetZone = ZONES.find((z) => z.id === id);
      if (targetZone) {
        navigationState.autoWalkTarget = {
          x: targetZone.walkTarget[0],
          z: targetZone.walkTarget[1],
          zoneId: id,
        };
      }
    },
    [activeZone, openSection]
  );

  const handleArriveAutoWalk = useCallback((zoneId: ZoneId) => {
    setOpenReviewForm(false);
    setOpenSection(zoneId);
  }, []);

  const handleResetProps = useCallback(() => {
    setResetPropsSignal((n) => n + 1);
    realtimeEvents.sendWorldReset?.();
  }, []);

  useEffect(() => {
    realtimeEvents.onRemoteReset = () => {
      setResetPropsSignal((n) => n + 1);
    };
    return () => {
      realtimeEvents.onRemoteReset = null;
    };
  }, []);

  const handleFinishIntro = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setIntroActive(false);
    setResetPropsSignal((n) => n + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (introActive && (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleFinishIntro();
      } else if (e.code === 'Escape' && cinemaRecording) {
        e.preventDefault();
        setCinemaRecording(false);
      } else if (e.code === 'Escape' && lightboxImage) {
        e.preventDefault();
        setLightboxImage(null);
      } else if (e.code === 'KeyE' && activeZone && !hideUi) {
        e.preventDefault();
        setOpenReviewForm(false);
        setOpenSection(activeZone.id);
      } else if (e.code === 'Escape' && openSection) {
        e.preventDefault();
        setOpenSection(null);
      } else if (e.code === 'KeyF' && !hideUi) {
        e.preventDefault();
        grabState.grabRequested = true;
      } else if (e.code === 'KeyR' && !hideUi) {
        e.preventDefault();
        handleResetProps();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeZone,
    openSection,
    lightboxImage,
    introActive,
    cinemaRecording,
    hideUi,
    handleResetProps,
    handleFinishIntro,
  ]);

  return (
    <main className={`app-root ${isVerticalCinema ? 'app-root--vertical-9-16' : ''}`}>
      <Scene
        activeZone={activeZone}
        modalOpen={anyOverlayOpen}
        cinemaMode={cinemaMode}
        cinemaLoop={cinemaRecording}
        resetPropsSignal={resetPropsSignal}
        likesCount={likesCount}
        localColor={localColor}
        remoteIds={remoteIds}
        remoteColors={remoteColors}
        localEmote={localEmote}
        remoteEmotes={remoteEmotes}
        onZoneChange={setActiveZone}
        onArriveAutoWalk={handleArriveAutoWalk}
        onOpenPressImage={setLightboxImage}
        onCinemaLoopRestart={() => setResetPropsSignal((n) => n + 1)}
        onCinemaComplete={handleFinishIntro}
      />

      {cinemaRecording && (
        <div className="cinema-recorder-bar" aria-label="Exportador de video MP4">
          {!isExportingVideo ? (
            <button
              type="button"
              className="cinema-recorder-btn"
              onClick={startVideoExport}
            >
              <Video size={16} />
              <span>
                Grabar MP4 ({Math.round(CINEMA_TOTAL_DURATION)}s ·{' '}
                {isVerticalCinema ? '9:16' : '16:9'})
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="cinema-recorder-btn cinema-recorder-btn--recording"
              onClick={stopVideoExport}
            >
              <Square size={14} fill="currentColor" />
              <span>
                Grabando... {exportProgressSec.toFixed(1)}s /{' '}
                {CINEMA_TOTAL_DURATION.toFixed(1)}s
              </span>
            </button>
          )}
          {exportNotice && (
            <span className="cinema-recorder-notice">
              <Download size={14} />
              {exportNotice}
            </span>
          )}
        </div>
      )}

      {introActive && (
        <div className="intro-overlay" aria-label="Intro cinematográfica">
          <div className="intro-brand">
            <span className="intro-brand__dot" />
            <span>EMILIANO CAMPOS · PORTFOLIO 3D</span>
          </div>
          <button
            type="button"
            className="intro-skip-btn"
            onClick={handleFinishIntro}
          >
            <span>Saltar intro</span>
            <SkipForward size={17} />
          </button>
        </div>
      )}

      <RealtimeWaypoints
        modalOpen={hideUi}
        onNavigateZone={handleNavigateZone}
      />

      {!cinemaMode && (
        <HUD
          activeZone={activeZone}
          modalOpen={anyOverlayOpen}
          onlineCount={onlineCount}
          onNavigateZone={handleNavigateZone}
          onOpenSection={(id) => {
            setOpenReviewForm(false);
            setOpenSection(id);
          }}
          onResetProps={handleResetProps}
          onOpenTour={() => setTourOpen(true)}
          onSendEmote={sendEmote}
          audioMuted={audioMuted}
          audioPlaying={audioPlaying}
          onToggleAudio={handleToggleWelcomeAudio}
        />
      )}

      <MobileControls
        activeZone={activeZone}
        modalOpen={hideUi}
        onOpenSection={(id) => {
          setOpenReviewForm(false);
          setOpenSection(id);
        }}
      />

      <MobileTour open={tourOpen && !hideUi} onClose={() => setTourOpen(false)} />

      {lightboxImage && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Recorte de diario ampliado"
          onClick={() => setLightboxImage(null)}
        >
          <div className="lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Cerrar imagen"
            >
              <X size={22} />
            </button>
            <img
              src={lightboxImage}
              alt="Nota de prensa Mascotas Trelew - Emiliano Campos"
              className="lightbox-img"
            />
          </div>
        </div>
      )}

      <SectionModal
        section={openSection}
        openReviewForm={openReviewForm}
        likesCount={likesCount}
        hasLiked={hasLiked}
        liking={liking}
        onGiveLike={giveLike}
        onClose={() => setOpenSection(null)}
      />
    </main>
  );
}
