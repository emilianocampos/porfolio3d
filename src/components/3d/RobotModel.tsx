import type { RefObject } from 'react';
import type * as THREE from 'three';

export interface RobotColorTheme {
  torso: string;
  arms: string;
  glow: string;
  backpack: string;
}

/**
 * Deterministic join-order palette:
 * 1st user in the office = original signature Blue robot
 * 2nd user = Red copy, 3rd = Emerald, 4th = Purple, etc.
 */
export const ROBOT_PALETTE: RobotColorTheme[] = [
  { torso: '#3b82f6', arms: '#60a5fa', glow: '#38bdf8', backpack: '#f59e0b' }, // 1. Blue (original)
  { torso: '#ef4444', arms: '#f87171', glow: '#fca5a5', backpack: '#facc15' }, // 2. Red
  { torso: '#10b981', arms: '#34d399', glow: '#6ee7b7', backpack: '#f59e0b' }, // 3. Emerald
  { torso: '#8b5cf6', arms: '#a78bfa', glow: '#c4b5fd', backpack: '#ec4899' }, // 4. Purple
  { torso: '#f97316', arms: '#fb923c', glow: '#fdba74', backpack: '#38bdf8' }, // 5. Orange
  { torso: '#ec4899', arms: '#f472b6', glow: '#f9a8d4', backpack: '#facc15' }, // 6. Pink
  { torso: '#06b6d4', arms: '#22d3ee', glow: '#67e8f9', backpack: '#f97316' }, // 7. Cyan
  { torso: '#eab308', arms: '#facc15', glow: '#fde047', backpack: '#6366f1' }, // 8. Yellow
];

export function getRobotThemeByColor(torsoColor?: string): RobotColorTheme {
  if (!torsoColor) return ROBOT_PALETTE[0];
  return (
    ROBOT_PALETTE.find((t) => t.torso === torsoColor) ?? {
      torso: torsoColor,
      arms: torsoColor,
      glow: torsoColor,
      backpack: '#f59e0b',
    }
  );
}

interface RobotModelProps {
  color: string;
  bodyRef?: RefObject<THREE.Group | null>;
  leftArmRef?: RefObject<THREE.Mesh | null>;
  rightArmRef?: RefObject<THREE.Mesh | null>;
  leftLegRef?: RefObject<THREE.Mesh | null>;
  rightLegRef?: RefObject<THREE.Mesh | null>;
}

export function RobotModel({
  color,
  bodyRef,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
}: RobotModelProps) {
  const theme = getRobotThemeByColor(color);

  return (
    <group ref={bodyRef}>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.66, 0.72, 0.42]} />
        <meshStandardMaterial color={theme.torso} roughness={0.45} />
      </mesh>

      {/* Backpack */}
      <mesh position={[0, 1.08, -0.3]} castShadow>
        <boxGeometry args={[0.46, 0.52, 0.24]} />
        <meshStandardMaterial color={theme.backpack} roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <boxGeometry args={[0.56, 0.54, 0.52]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>

      {/* Glowing Visor / Eyes */}
      <mesh position={[0, 1.74, 0.27]}>
        <boxGeometry args={[0.42, 0.2, 0.04]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={theme.glow}
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 2.12, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.28, 0]}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial
          color={theme.glow}
          emissive={theme.glow}
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.45, 1.04, 0]} castShadow>
        <boxGeometry args={[0.2, 0.62, 0.22]} />
        <meshStandardMaterial color={theme.arms} roughness={0.45} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.45, 1.04, 0]} castShadow>
        <boxGeometry args={[0.2, 0.62, 0.22]} />
        <meshStandardMaterial color={theme.arms} roughness={0.45} />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.18, 0.38, 0]} castShadow>
        <boxGeometry args={[0.24, 0.68, 0.26]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.18, 0.38, 0]} castShadow>
        <boxGeometry args={[0.24, 0.68, 0.26]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
    </group>
  );
}
