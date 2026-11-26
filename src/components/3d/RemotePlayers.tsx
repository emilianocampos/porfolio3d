import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { remotePlayersMap } from '../../state/inputState';
import { ROBOT_PALETTE, RobotModel } from './RobotModel';

function RemoteAvatar({
  playerId,
  color,
  emote,
}: {
  playerId: string;
  color: string;
  emote?: { emoji: string; key: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const walkCycleRef = useRef(0);

  const player = remotePlayersMap.get(playerId);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const data = remotePlayersMap.get(playerId);
    const group = groupRef.current;
    if (!data || !group) return;

    const prevX = group.position.x;
    const prevZ = group.position.z;

    const damp = Math.min(1, delta * 10);
    group.position.x = THREE.MathUtils.lerp(group.position.x, data.x, damp);
    group.position.y = THREE.MathUtils.lerp(group.position.y, data.y, damp);
    group.position.z = THREE.MathUtils.lerp(group.position.z, data.z, damp);

    let angleDiff = data.rotY - group.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    group.rotation.y += angleDiff * damp;

    // Animate limbs based on remote movement speed (identical to main robot!)
    const speed = Math.hypot(group.position.x - prevX, group.position.z - prevZ) / Math.max(delta, 0.001);
    const t = state.clock.elapsedTime;
    if (speed > 0.25 && group.position.y < 0.15) {
      walkCycleRef.current += delta * Math.min(15, 7 + speed * 1.1);
      const swing = Math.sin(walkCycleRef.current) * 0.56;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.85;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.85;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(walkCycleRef.current)) * 0.09;
      }
    } else {
      const idleDamp = Math.min(1, delta * 10);
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 1 - idleDamp;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 1 - idleDamp;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 1 - idleDamp;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 1 - idleDamp;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2.6) * 0.035;
      }
    }
  });

  return (
    <group ref={groupRef} position={[player?.x ?? 0, player?.y ?? 0, player?.z ?? -5.4]}>
      {/* Floating emoji bubble above remote visitor's robot */}
      {emote && (
        <Html position={[0, 2.85, 0]} center style={{ pointerEvents: 'none' }}>
          <div key={emote.key} className="robot-emote-bubble">
            {emote.emoji}
          </div>
        </Html>
      )}

      {/* Ground contact shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.28} />
      </mesh>

      {/* Exact same detailed Robot 3D model, tinted with join-order color */}
      <RobotModel
        color={color}
        bodyRef={bodyRef}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
        leftLegRef={leftLegRef}
        rightLegRef={rightLegRef}
      />
    </group>
  );
}

export function RemotePlayers({
  remoteIds,
  remoteColors,
  remoteEmotes,
}: {
  remoteIds: string[];
  remoteColors: Record<string, string>;
  remoteEmotes: Record<string, { emoji: string; key: number }>;
}) {
  return (
    <group>
      {remoteIds.map((id) => (
        <RemoteAvatar
          key={id}
          playerId={id}
          color={remoteColors[id] ?? remotePlayersMap.get(id)?.color ?? ROBOT_PALETTE[1].torso}
          emote={remoteEmotes[id]}
        />
      ))}
    </group>
  );
}
