import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOX_OBSTACLES, OFFICE_BOUNDS } from '../../data/portfolioData';
import { characterState } from '../../state/inputState';

interface DebrisSpec {
  id: string;
  color: string;
  emissive?: string;
  dims: [number, number, number];
  radius: number;
  halfH: number;
  mass: number;
}

interface DebrisBody {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  avx: number;
  avy: number;
  avz: number;
}

const DEBRIS_SPECS: DebrisSpec[] = [
  // Main white chassis
  { id: 'chassis', color: '#f8fafc', dims: [0.5, 0.16, 0.58], radius: 0.34, halfH: 0.1, mass: 0.9 },
  // Blue top cover
  { id: 'cover', color: '#4285F4', dims: [0.34, 0.06, 0.4], radius: 0.24, halfH: 0.05, mass: 0.45 },
  // Glowing cyan camera lens
  { id: 'camera', color: '#0f172a', emissive: '#38bdf8', dims: [0.18, 0.18, 0.18], radius: 0.14, halfH: 0.1, mass: 0.4 },
  // 4 broken rotor arms + blades
  { id: 'rotor-1', color: '#34A853', dims: [0.44, 0.04, 0.12], radius: 0.24, halfH: 0.04, mass: 0.35 },
  { id: 'rotor-2', color: '#FBBC05', dims: [0.44, 0.04, 0.12], radius: 0.24, halfH: 0.04, mass: 0.35 },
  { id: 'rotor-3', color: '#34A853', dims: [0.44, 0.04, 0.12], radius: 0.24, halfH: 0.04, mass: 0.35 },
  { id: 'rotor-4', color: '#FBBC05', dims: [0.44, 0.04, 0.12], radius: 0.24, halfH: 0.04, mass: 0.35 },
  // Smoked battery pack
  { id: 'battery', color: '#EA4335', dims: [0.24, 0.14, 0.3], radius: 0.2, halfH: 0.08, mass: 0.6 },
];

const GRAVITY = 20;

interface PatrolDroneProps {
  resetSignal: number;
}

export function PatrolDrone({ resetSignal }: PatrolDroneProps) {
  const [broken, setBroken] = useState(false);

  const droneRef = useRef<THREE.Group>(null);
  const rotorRefs = useRef<Array<THREE.Mesh | null>>([]);
  const debrisMeshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const debrisBodiesRef = useRef<DebrisBody[]>([]);

  // Explosion flash sphere + expanding shock ring
  const flashRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const explosionOrigin = useRef(new THREE.Vector3());
  const explosionAge = useRef(99);
  const brokenRef = useRef(false);

  useEffect(() => {
    brokenRef.current = false;
    explosionAge.current = 99;
    debrisBodiesRef.current = [];
    setBroken(false);
  }, [resetSignal]);

  const triggerExplosion = (x: number, y: number, z: number) => {
    brokenRef.current = true;
    explosionOrigin.current.set(x, y, z);
    explosionAge.current = 0;

    // Launch 8 kickable pieces outward from the explosion point
    debrisBodiesRef.current = DEBRIS_SPECS.map((_, idx) => {
      const angle = (idx / DEBRIS_SPECS.length) * Math.PI * 2 + Math.random() * 0.5;
      const burstSpeed = 3.2 + Math.random() * 4.2;
      return {
        x: x + Math.cos(angle) * 0.18,
        y: y + (Math.random() - 0.3) * 0.2,
        z: z + Math.sin(angle) * 0.18,
        vx: Math.cos(angle) * burstSpeed + characterState.vx * 0.35,
        vy: 3.2 + Math.random() * 4.0,
        vz: Math.sin(angle) * burstSpeed + characterState.vz * 0.35,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        avx: (Math.random() - 0.5) * 14,
        avy: (Math.random() - 0.5) * 14,
        avz: (Math.random() - 0.5) * 14,
      };
    });

    setBroken(true);
  };

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    const t = state.clock.elapsedTime;

    if (!brokenRef.current) {
      // Fly figure-8 patrol at reachable jump height (~2.85m)
      const x = Math.sin(t * 0.38) * 9.6;
      const z = Math.sin(t * 0.76) * 4.6 - 0.6;
      const y = 2.85 + Math.sin(t * 2.4) * 0.22;

      if (droneRef.current) {
        const nextX = Math.sin((t + 0.05) * 0.38) * 9.6;
        const nextZ = Math.sin((t + 0.05) * 0.76) * 4.6 - 0.6;
        droneRef.current.position.set(x, y, z);
        droneRef.current.rotation.y = Math.atan2(nextX - x, nextZ - z);
        droneRef.current.rotation.x = 0.12;
        droneRef.current.rotation.z = Math.cos(t * 0.38) * -0.14;
      }

      for (const rotor of rotorRefs.current) {
        if (rotor) rotor.rotation.y = t * 28;
      }

      // Check if jumping player smashes into the drone!
      const headY = characterState.y + 2.0;
      const distToDrone = Math.hypot(
        characterState.x - x,
        headY - y,
        characterState.z - z
      );
      if (characterState.y > 0.25 && distToDrone < 1.35) {
        triggerExplosion(x, y, z);
      }
      return;
    }

    // Animate explosion fireball & shockwave ring (~0.55s)
    if (explosionAge.current < 0.6) {
      explosionAge.current += dt;
      const p = Math.min(1, explosionAge.current / 0.55);

      if (flashRef.current) {
        flashRef.current.visible = p < 1;
        flashRef.current.position.copy(explosionOrigin.current);
        const s = 0.5 + p * 2.6;
        flashRef.current.scale.setScalar(s);
        const mat = flashRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - p) * 0.9;
      }

      if (ringRef.current) {
        ringRef.current.visible = p < 1;
        ringRef.current.position.copy(explosionOrigin.current);
        const s = 0.6 + p * 3.8;
        ringRef.current.scale.setScalar(s);
        const mat = ringRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - p) * 0.85;
      }
    } else {
      if (flashRef.current) flashRef.current.visible = false;
      if (ringRef.current) ringRef.current.visible = false;
    }

    // Simulate kickable drone debris physics
    const bodies = debrisBodiesRef.current;
    const px = characterState.x;
    const py = characterState.y;
    const pz = characterState.z;
    const pvx = characterState.vx;
    const pvz = characterState.vz;
    const pSpeed = Math.hypot(pvx, pvz);

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const spec = DEBRIS_SPECS[i];
      const prevBottom = b.y - spec.halfH;

      b.vy -= GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.rx += b.avx * dt;
      b.ry += b.avy * dt;
      b.rz += b.avz * dt;

      // Tabletop or floor support
      let supportY = 0;
      for (const box of BOX_OBSTACLES) {
        if (
          b.x >= box.minX - 0.08 &&
          b.x <= box.maxX + 0.08 &&
          b.z >= box.minZ - 0.08 &&
          b.z <= box.maxZ + 0.08 &&
          prevBottom >= box.topY - 0.16
        ) {
          supportY = Math.max(supportY, box.topY);
        }
      }

      const minY = supportY + spec.halfH;
      if (b.y < minY) {
        b.y = minY;
        b.vy = Math.abs(b.vy) > 1.0 ? -b.vy * 0.42 : 0;
        const fric = Math.max(0, 1 - 4.4 * dt);
        b.vx *= fric;
        b.vz *= fric;
        b.avx *= Math.max(0, 1 - 5 * dt);
        b.avy *= Math.max(0, 1 - 5 * dt);
        b.avz *= Math.max(0, 1 - 5 * dt);
      }

      // Kickable by player!
      const dxP = b.x - px;
      const dzP = b.z - pz;
      const dyP = Math.abs(b.y - (py + 0.55));
      const distP = Math.hypot(dxP, dzP);
      const minDistP = spec.radius + characterState.radius;

      if (distP < minDistP && dyP < 1.15 && distP > 0.0001) {
        const nx = dxP / distP;
        const nz = dzP / distP;
        b.x += nx * (minDistP - distP);
        b.z += nz * (minDistP - distP);

        const kick = Math.max(4.0, pSpeed * 1.6) / spec.mass;
        b.vx += nx * kick + pvx * 0.45;
        b.vz += nz * kick + pvz * 0.45;
        b.vy = Math.max(b.vy, Math.min(6.2, (1.8 + pSpeed * 0.35) / spec.mass));
        b.avx += nz * kick * 2.0;
        b.avz -= nx * kick * 2.0;
      }

      // Keep inside office walls
      const minX = OFFICE_BOUNDS.minX + spec.radius;
      const maxX = OFFICE_BOUNDS.maxX - spec.radius;
      const minZ = OFFICE_BOUNDS.minZ + spec.radius;
      const maxZ = OFFICE_BOUNDS.maxZ - spec.radius;
      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * 0.5;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * 0.5;
      }
      if (b.z < minZ) {
        b.z = minZ;
        b.vz = Math.abs(b.vz) * 0.5;
      } else if (b.z > maxZ) {
        b.z = maxZ;
        b.vz = -Math.abs(b.vz) * 0.5;
      }

      const mesh = debrisMeshRefs.current[i];
      if (mesh) {
        mesh.position.set(b.x, b.y, b.z);
        mesh.rotation.set(b.rx, b.ry, b.rz);
      }
    }
  });

  const armOffsets: Array<[number, number, number]> = [
    [-0.45, 0.06, -0.45],
    [0.45, 0.06, -0.45],
    [-0.45, 0.06, 0.45],
    [0.45, 0.06, 0.45],
  ];

  return (
    <group>
      {/* Intact Flying Drone */}
      {!broken && (
        <group ref={droneRef} position={[0, 2.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.54, 0.18, 0.66]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.22} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.36, 0.03, 0.44]} />
            <meshStandardMaterial color="#4285F4" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.02, 0.34]}>
            <sphereGeometry args={[0.09, 14, 14]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#38bdf8"
              emissiveIntensity={2.0}
            />
          </mesh>
          <mesh position={[0, -0.85, 0.1]}>
            <coneGeometry args={[0.55, 1.4, 16, 1, true]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.14}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {armOffsets.map((pos, idx) => (
            <group key={idx} position={pos}>
              <mesh position={[-pos[0] * 0.5, -0.02, -pos[2] * 0.5]} castShadow>
                <boxGeometry args={[0.1, 0.05, 0.1]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.07, 0.07, 0.1, 10]} />
                <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh
                ref={(el) => {
                  rotorRefs.current[idx] = el;
                }}
                position={[0, 0.07, 0]}
              >
                <boxGeometry args={[0.42, 0.015, 0.05]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#34A853' : '#FBBC05'}
                  roughness={0.3}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Explosion Flash + Shockwave Ring */}
      {broken && (
        <>
          <mesh ref={flashRef} visible={false}>
            <sphereGeometry args={[0.65, 16, 16]} />
            <meshBasicMaterial color="#fb923c" transparent opacity={0.9} />
          </mesh>
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.55, 0.78, 24]} />
            <meshBasicMaterial
              color="#fef08a"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 8 Kickable Broken Drone Pieces */}
          {DEBRIS_SPECS.map((spec, idx) => (
            <mesh
              key={spec.id}
              ref={(el) => {
                debrisMeshRefs.current[idx] = el;
              }}
              castShadow
              receiveShadow
            >
              <boxGeometry args={spec.dims} />
              <meshStandardMaterial
                color={spec.color}
                emissive={spec.emissive ?? '#000000'}
                emissiveIntensity={spec.emissive ? 1.4 : 0}
                roughness={0.4}
                metalness={0.25}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
