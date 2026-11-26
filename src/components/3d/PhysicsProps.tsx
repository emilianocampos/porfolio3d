import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BOX_OBSTACLES, OFFICE_BOUNDS } from '../../data/portfolioData';
import { characterState, realtimeEvents } from '../../state/inputState';

type PropKind = 'ball' | 'box' | 'cone' | 'cube' | 'cylinder' | 'monitor' | 'vr' | 'guitar' | 'belt' | 'letter';

interface PropConfig {
  id: string;
  kind: PropKind;
  color: string;
  letter?: string;
  screenColor?: string;
  guitarStyle?: 'electric' | 'acoustic';
  rankBarColor?: string;
  pinned?: boolean;
  wide?: boolean;
  size: number;
  mass: number;
  restitution: number;
  spawn: [number, number, number];
  spawnRotY?: number;
}

interface LetterStroke {
  x: number;
  y: number;
  w: number;
  h: number;
  rotZ?: number;
}

/**
 * Real 3D sculpted "TECHNOLOGY FUTURE FONT" stencil-tech letters
 * (segmented floating bars, futuristic stencil cutouts, wide sci-fi proportions)
 */
const LETTER_SHAPES: Record<string, LetterStroke[]> = {
  // E: detached floating top bar + stencil gap + mid bar + lower-left stem & bottom bar
  E: [
    { x: 0.04, y: 0.44, w: 0.84, h: 0.19 },
    { x: -0.34, y: -0.14, w: 0.2, h: 0.66 },
    { x: 0.02, y: 0.08, w: 0.66, h: 0.17 },
    { x: 0.05, y: -0.44, w: 0.82, h: 0.19 },
  ],
  // M: segmented left stem + angled stencil V + segmented right stem
  M: [
    { x: -0.4, y: -0.02, w: 0.19, h: 1.04 },
    { x: 0.4, y: -0.02, w: 0.19, h: 1.04 },
    { x: -0.16, y: 0.16, w: 0.17, h: 0.68, rotZ: 0.48 },
    { x: 0.16, y: 0.16, w: 0.17, h: 0.68, rotZ: -0.48 },
  ],
  // I: futuristic stencil I — short floating top cap + gap + lower stem
  I: [
    { x: 0, y: 0.43, w: 0.24, h: 0.2 },
    { x: 0, y: -0.14, w: 0.24, h: 0.78 },
  ],
  // C: detached top bar + stencil gap + left stem + bottom bar
  C: [
    { x: 0.05, y: 0.44, w: 0.82, h: 0.19 },
    { x: -0.34, y: -0.13, w: 0.2, h: 0.7 },
    { x: 0.05, y: -0.44, w: 0.82, h: 0.19 },
  ],
  // A: wide futuristic slanted legs + detached floating crossbar
  A: [
    { x: -0.25, y: 0, w: 0.2, h: 1.12, rotZ: -0.3 },
    { x: 0.25, y: 0, w: 0.2, h: 1.12, rotZ: 0.3 },
    { x: 0, y: -0.22, w: 0.44, h: 0.17 },
  ],
  // P: segmented left stem + detached top/right tech loop
  P: [
    { x: -0.35, y: -0.12, w: 0.2, h: 0.82 },
    { x: 0.02, y: 0.44, w: 0.84, h: 0.19 },
    { x: 0.34, y: 0.22, w: 0.19, h: 0.46 },
    { x: 0.06, y: 0.02, w: 0.68, h: 0.18 },
  ],
  // O: signature detached top bar + stencil gap + sleek U-shaped base
  O: [
    { x: 0, y: 0.44, w: 0.84, h: 0.19 },
    { x: -0.35, y: -0.13, w: 0.2, h: 0.7 },
    { x: 0.35, y: -0.13, w: 0.2, h: 0.7 },
    { x: 0, y: -0.44, w: 0.84, h: 0.19 },
  ],
  // S: wide futuristic segmented S with crisp stencil breaks
  S: [
    { x: 0.04, y: 0.44, w: 0.82, h: 0.18 },
    { x: -0.32, y: 0.22, w: 0.2, h: 0.34 },
    { x: 0, y: 0.0, w: 0.8, h: 0.18 },
    { x: 0.32, y: -0.22, w: 0.2, h: 0.34 },
    { x: -0.04, y: -0.44, w: 0.82, h: 0.18 },
  ],
};

// Cyber/Tech neon accent palette (cyan, electric blue, indigo, violet)
const NAME_BLOCK_COLORS = [
  '#38bdf8',
  '#6366f1',
  '#22d3ee',
  '#a855f7',
  '#3b82f6',
];

function createNameBlocks(
  word: string,
  z: number,
  colorOffset = 0,
  y = 0.56
): PropConfig[] {
  const letters = word.split('');
  const spacing = 1.2;
  const startX = -((letters.length - 1) * spacing) / 2;
  return letters.map((ch, i) => ({
    id: `name-${word}-${i}`,
    kind: 'letter',
    letter: ch,
    color: NAME_BLOCK_COLORS[(i + colorOffset) % NAME_BLOCK_COLORS.length],
    size: 0.96,
    mass: 0.72,
    restitution: 0.42,
    spawn: [startX + i * spacing, y, z],
  }));
}

interface PropBody {
  kind: PropKind;
  pinned: boolean;
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
  radius: number;
  halfH: number;
  mass: number;
  restitution: number;
}

const INITIAL_PROPS: PropConfig[] = [
  // === KNOCKABLE OFFICE MONITORS & VR HEADSET ON DESKS ===
  // Dev Desk (Proyectos, pushed toward right edge)
  {
    id: 'mon-dev-1',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#6366f1',
    wide: true,
    size: 0.62,
    mass: 0.85,
    restitution: 0.35,
    spawn: [13.65, 1.24, 7.85],
    spawnRotY: Math.PI,
  },
  {
    id: 'mon-dev-2',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#38bdf8',
    wide: false,
    size: 0.56,
    mass: 0.75,
    restitution: 0.35,
    spawn: [16.0, 1.24, 7.85],
    spawnRotY: Math.PI - 0.2,
  },
  {
    id: 'vr-dev',
    kind: 'vr',
    color: '#f8fafc',
    size: 0.28,
    mass: 0.4,
    restitution: 0.45,
    spawn: [16.9, 1.02, 7.3],
    spawnRotY: -0.5,
  },
  // Skills Desk â€” Pink ultrawide monitor
  {
    id: 'mon-skills',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#ec4899',
    wide: true,
    size: 0.62,
    mass: 0.85,
    restitution: 0.35,
    spawn: [-14.55, 1.24, 6.8],
    spawnRotY: Math.PI / 2,
  },
  // Reception Desk - Amber monitor
  {
    id: 'mon-reception',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#FBBC05',
    wide: false,
    size: 0.56,
    mass: 0.75,
    restitution: 0.35,
    spawn: [5.5, 1.55, -9.2],
    spawnRotY: -0.35,
  },
  // Streamer & Recording Studio Desk - Dual monitors (Twitch purple + OBS cyan)
  {
    id: 'mon-stream-1',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#a855f7',
    wide: true,
    size: 0.62,
    mass: 0.85,
    restitution: 0.35,
    spawn: [18.0, 1.24, 0.25],
    spawnRotY: -Math.PI / 2,
  },
  {
    id: 'mon-stream-2',
    kind: 'monitor',
    color: '#0f172a',
    screenColor: '#06b6d4',
    wide: false,
    size: 0.56,
    mass: 0.75,
    restitution: 0.35,
    spawn: [18.0, 1.24, 1.48],
    spawnRotY: -Math.PI / 2 - 0.22,
  },

  // === 5 DESTRUCTIBLE JIU-JITSU BELTS ON BACK WALL (Negro -> Marron -> Morado -> Azul -> Blanco) ===
  {
    id: 'bjj-belt-black',
    kind: 'belt',
    color: '#111827',
    rankBarColor: '#dc2626',
    pinned: true,
    size: 0.45,
    mass: 0.45,
    restitution: 0.42,
    spawn: [0.9, 2.45, -11.46],
  },
  {
    id: 'bjj-belt-brown',
    kind: 'belt',
    color: '#78350f',
    rankBarColor: '#0f172a',
    pinned: true,
    size: 0.45,
    mass: 0.45,
    restitution: 0.42,
    spawn: [0.9, 2.15, -11.46],
  },
  {
    id: 'bjj-belt-purple',
    kind: 'belt',
    color: '#7e22ce',
    rankBarColor: '#0f172a',
    pinned: true,
    size: 0.45,
    mass: 0.45,
    restitution: 0.42,
    spawn: [0.9, 1.85, -11.46],
  },
  {
    id: 'bjj-belt-blue',
    kind: 'belt',
    color: '#2563eb',
    rankBarColor: '#0f172a',
    pinned: true,
    size: 0.45,
    mass: 0.45,
    restitution: 0.42,
    spawn: [0.9, 1.55, -11.46],
  },
  {
    id: 'bjj-belt-white',
    kind: 'belt',
    color: '#f8fafc',
    rankBarColor: '#0f172a',
    pinned: true,
    size: 0.45,
    mass: 0.45,
    restitution: 0.42,
    spawn: [0.9, 1.25, -11.46],
  },

  // === GOOGLE-COLORED GIANT YOGA / GYM BALLS (trimmed to 3 for mobile FPS) ===
  { id: 'ball-blue', kind: 'ball', color: '#4285F4', size: 0.52, mass: 0.7, restitution: 0.78, spawn: [-3.8, 0.52, -1.6] },
  { id: 'ball-red', kind: 'ball', color: '#EA4335', size: 0.48, mass: 0.65, restitution: 0.78, spawn: [5.4, 0.48, -1.2] },
  { id: 'ball-yellow', kind: 'ball', color: '#FBBC05', size: 0.44, mass: 0.6, restitution: 0.8, spawn: [-3.0, 0.44, 4.4] },

  // === STACK OF CARDBOARD DELIVERY BOXES (trimmed to 2 for mobile FPS) ===
  { id: 'box-1', kind: 'box', color: '#c08446', size: 0.58, mass: 1.0, restitution: 0.35, spawn: [2.2, 0.29, 3.0] },
  { id: 'box-2', kind: 'box', color: '#b07438', size: 0.52, mass: 0.85, restitution: 0.35, spawn: [2.2, 0.84, 3.0] },

  // === TECH CONES AROUND DRONE PAD ===
  { id: 'cone-1', kind: 'cone', color: '#f97316', size: 0.34, mass: 0.45, restitution: 0.42, spawn: [-1.7, 0.34, -4.0] },
  { id: 'cone-2', kind: 'cone', color: '#f97316', size: 0.34, mass: 0.45, restitution: 0.42, spawn: [1.7, 0.34, -4.0] },
  { id: 'cone-3', kind: 'cone', color: '#f97316', size: 0.34, mass: 0.45, restitution: 0.42, spawn: [-1.7, 0.34, -6.8] },

  // === COLORFUL FOAM CUBE ===
  { id: 'cube-1', kind: 'cube', color: '#4285F4', size: 0.46, mass: 0.7, restitution: 0.45, spawn: [-5.6, 0.23, 2.0] },

  // === OFFICE STOOLS / OTTOMANS ===
  { id: 'cyl-1', kind: 'cylinder', color: '#6366f1', size: 0.42, mass: 0.9, restitution: 0.4, spawn: [-9.2, 0.28, 1.4] },
  { id: 'cyl-2', kind: 'cylinder', color: '#ec4899', size: 0.42, mass: 0.9, restitution: 0.4, spawn: [9.8, 0.28, 2.8] },

  // === 2 GUITARS ON TRIPOD STANDS (KNOCKABLE!) ===
  {
    id: 'guitar-electric',
    kind: 'guitar',
    guitarStyle: 'electric',
    color: '#ef4444',
    size: 0.74,
    mass: 0.95,
    restitution: 0.35,
    spawn: [-3.4, 0.74, -9.2],
    spawnRotY: 0.28,
  },
  {
    id: 'guitar-acoustic',
    kind: 'guitar',
    guitarStyle: 'acoustic',
    color: '#d99b52',
    size: 0.74,
    mass: 0.9,
    restitution: 0.35,
    spawn: [-2.1, 0.74, -9.2],
    spawnRotY: -0.22,
  },

  // === DESTRUCTIBLE 3D TECH NAME BLOCKS: "EMI" stacked on top of "CAMPOS" ===
  ...createNameBlocks('CAMPOS', 11.4, 2, 0.56),
  ...createNameBlocks('EMI', 11.4, 0, 1.68),
];

function createInitialBodies(): PropBody[] {
  return INITIAL_PROPS.map((p) => {
    const halfH =
      p.kind === 'guitar'
        ? 0.74
        : p.kind === 'letter'
          ? 0.56
          : p.kind === 'belt'
            ? 0.08
            : p.kind === 'monitor'
              ? 0.36
              : p.kind === 'vr'
                ? 0.12
                : p.kind === 'cylinder'
                  ? 0.28
                  : p.kind === 'cone'
                    ? p.size
                    : p.size * 0.5;
    const radius =
      p.kind === 'guitar'
        ? 0.44
        : p.kind === 'letter'
          ? 0.48
          : p.kind === 'belt'
            ? 0.34
            : p.kind === 'ball'
              ? p.size
              : p.kind === 'monitor'
                ? 0.45
                : p.size * 0.62;
    return {
      kind: p.kind,
      pinned: Boolean(p.pinned),
      x: p.spawn[0],
      y: p.spawn[1],
      z: p.spawn[2],
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      ry: p.spawnRotY ?? 0,
      rz: 0,
      avx: 0,
      avy: 0,
      avz: 0,
      radius,
      halfH,
      mass: p.mass,
      restitution: p.restitution,
    };
  });
}

interface PhysicsPropsProps {
  resetSignal: number;
}

const GRAVITY = 20;

export function PhysicsProps({ resetSignal }: PhysicsPropsProps) {
  const bodiesRef = useRef<PropBody[]>(createInitialBodies());
  const objectRefs = useRef<Array<THREE.Object3D | null>>([]);
  const lastKickBroadcastRef = useRef<Record<number, number>>({});

  useEffect(() => {
    bodiesRef.current = createInitialBodies();
    lastKickBroadcastRef.current = {};
  }, [resetSignal]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    const bodies = bodiesRef.current;

    // Consume remote prop kicks from other visitors in real time
    while (realtimeEvents.pendingPropKicks.length > 0) {
      const ev = realtimeEvents.pendingPropKicks.shift()!;
      const target = bodies[ev.idx];
      if (!target) continue;
      target.pinned = false;
      target.x = ev.x;
      target.y = ev.y;
      target.z = ev.z;
      target.vx = ev.vx;
      target.vy = ev.vy;
      target.vz = ev.vz;
      target.avx = ev.avx;
      target.avy = ev.avy;
      target.avz = ev.avz;
    }

    const px = characterState.x;
    const py = characterState.y;
    const pz = characterState.z;
    const pvx = characterState.vx;
    const pvz = characterState.vz;
    const pSpeed = Math.hypot(pvx, pvz);

    // 0. Check if player, flying prop, or remote visitor smashes the BJJ Belt Wall Rack!
    const remoteRackVx = realtimeEvents.pendingRackSmash;
    realtimeEvents.pendingRackSmash = null;
    let localRackHit = Math.abs(px - 0.9) < 1.55 && pz < -9.75 && (py > 0.12 || pSpeed > 1.2);
    if (!localRackHit && remoteRackVx === null) {
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.pinned) continue;
        if (
          Math.abs(b.x - 0.9) < 1.4 &&
          b.z < -10.2 &&
          b.y > 0.75 &&
          Math.hypot(b.vx, b.vy, b.vz) > 1.8
        ) {
          localRackHit = true;
          break;
        }
      }
    }
    if (localRackHit || remoteRackVx !== null) {
      const impulseVx = remoteRackVx !== null ? remoteRackVx : pvx;
      let beltIdx = 0;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.pinned && b.kind === 'belt') {
          b.pinned = false;
          b.z = -10.85;
          b.vx = (beltIdx - 2) * 1.45 + impulseVx * 0.35;
          b.vy = 2.6 + beltIdx * 0.45;
          b.vz = 4.2 + (beltIdx % 3) * 1.1;
          b.avx = 5.5 + beltIdx * 1.2;
          b.avy = (beltIdx % 2 === 0 ? 1 : -1) * 4.5;
          b.avz = (beltIdx - 2) * 2.2;
          beltIdx++;
        }
      }
      if (beltIdx > 0 && localRackHit && remoteRackVx === null) {
        realtimeEvents.sendRackSmash?.(pvx);
      }
    }

    // 1. Integrate forces, tabletop support, player collisions, furniture & walls
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.pinned) continue;
      const cosTilt = Math.abs(Math.cos(b.rx) * Math.cos(b.rz));
      const effHalfH = b.kind === 'guitar' ? 0.22 + (b.halfH - 0.22) * cosTilt : b.halfH;
      const prevBottom = b.y - effHalfH;

      // Gravity
      b.vy -= GRAVITY * dt;

      // Move
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      // Rotate
      b.rx += b.avx * dt;
      b.ry += b.avy * dt;
      b.rz += b.avz * dt;

      // Determine support surface (floor = 0, tabletop, or stacked letter block under prop)
      let supportY = 0;
      for (const box of BOX_OBSTACLES) {
        const insideX = b.x >= box.minX - 0.1 && b.x <= box.maxX + 0.1;
        const insideZ = b.z >= box.minZ - 0.1 && b.z <= box.maxZ + 0.1;
        if (insideX && insideZ && prevBottom >= box.topY - 0.18) {
          supportY = Math.max(supportY, box.topY);
        }
      }
      if (b.kind === 'letter') {
        for (let k = 0; k < bodies.length; k++) {
          if (k === i) continue;
          const other = bodies[k];
          if (other.kind !== 'letter') continue;
          const otherTop = other.y + other.halfH;
          if (
            Math.abs(b.x - other.x) < 0.88 &&
            Math.abs(b.z - other.z) < 0.52 &&
            prevBottom >= otherTop - 0.16 &&
            b.y > other.y
          ) {
            supportY = Math.max(supportY, otherTop);
          }
        }
      }

      // Floor / tabletop collision
      const minCenterY = supportY + effHalfH;
      if (b.y < minCenterY) {
        b.y = minCenterY;
        if (Math.abs(b.vy) > 1.1) {
          b.vy = -b.vy * b.restitution;
        } else {
          b.vy = 0;
        }
        const friction = Math.max(0, 1 - 4.2 * dt);
        b.vx *= friction;
        b.vz *= friction;
        b.avx *= Math.max(0, 1 - 4.5 * dt);
        b.avy *= Math.max(0, 1 - 4.5 * dt);
        b.avz *= Math.max(0, 1 - 4.5 * dt);
      }

      // Player bump collision (works both on floor and when jumping on desks!)
      const dxP = b.x - px;
      const dzP = b.z - pz;
      const dyP = Math.abs(b.y - (py + 0.65));
      const distP = Math.hypot(dxP, dzP);
      const minDistP = b.radius + characterState.radius;

      if (distP < minDistP && dyP < 1.25 && distP > 0.0001) {
        const nx = dxP / distP;
        const nz = dzP / distP;
        const overlap = minDistP - distP;
        b.x += nx * overlap;
        b.z += nz * overlap;

        const kick = Math.max(3.8, pSpeed * 1.45) / b.mass;
        b.vx += nx * kick + pvx * 0.45;
        b.vz += nz * kick + pvz * 0.45;
        b.vy = Math.max(b.vy, Math.min(6.5, (2.0 + pSpeed * 0.35) / b.mass));

        b.avx += nz * kick * 1.6;
        b.avz -= nx * kick * 1.6;
        b.avy += (nx - nz) * 2.5;

        // Broadcast kicked prop velocity/spin to other visitors (throttled per prop)
        const now = performance.now();
        const lastSent = lastKickBroadcastRef.current[i] ?? 0;
        if (now - lastSent > 110) {
          lastKickBroadcastRef.current[i] = now;
          realtimeEvents.sendPropKick?.({
            idx: i,
            x: b.x,
            y: b.y,
            z: b.z,
            vx: b.vx,
            vy: b.vy,
            vz: b.vz,
            avx: b.avx,
            avy: b.avy,
            avz: b.avz,
          });
        }
      }

      // Side-wall collision with furniture ONLY when prop is below the tabletop
      for (const box of BOX_OBSTACLES) {
        if (b.y - b.halfH >= box.topY - 0.14) continue;
        const closestX = Math.max(box.minX, Math.min(b.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(b.z, box.maxZ));
        const dx = b.x - closestX;
        const dz = b.z - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < b.radius * b.radius && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;
          b.x += nx * (b.radius - dist);
          b.z += nz * (b.radius - dist);
          const vn = b.vx * nx + b.vz * nz;
          if (vn < 0) {
            b.vx -= (1 + b.restitution) * vn * nx;
            b.vz -= (1 + b.restitution) * vn * nz;
          }
        }
      }

      // Office wall bounds bounce
      const minX = OFFICE_BOUNDS.minX + b.radius;
      const maxX = OFFICE_BOUNDS.maxX - b.radius;
      const minZ = OFFICE_BOUNDS.minZ + b.radius;
      const maxZ = OFFICE_BOUNDS.maxZ - b.radius;

      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * b.restitution;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * b.restitution;
      }
      if (b.z < minZ) {
        b.z = minZ;
        b.vz = Math.abs(b.vz) * b.restitution;
      } else if (b.z > maxZ) {
        b.z = maxZ;
        b.vz = -Math.abs(b.vz) * b.restitution;
      }
    }

    // 2. Prop-to-prop collisions
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].pinned) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        if (bodies[j].pinned) continue;
        const a = bodies[i];
        const b = bodies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dy, dz);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          const overlap = (minDist - dist) * 0.5;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          a.z -= nz * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          b.z += nz * overlap;

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const rvz = b.vz - a.vz;
          const relVel = rvx * nx + rvy * ny + rvz * nz;

          if (relVel < 0) {
            const e = Math.min(a.restitution, b.restitution);
            const impulse = (-(1 + e) * relVel) / (1 / a.mass + 1 / b.mass);
            a.vx -= (impulse / a.mass) * nx;
            a.vy -= (impulse / a.mass) * ny;
            a.vz -= (impulse / a.mass) * nz;
            b.vx += (impulse / b.mass) * nx;
            b.vy += (impulse / b.mass) * ny;
            b.vz += (impulse / b.mass) * nz;

            a.avx += nz * impulse * 0.8;
            b.avz -= nx * impulse * 0.8;
          }
        }
      }
    }

    // 3. Sync Three.js objects
    for (let i = 0; i < bodies.length; i++) {
      const obj = objectRefs.current[i];
      const b = bodies[i];
      if (!obj) continue;
      obj.position.set(b.x, b.y, b.z);
      obj.rotation.set(b.rx, b.ry, b.rz);
    }
  });

  return (
    <group>
      {INITIAL_PROPS.map((prop, idx) => {
        if (prop.kind === 'monitor') {
          const width = prop.wide ? 1.25 : 0.88;
          return (
            <group
              key={prop.id}
              ref={(el) => {
                objectRefs.current[idx] = el;
              }}
              position={prop.spawn}
              rotation={[0, prop.spawnRotY ?? 0, 0]}
            >
              {/* Stand */}
              <mesh position={[0, -0.22, 0]} castShadow>
                <boxGeometry args={[0.08, 0.28, 0.08]} />
                <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.34, 0]} castShadow>
                <boxGeometry args={[0.3, 0.04, 0.22]} />
                <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
              </mesh>
              {/* Frame */}
              <mesh position={[0, 0.08, 0]} castShadow>
                <boxGeometry args={[width, 0.54, 0.06]} />
                <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.35} />
              </mesh>
              {/* Glowing screen */}
              <mesh position={[0, 0.08, 0.036]}>
                <planeGeometry args={[width - 0.08, 0.46]} />
                <meshStandardMaterial
                  color="#0f172a"
                  emissive={prop.screenColor ?? '#38bdf8'}
                  emissiveIntensity={0.85}
                  roughness={0.15}
                />
              </mesh>
            </group>
          );
        }

        if (prop.kind === 'letter') {
          const strokes = LETTER_SHAPES[prop.letter ?? 'E'] ?? LETTER_SHAPES.E;
          return (
            <group
              key={prop.id}
              ref={(el) => {
                objectRefs.current[idx] = el;
              }}
              position={prop.spawn}
              rotation={[0, prop.spawnRotY ?? 0, 0]}
            >
              {strokes.map((s, sIdx) => (
                <group
                  key={sIdx}
                  position={[s.x, s.y, 0]}
                  rotation={[0, 0, s.rotZ ?? 0]}
                >
                  {/* Sleek dark-titanium 3D letter frame */}
                  <mesh>
                    <boxGeometry args={[s.w, s.h, 0.34]} />
                    <meshStandardMaterial
                      color="#0f172a"
                      metalness={0.78}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Crisp futuristic white-tech face with subtle neon rim */}
                  <mesh position={[0, 0, 0.175]}>
                    <boxGeometry args={[s.w * 0.82, s.h * 0.86, 0.026]} />
                    <meshStandardMaterial
                      color="#f8fafc"
                      emissive={prop.color}
                      emissiveIntensity={0.75}
                      roughness={0.15}
                    />
                  </mesh>
                  <mesh position={[0, 0, -0.175]}>
                    <boxGeometry args={[s.w * 0.82, s.h * 0.86, 0.026]} />
                    <meshStandardMaterial
                      color="#f8fafc"
                      emissive={prop.color}
                      emissiveIntensity={0.6}
                      roughness={0.15}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          );
        }

        if (prop.kind === 'belt') {
          const isBlack = prop.id === 'bjj-belt-black';
          return (
            <group
              key={prop.id}
              ref={(el) => {
                objectRefs.current[idx] = el;
              }}
              position={prop.spawn}
              rotation={[0, prop.spawnRotY ?? 0, 0]}
            >
              {/* Main folded BJJ belt bar */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.68, 0.13, 0.08]} />
                <meshStandardMaterial color={prop.color} roughness={0.82} />
              </mesh>
              {/* Center martial-arts knot */}
              <mesh position={[0, 0, 0.03]} castShadow>
                <boxGeometry args={[0.2, 0.16, 0.1]} />
                <meshStandardMaterial color={prop.color} roughness={0.78} />
              </mesh>
              {/* Rank bar sleeve (red coral bar on black belt, black bar on colored belts) */}
              <mesh position={[0.56, 0, 0.008]}>
                <boxGeometry args={[0.3, 0.138, 0.088]} />
                <meshStandardMaterial
                  color={prop.rankBarColor ?? '#0f172a'}
                  roughness={0.7}
                />
              </mesh>
              {/* Crisp white rank stripes */}
              <mesh position={[0.48, 0, 0.012]}>
                <boxGeometry args={[0.032, 0.142, 0.092]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              <mesh position={[0.56, 0, 0.012]}>
                <boxGeometry args={[0.032, 0.142, 0.092]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              {isBlack && (
                <mesh position={[0.64, 0, 0.012]}>
                  <boxGeometry args={[0.032, 0.142, 0.092]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.5} />
                </mesh>
              )}
            </group>
          );
        }

        if (prop.kind === 'vr') {
          return (
            <group
              key={prop.id}
              ref={(el) => {
                objectRefs.current[idx] = el;
              }}
              position={prop.spawn}
              rotation={[0, prop.spawnRotY ?? 0, 0]}
            >
              <mesh castShadow>
                <boxGeometry args={[0.4, 0.22, 0.24]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.125]}>
                <planeGeometry args={[0.32, 0.14]} />
                <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.9} />
              </mesh>
            </group>
          );
        }

        if (prop.kind === 'guitar') {
          const isElectric = prop.guitarStyle === 'electric';
          const bodyColor = prop.color;
          const sideColor = isElectric ? '#b91c1c' : '#854d0e';
          const neckColor = isElectric ? '#e7c396' : '#78350f';
          return (
            <group
              key={prop.id}
              ref={(el) => {
                objectRefs.current[idx] = el;
              }}
              position={prop.spawn}
              rotation={[0, prop.spawnRotY ?? 0, 0]}
            >
              {/* === BLACK METAL TRIPOD STAND (bottom at y = -0.74) === */}
              {/* Central vertical pole */}
              <mesh position={[0, -0.02, -0.14]} castShadow>
                <cylinderGeometry args={[0.022, 0.026, 0.94, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
              </mesh>
              {/* 3 splayed tripod legs */}
              <mesh position={[0, -0.58, -0.28]} rotation={[-0.58, 0, 0]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[-0.17, -0.58, -0.02]} rotation={[0.42, 0, 0.52]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.44, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0.17, -0.58, -0.02]} rotation={[0.42, 0, -0.52]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.44, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Tripod hub collar */}
              <mesh position={[0, -0.42, -0.14]}>
                <cylinderGeometry args={[0.042, 0.042, 0.07, 10]} />
                <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
              </mesh>
              {/* Lower cradle arms */}
              <mesh position={[-0.12, -0.44, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.24, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              <mesh position={[0.12, -0.44, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.24, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              {/* Upper neck yoke */}
              <mesh position={[0, 0.42, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.065, 0.014, 8, 12, Math.PI]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>

              {/* === GUITAR RESTING ON TRIPOD (slightly reclined) === */}
              <group position={[0, 0.06, 0.04]} rotation={[-0.14, 0, 0]}>
                {/* Lower bout */}
                <mesh
                  position={[0, -0.32, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry
                    args={[
                      isElectric ? 0.2 : 0.23,
                      isElectric ? 0.2 : 0.23,
                      isElectric ? 0.065 : 0.11,
                      18,
                    ]}
                  />
                  <meshStandardMaterial
                    color={bodyColor}
                    roughness={isElectric ? 0.2 : 0.55}
                    metalness={isElectric ? 0.25 : 0.05}
                  />
                </mesh>
                {/* Upper bout */}
                <mesh
                  position={[0, -0.1, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry
                    args={[
                      isElectric ? 0.165 : 0.175,
                      isElectric ? 0.165 : 0.175,
                      isElectric ? 0.065 : 0.11,
                      18,
                    ]}
                  />
                  <meshStandardMaterial
                    color={bodyColor}
                    roughness={isElectric ? 0.2 : 0.55}
                    metalness={isElectric ? 0.25 : 0.05}
                  />
                </mesh>
                {/* Center body waist fill */}
                <mesh position={[0, -0.21, 0]} castShadow>
                  <boxGeometry args={[0.25, 0.22, isElectric ? 0.064 : 0.108]} />
                  <meshStandardMaterial
                    color={sideColor}
                    roughness={isElectric ? 0.22 : 0.6}
                    metalness={isElectric ? 0.2 : 0.05}
                  />
                </mesh>

                {isElectric ? (
                  <>
                    {/* White pickguard */}
                    <mesh position={[0.03, -0.22, 0.036]}>
                      <boxGeometry args={[0.18, 0.26, 0.008]} />
                      <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                    </mesh>
                    {/* 3 single-coil pickups */}
                    <mesh position={[0, -0.15, 0.044]}>
                      <boxGeometry args={[0.11, 0.025, 0.012]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
                    </mesh>
                    <mesh position={[0, -0.22, 0.044]}>
                      <boxGeometry args={[0.11, 0.025, 0.012]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
                    </mesh>
                    <mesh position={[0, -0.29, 0.044]}>
                      <boxGeometry args={[0.11, 0.025, 0.012]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
                    </mesh>
                    {/* Metallic bridge */}
                    <mesh position={[0, -0.37, 0.042]}>
                      <boxGeometry args={[0.12, 0.045, 0.014]} />
                      <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
                    </mesh>
                  </>
                ) : (
                  <>
                    {/* Acoustic rosette & dark soundhole */}
                    <mesh position={[0, -0.18, 0.057]}>
                      <ringGeometry args={[0.062, 0.078, 18]} />
                      <meshStandardMaterial color="#fef3c7" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, -0.18, 0.058]}>
                      <circleGeometry args={[0.062, 18]} />
                      <meshStandardMaterial color="#1c1917" roughness={0.95} />
                    </mesh>
                    {/* Acoustic wood bridge */}
                    <mesh position={[0, -0.34, 0.06]}>
                      <boxGeometry args={[0.15, 0.036, 0.016]} />
                      <meshStandardMaterial color="#292524" roughness={0.7} />
                    </mesh>
                  </>
                )}

                {/* Neck */}
                <mesh position={[0, 0.27, 0.01]} castShadow>
                  <boxGeometry args={[0.062, 0.56, 0.036]} />
                  <meshStandardMaterial color={neckColor} roughness={0.5} />
                </mesh>
                {/* Fretboard */}
                <mesh position={[0, 0.25, 0.032]}>
                  <boxGeometry args={[0.056, 0.56, 0.012]} />
                  <meshStandardMaterial color="#291d16" roughness={0.75} />
                </mesh>
                {/* Strings highlight strip */}
                <mesh position={[0, 0.14, 0.042]}>
                  <boxGeometry args={[0.038, 0.88, 0.004]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
                </mesh>
                {/* Headstock */}
                <mesh position={[0, 0.61, 0.008]} castShadow>
                  <boxGeometry args={[0.095, 0.16, 0.032]} />
                  <meshStandardMaterial
                    color={isElectric ? '#e7c396' : '#451a03'}
                    roughness={0.45}
                  />
                </mesh>
                {/* Tuning pegs */}
                {[-0.04, 0.0, 0.04].map((dy, pIdx) => (
                  <group key={pIdx}>
                    <mesh position={[-0.058, 0.61 + dy, 0.008]}>
                      <boxGeometry args={[0.028, 0.018, 0.018]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.058, 0.61 + dy, 0.008]}>
                      <boxGeometry args={[0.028, 0.018, 0.018]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          );
        }

        return (
          <mesh
            key={prop.id}
            ref={(el) => {
              objectRefs.current[idx] = el;
            }}
            position={prop.spawn}
            castShadow
            receiveShadow
          >
            {prop.kind === 'ball' && <sphereGeometry args={[prop.size, 24, 24]} />}
            {prop.kind === 'box' && <boxGeometry args={[prop.size, prop.size, prop.size]} />}
            {prop.kind === 'cube' && <boxGeometry args={[prop.size, prop.size, prop.size]} />}
            {prop.kind === 'cone' && <coneGeometry args={[prop.size * 0.72, prop.size * 2, 16]} />}
            {prop.kind === 'cylinder' && (
              <cylinderGeometry args={[prop.size, prop.size, 0.56, 20]} />
            )}

            <meshStandardMaterial
              color={prop.color}
              roughness={prop.kind === 'ball' ? 0.22 : prop.kind === 'box' ? 0.82 : 0.4}
              metalness={prop.kind === 'ball' ? 0.12 : 0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}
