import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraShot {
  duration: number;
  fromPos: [number, number, number];
  toPos: [number, number, number];
  fromLook: [number, number, number];
  toLook: [number, number, number];
  /** Optional custom multiplier for 9:16 vertical framing (default 1.32) */
  verticalPullback?: number;
}

/**
 * 20-second 5-shot cinematic showcase rail tuned for both 16:9 and 9:16 Reels/TikTok:
 * 1. Static centered shot: "EMI CAMPOS" intact -> robot smashes it & explodes the drone!
 * 2. Real newspaper clipping on the Press Wall (Mascotas Trelew)
 * 3. Gamer / Streamer Setup & Chair (with FB/YT/TT/IG floor logos)
 * 4. "¿Tenés un proyecto en mente?" Contact Board + Live Digital LED Likes Counter
 * 5. Grand crane-up bird's-eye reveal of the entire 3D office
 */
const CINEMA_SHOTS: CameraShot[] = [
  // 1. Static centered opening (4.3s): full "EMI CAMPOS" framed cleanly + drone explosion!
  {
    duration: 4.3,
    fromPos: [0.0, 4.3, 19.6],
    toPos: [0.0, 4.3, 19.6],
    fromLook: [0.0, 1.8, 9.0],
    toLook: [0.0, 1.8, 9.0],
    verticalPullback: 1.28,
  },
  // 2. Real newspaper clipping on the Press Wall — gentle push-in & hold cleanly on the newspaper (3.2s)
  {
    duration: 3.2,
    fromPos: [-7.6, 4.18, -1.0],
    toPos: [-8.8, 4.18, -1.0],
    fromLook: [-16.6, 4.18, -1.0],
    toLook: [-16.6, 4.18, -1.0],
    verticalPullback: 1.24,
  },
  // 3A. Dedicated slow push-in & hold right on "EMILIANO CAMPOS" hero sign (3.2s)
  {
    duration: 3.2,
    fromPos: [0.2, 4.15, -2.2],
    toPos: [0.2, 4.15, -3.4],
    fromLook: [0.2, 4.15, -11.58],
    toLook: [0.2, 4.15, -11.58],
    verticalPullback: 1.26,
  },
  // 3B. Smooth glide to settle clearly on "¿TENÉS UN NEGOCIO O EMPRESA Y QUERÉS UN SISTEMA WEB?" (3.6s)
  {
    duration: 3.6,
    fromPos: [0.2, 4.15, -3.4],
    toPos: [5.8, 4.15, -3.4],
    fromLook: [0.2, 4.15, -11.58],
    toLook: [5.8, 4.15, -11.58],
    verticalPullback: 1.26,
  },
  // 3C. Linger on Contacto sign & glide smoothly to "CONTADOR DE ME GUSTA" (3.0s)
  {
    duration: 3.0,
    fromPos: [5.8, 4.15, -3.4],
    toPos: [10.8, 4.15, -3.0],
    fromLook: [5.8, 4.15, -11.58],
    toLook: [10.8, 4.15, -11.58],
    verticalPullback: 1.26,
  },
  // 4. Streamer & Gamer Setup ("Contenido") + FB/YT/TT/IG floor logos clearly framed in 9:16 (5.5s)
  {
    duration: 5.5,
    fromPos: [-9.8, 4.6, -0.4],
    toPos: [-8.4, 4.2, -1.4],
    fromLook: [-9.5, 1.05, -7.8],
    toLook: [-9.3, 1.15, -8.1],
    verticalPullback: 1.32,
  },
  // 5. Proyectos Desk + Giant Smart TV + PCs framed cleanly with the Oscars red carpet for 5.5s!
  {
    duration: 5.5,
    fromPos: [1.6, 2.95, 5.6],
    toPos: [3.2, 2.7, 3.1],
    fromLook: [10.8, 1.85, 2.8],
    toLook: [10.8, 1.95, 2.8],
    verticalPullback: 1.26,
  },
  // 6. Drone flying over the 3D Trampoline & swooping toward the glowing Spawn Portal! (4.3s)
  {
    duration: 4.3,
    fromPos: [19.2, 5.4, 6.2],
    toPos: [5.6, 3.8, 8.2],
    fromLook: [15.4, 1.7, 11.4],
    toLook: [8.4, 1.75, 14.5],
    verticalPullback: 1.26,
  },
  // 7. Final CTA Sign: "¿QUERÉS TU PÁGINA WEB 3D PARA TU NEGOCIO? ¡CONTACTAME!" — punchy closing hold! (3.5s)
  {
    duration: 3.5,
    fromPos: [-7.8, 3.85, -7.2],
    toPos: [-9.3, 3.85, -7.2],
    fromLook: [-16.62, 3.85, -7.2],
    toLook: [-16.62, 3.85, -7.2],
    verticalPullback: 1.22,
  },
];

export const CINEMA_TOTAL_DURATION = CINEMA_SHOTS.reduce((acc, s) => acc + s.duration, 0);

/** Shared live cinema clock so Character, PatrolDrone & CinemaCamera stay 100% in sync */
export const cinemaClock = {
  active: false,
  elapsed: 0,
  resetRequested: false,
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function CinemaCamera({
  loop = true,
  onLoopRestart,
  onComplete,
}: {
  loop?: boolean;
  onLoopRestart?: () => void;
  onComplete?: () => void;
}) {
  const { camera, size } = useThree();
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const posVec = useRef(new THREE.Vector3());
  const lookVec = useRef(new THREE.Vector3());
  const offsetVec = useRef(new THREE.Vector3());

  useEffect(() => {
    elapsedRef.current = 0;
    completedRef.current = false;
    cinemaClock.active = true;
    cinemaClock.elapsed = 0;
    return () => {
      cinemaClock.active = false;
      cinemaClock.elapsed = 0;
    };
  }, []);

  useFrame((_, rawDelta) => {
    cinemaClock.active = true;
    if (cinemaClock.resetRequested) {
      cinemaClock.resetRequested = false;
      elapsedRef.current = 0;
      cinemaClock.elapsed = 0;
      completedRef.current = false;
      onLoopRestart?.();
    }
    const dt = Math.min(rawDelta, 0.05);
    const prev = elapsedRef.current;

    if (!loop && elapsedRef.current + dt >= CINEMA_TOTAL_DURATION) {
      if (!completedRef.current) {
        completedRef.current = true;
        cinemaClock.active = false;
        onComplete?.();
      }
      return;
    }

    elapsedRef.current = (elapsedRef.current + dt) % CINEMA_TOTAL_DURATION;
    cinemaClock.elapsed = elapsedRef.current;

    if (loop && elapsedRef.current < prev) {
      onLoopRestart?.();
    }

    let tCursor = elapsedRef.current;
    let shot = CINEMA_SHOTS[0];
    for (let i = 0; i < CINEMA_SHOTS.length; i++) {
      if (tCursor <= CINEMA_SHOTS[i].duration || i === CINEMA_SHOTS.length - 1) {
        shot = CINEMA_SHOTS[i];
        break;
      }
      tCursor -= CINEMA_SHOTS[i].duration;
    }

    const alpha = easeInOutCubic(Math.min(1, Math.max(0, tCursor / shot.duration)));

    posVec.current.set(
      THREE.MathUtils.lerp(shot.fromPos[0], shot.toPos[0], alpha),
      THREE.MathUtils.lerp(shot.fromPos[1], shot.toPos[1], alpha),
      THREE.MathUtils.lerp(shot.fromPos[2], shot.toPos[2], alpha)
    );
    lookVec.current.set(
      THREE.MathUtils.lerp(shot.fromLook[0], shot.toLook[0], alpha),
      THREE.MathUtils.lerp(shot.fromLook[1], shot.toLook[1], alpha),
      THREE.MathUtils.lerp(shot.fromLook[2], shot.toLook[2], alpha)
    );

    // Dynamically adapt framing for ANY mobile portrait screen (9:16, 9:19.5, 9:20, etc.)
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1) {
      const basePull = shot.verticalPullback ?? 1.28;
      // Narrower/taller phones automatically get slightly more pullback so nothing ever crops!
      const aspectFactor = Math.min(1.35, Math.max(0.92, 0.5625 / aspect));
      const pull = basePull * aspectFactor;
      offsetVec.current.copy(posVec.current).sub(lookVec.current).multiplyScalar(pull);
      posVec.current.copy(lookVec.current).add(offsetVec.current);
      if ('fov' in camera && camera.fov !== 52) {
        (camera as THREE.PerspectiveCamera).fov = 52;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    } else if ('fov' in camera && camera.fov !== 42) {
      (camera as THREE.PerspectiveCamera).fov = 42;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    camera.position.copy(posVec.current);
    camera.lookAt(lookVec.current);
  });

  return null;
}
