import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { remotePlayersMap } from '../../state/inputState';

function RemoteAvatar({
  playerId,
  emote,
}: {
  playerId: string;
  emote?: { emoji: string; key: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const player = remotePlayersMap.get(playerId);
  const color = player?.color ?? '#10b981';

  useFrame((_, rawDelta) => {
    const data = remotePlayersMap.get(playerId);
    const group = groupRef.current;
    if (!data || !group) return;

    const damp = Math.min(1, rawDelta * 10);
    group.position.x = THREE.MathUtils.lerp(group.position.x, data.x, damp);
    group.position.y = THREE.MathUtils.lerp(group.position.y, data.y, damp);
    group.position.z = THREE.MathUtils.lerp(group.position.z, data.z, damp);

    let angleDiff = data.rotY - group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    group.rotation.y += angleDiff * damp;
  });

  return (
    <group ref={groupRef} position={[player?.x ?? 0, player?.y ?? 0, player?.z ?? 2.2]}>
      {/* Floating emoji bubble above remote visitor's robot */}
      {emote && (
        <Html position={[0, 2.75, 0]} center style={{ pointerEvents: 'none' }}>
          <div key={emote.key} className="robot-emote-bubble">
            {emote.emoji}
          </div>
        </Html>
      )}

      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.25} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.62, 0.68, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.52, 0.5, 0.48]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.72, 0.25]}>
        <boxGeometry args={[0.38, 0.18, 0.04]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={color}
          emissiveIntensity={1.4}
        />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.16, 0.36, 0]} castShadow>
        <boxGeometry args={[0.22, 0.64, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0.16, 0.36, 0]} castShadow>
        <boxGeometry args={[0.22, 0.64, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function RemotePlayers({
  remoteIds,
  remoteEmotes,
}: {
  remoteIds: string[];
  remoteEmotes: Record<string, { emoji: string; key: number }>;
}) {
  return (
    <group>
      {remoteIds.map((id) => (
        <RemoteAvatar key={id} playerId={id} emote={remoteEmotes[id]} />
      ))}
    </group>
  );
}
