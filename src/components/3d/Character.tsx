import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  BOX_OBSTACLES,
  type InteractiveZone,
  OFFICE_BOUNDS,
  ZONES,
  type ZoneId,
} from '../../data/portfolioData';
import {
  characterState,
  mobileInput,
  navigationState,
} from '../../state/inputState';

interface CharacterProps {
  disabled: boolean;
  localEmote: { emoji: string; key: number } | null;
  onZoneChange: (zone: InteractiveZone | null) => void;
  onArriveAutoWalk: (zoneId: ZoneId) => void;
}

const MOVE_SPEED = 6.2;
const RUN_MULTIPLIER = 1.55;
const JUMP_VELOCITY = 8.6;
const GRAVITY = 22;
const CHARACTER_RADIUS = 0.55;

export function Character({
  disabled,
  localEmote,
  onZoneChange,
  onArriveAutoWalk,
}: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const keys = useRef<Record<string, boolean>>({});
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const walkCycle = useRef(0);
  const currentZoneId = useRef<string | null>(null);

  const { camera, gl, size } = useThree();
  const cameraTarget = useRef(new THREE.Vector3(0, 1, 0));
  const desiredCameraTarget = useRef(new THREE.Vector3(0, 1, 0));
  const desiredCameraPos = useRef(new THREE.Vector3(0, 10.5, 13.5));

  // Orbit camera state (controlled by finger drag or mouse drag on the canvas)
  const cameraYaw = useRef(0.36);
  const cameraPitch = useRef(0.68);
  const cameraDist = useRef(15.2);

  useEffect(() => {
    const dom = gl.domElement;
    dom.style.touchAction = 'none';

    const pointers = new Map<number, { x: number; y: number }>();
    let lastPinchDist: number | null = null;

    const getPinchDist = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return null;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (disabled) return;
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        // ignore if pointer cannot be captured
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        lastPinchDist = getPinchDist();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (disabled || !pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        // Two-finger pinch-to-zoom on mobile
        const nextDist = getPinchDist();
        if (nextDist !== null && lastPinchDist !== null) {
          const deltaPinch = lastPinchDist - nextDist;
          cameraDist.current = Math.max(
            9.5,
            Math.min(22, cameraDist.current + deltaPinch * 0.035)
          );
        }
        lastPinchDist = nextDist;
      } else if (pointers.size === 1) {
        // Single-finger / mouse drag to orbit camera smoothly in all directions
        cameraYaw.current -= dx * 0.008;
        cameraPitch.current = Math.max(
          0.3,
          Math.min(1.18, cameraPitch.current + dy * 0.006)
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      try {
        if (dom.hasPointerCapture(e.pointerId)) {
          dom.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      if (pointers.size < 2) {
        lastPinchDist = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!disabled) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (disabled) return;
      cameraDist.current = Math.max(
        9.5,
        Math.min(22, cameraDist.current + e.deltaY * 0.01)
      );
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointercancel', handlePointerUp);
    dom.addEventListener('lostpointercapture', handlePointerUp);
    dom.addEventListener('touchmove', handleTouchMove, { passive: false });
    dom.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointercancel', handlePointerUp);
      dom.removeEventListener('lostpointercapture', handlePointerUp);
      dom.removeEventListener('touchmove', handleTouchMove);
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl, disabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const handleBlur = () => {
      keys.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const char = groupRef.current;
    if (!char) return;

    let moveX = 0;
    let moveZ = 0;
    let wantSprint = false;

    if (!disabled) {
      if (keys.current['KeyW'] || keys.current['ArrowUp']) moveZ -= 1;
      if (keys.current['KeyS'] || keys.current['ArrowDown']) moveZ += 1;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveX -= 1;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) moveX += 1;

      // Merge virtual joystick input
      if (mobileInput.moveX !== 0 || mobileInput.moveZ !== 0) {
        moveX += mobileInput.moveX;
        moveZ += mobileInput.moveZ;
        if (mobileInput.sprint) wantSprint = true;
      }

      // Cancel auto-walk if user manually moves
      const manualInputLen = Math.hypot(moveX, moveZ);
      if (manualInputLen > 0.08) {
        navigationState.autoWalkTarget = null;
        // Rotate manual movement relative to current camera yaw so "up" always goes forward
        const cosYaw = Math.cos(cameraYaw.current);
        const sinYaw = Math.sin(cameraYaw.current);
        const worldX = moveX * cosYaw + moveZ * sinYaw;
        const worldZ = -moveX * sinYaw + moveZ * cosYaw;
        moveX = worldX;
        moveZ = worldZ;
      } else if (navigationState.autoWalkTarget) {
        const target = navigationState.autoWalkTarget;
        const dx = target.x - char.position.x;
        const dz = target.z - char.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.85) {
          const arrivedId = target.zoneId;
          navigationState.autoWalkTarget = null;
          onArriveAutoWalk(arrivedId);
        } else {
          moveX = dx / dist;
          moveZ = dz / dist;
          wantSprint = dist > 4.5;
        }
      }

      if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) {
        wantSprint = true;
      }

      if ((keys.current['Space'] || mobileInput.jumpRequested) && isGrounded.current) {
        velocityY.current = JUMP_VELOCITY;
        isGrounded.current = false;
      }
      mobileInput.jumpRequested = false;
    }

    const prevX = char.position.x;
    const prevZ = char.position.z;

    const inputLen = Math.hypot(moveX, moveZ);
    const isMoving = inputLen > 0.05;
    const isRunning = isMoving && wantSprint;
    const analogScale = Math.min(1, inputLen);
    const speed = MOVE_SPEED * (isRunning ? RUN_MULTIPLIER : 1) * analogScale;

    if (isMoving) {
      moveX /= inputLen;
      moveZ /= inputLen;

      let nextX = char.position.x + moveX * speed * delta;
      let nextZ = char.position.z + moveZ * speed * delta;

      // Resolve horizontal collisions with furniture ONLY when below the tabletop
      for (const box of BOX_OBSTACLES) {
        if (char.position.y >= box.topY - 0.18) continue;

        const closestX = Math.max(box.minX, Math.min(nextX, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(nextZ, box.maxZ));
        const dx = nextX - closestX;
        const dz = nextZ - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < CHARACTER_RADIUS * CHARACTER_RADIUS) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = CHARACTER_RADIUS - dist;
            nextX += (dx / dist) * push;
            nextZ += (dz / dist) * push;
          } else {
            nextZ = box.maxZ + CHARACTER_RADIUS;
          }
        }
      }

      // Clamp to rectangular office walls
      nextX = Math.max(
        OFFICE_BOUNDS.minX + CHARACTER_RADIUS,
        Math.min(OFFICE_BOUNDS.maxX - CHARACTER_RADIUS, nextX)
      );
      nextZ = Math.max(
        OFFICE_BOUNDS.minZ + CHARACTER_RADIUS,
        Math.min(OFFICE_BOUNDS.maxZ - CHARACTER_RADIUS, nextZ)
      );

      char.position.x = nextX;
      char.position.z = nextZ;

      // Smoothly rotate character toward movement direction
      const targetAngle = Math.atan2(moveX, moveZ);
      let angleDiff = targetAngle - char.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      char.rotation.y += angleDiff * Math.min(1, delta * 12);
    }

    // Compute walkable support height (floor = 0 or tabletop of any desk/sofa under player)
    const prevY = char.position.y;
    let supportY = 0;
    for (const box of BOX_OBSTACLES) {
      const overX =
        char.position.x >= box.minX - 0.18 && char.position.x <= box.maxX + 0.18;
      const overZ =
        char.position.z >= box.minZ - 0.18 && char.position.z <= box.maxZ + 0.18;
      if (overX && overZ && prevY >= box.topY - 0.22) {
        supportY = Math.max(supportY, box.topY);
      }
    }

    // Vertical jump, landing on tables, and walking off edges
    if (char.position.y > supportY || velocityY.current > 0) {
      isGrounded.current = false;
      velocityY.current -= GRAVITY * delta;
      char.position.y += velocityY.current * delta;
      if (char.position.y <= supportY) {
        char.position.y = supportY;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    } else {
      char.position.y = supportY;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    // Procedural limb & body animation
    const t = state.clock.elapsedTime;
    if (isMoving && isGrounded.current) {
      walkCycle.current += delta * (isRunning ? 15 : 10);
      const swing = Math.sin(walkCycle.current) * (isRunning ? 0.75 : 0.52);
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.85;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.85;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(walkCycle.current)) * 0.1;
      }
    } else {
      // Smoothly return limbs to idle
      const damp = Math.min(1, delta * 10);
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 1 - damp;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 1 - damp;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 1 - damp;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 1 - damp;
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2.6) * 0.035;
      }
    }

    // Publish live position, rotation & velocity for PhysicsProps & Realtime broadcast
    characterState.x = char.position.x;
    characterState.y = char.position.y;
    characterState.z = char.position.z;
    characterState.rotY = char.rotation.y;
    characterState.vx = (char.position.x - prevX) / Math.max(delta, 0.001);
    characterState.vz = (char.position.z - prevZ) / Math.max(delta, 0.001);

    // Check interactive zone proximity
    let foundZone: InteractiveZone | null = null;
    for (const zone of ZONES) {
      const dist = Math.hypot(
        char.position.x - zone.position[0],
        char.position.z - zone.position[2]
      );
      if (dist <= zone.radius) {
        foundZone = zone;
        break;
      }
    }
    const nextZoneId = foundZone ? foundZone.id : null;
    if (nextZoneId !== currentZoneId.current) {
      currentZoneId.current = nextZoneId;
      onZoneChange(foundZone);
    }

    // Smooth spherical follow camera controlled by finger/mouse drag
    const isPortrait = size.height > size.width;
    const dist = isPortrait ? cameraDist.current * 1.16 : cameraDist.current;
    const horiz = Math.cos(cameraPitch.current) * dist;
    const vert = Math.sin(cameraPitch.current) * dist;

    desiredCameraPos.current.set(
      char.position.x + Math.sin(cameraYaw.current) * horiz,
      char.position.y + 0.9 + vert,
      char.position.z + Math.cos(cameraYaw.current) * horiz
    );
    camera.position.lerp(desiredCameraPos.current, Math.min(1, delta * 9));

    desiredCameraTarget.current.set(
      char.position.x,
      char.position.y + 0.95,
      char.position.z
    );
    cameraTarget.current.lerp(desiredCameraTarget.current, Math.min(1, delta * 10));
    camera.lookAt(cameraTarget.current);
  });

  return (
    <group ref={groupRef} position={[0, 0, 2.2]}>
      {/* Floating emoji speech bubble above your robot */}
      {localEmote && (
        <Html position={[0, 2.85, 0]} center style={{ pointerEvents: 'none' }}>
          <div key={localEmote.key} className="robot-emote-bubble">
            {localEmote.emoji}
          </div>
        </Html>
      )}

      {/* Ground contact shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.28} />
      </mesh>

      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[0.66, 0.72, 0.42]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.45} />
        </mesh>

        {/* Backpack */}
        <mesh position={[0, 1.08, -0.3]} castShadow>
          <boxGeometry args={[0.46, 0.52, 0.24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
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
            emissive="#38bdf8"
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
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.6}
          />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.45, 1.04, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.45} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.45, 1.04, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.22]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.45} />
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
    </group>
  );
}
