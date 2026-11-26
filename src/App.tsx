import { useCallback, useEffect, useState } from 'react';
import { type InteractiveZone, ZONES, type ZoneId } from './data/portfolioData';
import { navigationState, realtimeEvents } from './state/inputState';
import { useRealtimeOffice } from './hooks/useRealtimeOffice';
import { usePortfolioLikes } from './hooks/usePortfolioLikes';
import { Scene } from './components/3d/Scene';
import { HUD } from './components/ui/HUD';
import { MobileControls } from './components/ui/MobileControls';
import { RealtimeWaypoints } from './components/ui/RealtimeWaypoints';
import { SectionModal } from './components/ui/SectionModal';

function hasReviewQueryParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('resena') === '1' || params.get('review') === '1';
}

export default function App() {
  const initialReviewOpen = hasReviewQueryParam();
  const [activeZone, setActiveZone] = useState<InteractiveZone | null>(null);
  const [openSection, setOpenSection] = useState<ZoneId | null>(
    initialReviewOpen ? 'reviews' : null
  );
  const [openReviewForm, setOpenReviewForm] = useState(initialReviewOpen);
  const [resetPropsSignal, setResetPropsSignal] = useState(0);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && activeZone && !openSection) {
        e.preventDefault();
        setOpenReviewForm(false);
        setOpenSection(activeZone.id);
      } else if (e.code === 'Escape' && openSection) {
        e.preventDefault();
        setOpenSection(null);
      } else if (e.code === 'KeyR' && !openSection) {
        e.preventDefault();
        handleResetProps();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeZone, openSection, handleResetProps]);

  return (
    <main className="app-root">
      <Scene
        activeZone={activeZone}
        modalOpen={openSection !== null}
        resetPropsSignal={resetPropsSignal}
        likesCount={likesCount}
        localColor={localColor}
        remoteIds={remoteIds}
        remoteColors={remoteColors}
        localEmote={localEmote}
        remoteEmotes={remoteEmotes}
        onZoneChange={setActiveZone}
        onArriveAutoWalk={handleArriveAutoWalk}
      />

      <RealtimeWaypoints
        modalOpen={openSection !== null}
        onNavigateZone={handleNavigateZone}
      />

      <HUD
        activeZone={activeZone}
        modalOpen={openSection !== null}
        onlineCount={onlineCount}
        onNavigateZone={handleNavigateZone}
        onOpenSection={(id) => {
          setOpenReviewForm(false);
          setOpenSection(id);
        }}
        onResetProps={handleResetProps}
        onSendEmote={sendEmote}
      />

      <MobileControls
        activeZone={activeZone}
        modalOpen={openSection !== null}
        onOpenSection={(id) => {
          setOpenReviewForm(false);
          setOpenSection(id);
        }}
      />

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
