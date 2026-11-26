import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import type { InteractiveZone, ZoneId } from '../../data/portfolioData';
import { Character } from './Character';
import { PhysicsProps } from './PhysicsProps';
import { RemotePlayers } from './RemotePlayers';
import { WaypointTracker } from './WaypointTracker';
import { WorldMap } from './WorldMap';

interface SceneProps {
  activeZone: InteractiveZone | null;
  modalOpen: boolean;
  resetPropsSignal: number;
  localColor: string;
  remoteIds: string[];
  remoteColors: Record<string, string>;
  localEmote: { emoji: string; key: number } | null;
  remoteEmotes: Record<string, { emoji: string; key: number }>;
  onZoneChange: (zone: InteractiveZone | null) => void;
  onArriveAutoWalk: (zoneId: ZoneId) => void;
}

function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900
  );
}

export function Scene({
  activeZone,
  modalOpen,
  resetPropsSignal,
  localColor,
  remoteIds,
  remoteColors,
  localEmote,
  remoteEmotes,
  onZoneChange,
  onArriveAutoWalk,
}: SceneProps) {
  const isMobile = useMemo(() => detectMobileDevice(), []);

  return (
    <Canvas
      shadows
      // Pause WebGL render loop while a modal is open to save mobile battery & keep scrolling smooth
      frameloop={modalOpen ? 'demand' : 'always'}
      dpr={isMobile ? [1, 1.15] : [1, 1.25]}
      gl={{
        antialias: !isMobile,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      camera={{ position: [0, 9.5, 6.2], fov: isMobile ? 46 : 42, near: 0.2, far: 90 }}
      className="canvas-fullscreen"
    >
      <color attach="background" args={['#111827']} />

      {/* Desktop gets studio IBL reflections; mobile skips PMREM for locked 60fps */}
      {!isMobile && (
        <Environment resolution={64}>
          <Lightformer
            form="rect"
            intensity={2.2}
            position={[0, 10, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[20, 14, 1]}
            color="#f8fafc"
          />
          <Lightformer
            form="rect"
            intensity={1.8}
            position={[-10, 4, -6]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[8, 4, 1]}
            color="#fef08a"
          />
          <Lightformer
            form="ring"
            intensity={1.2}
            position={[12, 6, 8]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={8}
            color="#bae6fd"
          />
        </Environment>
      )}

      {/* Main office lighting (single-pass shadow map for locked 60fps while walking) */}
      <hemisphereLight args={['#f8fafc', '#334155', isMobile ? 1.15 : 0.85]} />
      <directionalLight
        position={[-10, 19, -5]}
        intensity={isMobile ? 1.55 : 1.45}
        color="#fff4d6"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0008}
      />
      {!isMobile && (
        <directionalLight position={[12, 14, 14]} intensity={0.45} color="#dbeafe" />
      )}

      <WorldMap activeZone={activeZone} resetSignal={resetPropsSignal} />
      <PhysicsProps resetSignal={resetPropsSignal} />
      <RemotePlayers
        remoteIds={remoteIds}
        remoteColors={remoteColors}
        remoteEmotes={remoteEmotes}
      />
      <WaypointTracker />
      <Character
        disabled={modalOpen}
        color={localColor}
        localEmote={localEmote}
        onZoneChange={onZoneChange}
        onArriveAutoWalk={onArriveAutoWalk}
      />
    </Canvas>
  );
}
