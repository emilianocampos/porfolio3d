import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type InteractiveZone, ZONES } from '../../data/portfolioData';
import { PatrolDrone } from './PatrolDrone';

interface WorldMapProps {
  activeZone: InteractiveZone | null;
  resetSignal: number;
}

/**
 * Framed newspaper/radio press clipping for the office wall.
 * Automatically loads a real image from `public/press/<file>` when present,
 * and shows a stylized newspaper/radio clipping fallback meanwhile.
 */
function PressFrame({
  position,
  rotationY = 0,
  width = 1.7,
  height = 2.1,
  outlet,
  headline,
  accent,
  imageUrl,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  outlet: string;
  headline: string;
  accent: string;
  imageUrl: string;
}) {
  const [photoTexture, setPhotoTexture] = useState<THREE.Texture | null>(null);

  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paper background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 640);

      // Newspaper / radio header band
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 512, 118);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(outlet, 256, 72);

      // Headline
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(headline, 256, 178);

      // Photo placeholder area
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(42, 210, 428, 255);
      ctx.fillStyle = '#64748b';
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillText('Foto de Prensa', 256, 330);
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(imageUrl, 256, 368);

      // Faux article lines
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(42, 495 + i * 26, i === 3 ? 280 : 428, 12);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [outlet, headline, accent, imageUrl]);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setPhotoTexture(tex);
    };
    img.onerror = () => {
      // Keep clean stylized newspaper fallback until user adds the photo
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const activeMap = photoTexture ?? fallbackTexture;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Dark wood/metal frame */}
      <mesh castShadow>
        <boxGeometry args={[width + 0.18, height + 0.18, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Press photo / clipping */}
      <mesh position={[0, 0, 0.048]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={activeMap} roughness={0.55} />
      </mesh>
    </group>
  );
}

/** Floating glowing 3D icon above a PC / station */
function FloatingStationIcon({
  position,
  color,
  isActive,
}: {
  position: [number, number, number];
  color: string;
  isActive: boolean;
}) {
  const iconRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = isActive ? 2.4 : 1.0;
    if (iconRef.current) {
      iconRef.current.rotation.y = t * speed;
      iconRef.current.position.y = position[1] + Math.sin(t * 2.8) * 0.12;
      const targetScale = isActive ? 1.22 : 1;
      const nextScale = THREE.MathUtils.lerp(
        iconRef.current.scale.x,
        targetScale,
        0.12
      );
      iconRef.current.scale.setScalar(nextScale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * speed * 0.8;
    }
  });

  return (
    <group ref={iconRef} position={position}>
      {/* Glowing diamond/crystal core */}
      <mesh castShadow>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 2.2 : 1.1}
          roughness={0.15}
          metalness={0.35}
        />
      </mesh>
      {/* Orbiting glowing halo ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[0.38, 0.032, 10, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 2.0 : 0.9}
        />
      </mesh>
    </group>
  );
}

function PottedPlant({
  position,
  scale = 1,
  potColor = '#f8fafc',
}: {
  position: [number, number, number];
  scale?: number;
  potColor?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.17, 0.5, 12]} />
        <meshStandardMaterial color={potColor} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <dodecahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color="#2e8b57" roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 0.88, 0.12]} castShadow>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#34A853" roughness={0.7} />
      </mesh>
      <mesh position={[-0.18, 0.84, -0.08]} castShadow>
        <dodecahedronGeometry args={[0.23, 0]} />
        <meshStandardMaterial color="#228B22" roughness={0.7} />
      </mesh>
    </group>
  );
}

function OfficeChair({
  position,
  rotationY = 0,
  color = '#4285F4',
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.08, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.64, 0.12, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.92, -0.26]} castShadow>
        <boxGeometry args={[0.6, 0.74, 0.11]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </group>
  );
}

function Monitor({
  position,
  rotationY = 0,
  screenColor = '#38bdf8',
  wide = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  screenColor?: string;
  wide?: boolean;
}) {
  const width = wide ? 1.25 : 0.88;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.08]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.28, 0.03, 0.22]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[width, 0.54, 0.06]} />
        <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.45, 0.035]}>
        <planeGeometry args={[width - 0.08, 0.46]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={screenColor}
          emissiveIntensity={0.8}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

function ZonePad({
  zone,
  isActive,
}: {
  zone: InteractiveZone;
  isActive: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.035;
    ringRef.current.scale.set(
      isActive ? pulse * 1.07 : pulse,
      isActive ? pulse * 1.07 : pulse,
      1
    );
  });

  // Compact glowing circle centered directly on top of each table/desk, aligned with the floating icon
  const padRadius = 0.78;
  const [padX, padY, padZ] = zone.padPosition;

  return (
    <group>
      {/* Glowing circle centered on the desk/table */}
      <group position={[padX, padY, padZ]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[padRadius - 0.08, 32]} />
          <meshStandardMaterial
            color={zone.color}
            transparent
            opacity={isActive ? 0.42 : 0.2}
            roughness={0.4}
          />
        </mesh>

        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[padRadius - 0.12, padRadius, 36]} />
          <meshStandardMaterial
            color={zone.color}
            emissive={zone.color}
            emissiveIntensity={isActive ? 2.4 : 1.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating 3D icon directly above the table circle and right below the label */}
      <FloatingStationIcon
        position={[padX, zone.labelPosition[1] - 0.68, padZ]}
        color={zone.color}
        isActive={isActive}
      />
    </group>
  );
}

export function WorldMap({ activeZone, resetSignal }: WorldMapProps) {
  return (
    <group>
      {/* === FLOOR & ARCHITECTURAL DIORAMA BASE (Expanded 34 x 24 Office) === */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[34.4, 0.8, 24.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Modern bright concrete/carpet office floor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[33.6, 23.6]} />
        <meshStandardMaterial color="#475162" roughness={0.88} />
      </mesh>
      {/* Wide light-wood central walkway */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.4, 23.0]} />
        <meshStandardMaterial color="#d4b483" roughness={0.65} />
      </mesh>

      {/* Drone Landing Pad ("H") near center */}
      <group position={[0, 0.018, -5.4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.24, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.1}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.02, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      </group>

      {/* === CUTAWAY L-SHAPED GOOGLE CAMPUS WALLS === */}
      <mesh position={[0, 3.0, -11.85]} receiveShadow castShadow>
        <boxGeometry args={[34.4, 6.0, 0.4]} />
        <meshStandardMaterial color="#e8eef5" roughness={0.75} />
      </mesh>
      <mesh position={[-16.85, 3.0, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 6.0, 24.4]} />
        <meshStandardMaterial color="#dce4ee" roughness={0.75} />
      </mesh>

      {/* Google 4-color signature neon light bars along upper back wall */}
      {[
        { x: -11.2, c: '#4285F4' },
        { x: -3.8, c: '#EA4335' },
        { x: 3.8, c: '#FBBC05' },
        { x: 11.2, c: '#34A853' },
      ].map((bar, i) => (
        <mesh key={i} position={[bar.x, 5.5, -11.62]}>
          <boxGeometry args={[6.2, 0.16, 0.08]} />
          <meshStandardMaterial
            color={bar.c}
            emissive={bar.c}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* Blue tech accent wall + Dartboard */}
      <mesh position={[0.2, 1.55, -11.62]}>
        <boxGeometry args={[6.4, 3.1, 0.08]} />
        <meshStandardMaterial color="#2563eb" roughness={0.65} />
      </mesh>
      <group position={[-1.6, 2.25, -11.55]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.06, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <circleGeometry args={[0.31, 20]} />
          <meshStandardMaterial color="#EA4335" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[0.14, 20]} />
          <meshStandardMaterial color="#34A853" />
        </mesh>
      </group>

      {/* === JIU-JITSU BELT WALL DISPLAY RACK (Back Wall, right of dartboard) === */}
      {/* Belts themselves are destructible physics props in PhysicsProps.tsx */}
      <group position={[0.9, 1.85, -11.55]}>
        {/* Dark walnut wooden backboard */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.15, 1.85, 0.06]} />
          <meshStandardMaterial color="#3b2314" roughness={0.65} />
        </mesh>
        {/* Top martial-arts header bar */}
        <mesh position={[0, 0.96, 0.03]} castShadow>
          <boxGeometry args={[2.3, 0.14, 0.1]} />
          <meshStandardMaterial color="#1f1209" roughness={0.5} />
        </mesh>
        {/* Side vertical rails holding the 5 belts */}
        <mesh position={[-0.96, 0, 0.04]}>
          <boxGeometry args={[0.1, 1.8, 0.06]} />
          <meshStandardMaterial color="#27160b" roughness={0.6} />
        </mesh>
        <mesh position={[0.96, 0, 0.04]}>
          <boxGeometry args={[0.1, 1.8, 0.06]} />
          <meshStandardMaterial color="#27160b" roughness={0.6} />
        </mesh>
      </group>

      {/* === WINDOW WITH WOODEN VENETIAN BLINDS === */}
      <group position={[-9.5, 3.3, -11.62]}>
        <mesh>
          <planeGeometry args={[5.4, 2.5]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive="#fde68a"
            emissiveIntensity={1.25}
          />
        </mesh>
        {Array.from({ length: 10 }).map((_, idx) => (
          <mesh key={idx} position={[0, 1.08 - idx * 0.24, 0.05]} castShadow>
            <boxGeometry args={[5.5, 0.09, 0.08]} />
            <meshStandardMaterial color="#c48a47" roughness={0.65} />
          </mesh>
        ))}
        <mesh position={[0, 1.3, 0.08]} castShadow>
          <boxGeometry args={[5.7, 0.16, 0.14]} />
          <meshStandardMaterial color="#a16a2f" roughness={0.6} />
        </mesh>
      </group>

      {/* === MURO DE PRENSA EN LA PARED (Diario Jornada, El Chubut, LU20) === */}
      <PressFrame
        position={[-16.62, 3.25, -2.4]}
        rotationY={Math.PI / 2}
        width={1.9}
        height={2.35}
        outlet="DIARIO JORNADA"
        headline="App Mascotas Perdidas"
        accent="#1d4ed8"
        imageUrl="/press/jornada.jpg"
      />
      <PressFrame
        position={[-16.62, 3.25, 0.4]}
        rotationY={Math.PI / 2}
        width={1.9}
        height={2.35}
        outlet="DIARIO EL CHUBUT"
        headline="Mascotas Encontradas"
        accent="#dc2626"
        imageUrl="/press/chubut.jpg"
      />
      <PressFrame
        position={[5.4, 3.55, -11.62]}
        rotationY={0}
        width={2.9}
        height={1.95}
        outlet="LU20 RADIO CHUBUT"
        headline="Entrevista en Vivo"
        accent="#f59e0b"
        imageUrl="/press/lu20.jpg"
      />

      {/* Central white pillar with clock */}
      <group position={[0, 0, -1.65]}>
        <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 6.0, 1.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
        </mesh>
        <mesh position={[0, 6.02, 0]} castShadow>
          <boxGeometry args={[1.45, 0.24, 1.45]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.85, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.08, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 3.85, 0.67]}>
          <circleGeometry args={[0.34, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.75, 0.62]}>
          <planeGeometry args={[0.58, 0.74]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.5} />
        </mesh>
      </group>

      {/* ================================================================ */}
      {/* 1. ZONA LOUNGE — "SOBRE MÍ" (Back-Left)                          */}
      {/* ================================================================ */}
      <group>
        <mesh position={[-9.5, 0.014, -6.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7.8, 5.2]} />
          <meshStandardMaterial color="#4285F4" roughness={0.92} />
        </mesh>
        <mesh position={[-9.5, 0.016, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.2, 3.2]} />
          <meshStandardMaterial color="#93c5fd" roughness={0.92} />
        </mesh>

        {/* Navy armchair */}
        <group position={[-13.1, 0, -9.35]} rotation={[0, 0.25, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.65, 1.35]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.9, -0.52]} castShadow>
            <boxGeometry args={[1.65, 0.75, 0.32]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <mesh position={[-0.72, 0.62, 0]} castShadow>
            <boxGeometry args={[0.24, 0.52, 1.32]} />
            <meshStandardMaterial color="#172e4c" roughness={0.75} />
          </mesh>
          <mesh position={[0.72, 0.62, 0]} castShadow>
            <boxGeometry args={[0.24, 0.52, 1.32]} />
            <meshStandardMaterial color="#172e4c" roughness={0.75} />
          </mesh>
        </group>

        {/* Red beanbag */}
        <mesh position={[-5.4, 0.55, -9.2]} scale={[1.15, 0.82, 1.0]} castShadow>
          <sphereGeometry args={[0.88, 18, 16]} />
          <meshStandardMaterial color="#EA4335" roughness={0.8} />
        </mesh>

        {/* Coffee table */}
        <group position={[-9.5, 0, -7.2]}>
          <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.08, 1.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.1} />
          </mesh>
          {[
            [-1.0, 0.28, -0.5],
            [1.0, 0.28, -0.5],
            [-1.0, 0.28, 0.5],
            [1.0, 0.28, 0.5],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.06, 0.56, 0.06]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
            </mesh>
          ))}
          <PottedPlant position={[-0.7, 0.6, 0]} scale={0.42} potColor="#f472b6" />
          <mesh position={[0.6, 0.69, 0.1]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.16, 12]} />
            <meshStandardMaterial color="#FBBC05" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ================================================================ */}
      {/* 2. ZONA MEDIOS — Mesa de Prensa (Mid-Left Wall)                  */}
      {/* ================================================================ */}
      <group position={[-15.4, 0, -1.0]}>
        <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.12, 2.7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.25} />
        </mesh>
        {[
          [-0.75, 0.41, -1.15],
          [0.75, 0.41, -1.15],
          [-0.75, 0.41, 1.15],
          [0.75, 0.41, 1.15],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <boxGeometry args={[0.1, 0.82, 0.1]} />
            <meshStandardMaterial color="#475569" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ================================================================ */}
      {/* 3. ZONA RECEPCIÓN ("CONTACTO") & ESPERA ("RESEÑAS") (Back-Right) */}
      {/* ================================================================ */}
      <group>
        <group position={[4.5, 0, -9.2]}>
          <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 1.1, 1.3]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.14, 0.05]} castShadow>
            <boxGeometry args={[3.75, 0.1, 1.4]} />
            <meshStandardMaterial color="#4285F4" roughness={0.3} />
          </mesh>
        </group>

        {/* 3 Google-colored recycling bins */}
        {[
          { x: 2.9, color: '#4285F4' },
          { x: 3.55, color: '#34A853' },
          { x: 4.2, color: '#FBBC05' },
        ].map((bin, idx) => (
          <group key={idx} position={[bin.x, 0, -8.2]}>
            <mesh position={[0, 0.36, 0]} castShadow>
              <boxGeometry args={[0.5, 0.72, 0.45]} />
              <meshStandardMaterial color="#475569" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.74, 0]} castShadow>
              <boxGeometry args={[0.52, 0.08, 0.47]} />
              <meshStandardMaterial color={bin.color} roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Water cooler */}
        <group position={[7.4, 0, -10.2]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.62, 1.24, 0.62]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.62, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent
              opacity={0.78}
              roughness={0.1}
              metalness={0.1}
            />
          </mesh>
        </group>

        {/* Red circular rug (Zona Reseñas) + Waiting sofa */}
        <mesh position={[12.0, 0.015, -5.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[2.6, 36]} />
          <meshStandardMaterial color="#EA4335" roughness={0.85} />
        </mesh>

        <group position={[12.1, 0, -9.55]}>
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.62, 1.35]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.88, -0.52]} castShadow>
            <boxGeometry args={[3.5, 0.76, 0.32]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <mesh position={[-1.15, 0.82, -0.15]} rotation={[0.1, 0.2, 0.15]} castShadow>
            <boxGeometry args={[0.55, 0.48, 0.22]} />
            <meshStandardMaterial color="#34A853" roughness={0.8} />
          </mesh>
          <mesh position={[1.15, 0.82, -0.15]} rotation={[0.1, -0.2, -0.15]} castShadow>
            <boxGeometry args={[0.55, 0.48, 0.22]} />
            <meshStandardMaterial color="#FBBC05" roughness={0.8} />
          </mesh>
        </group>

        {/* Tall Google-red storage locker */}
        <mesh position={[15.5, 1.5, -7.1]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 3.0, 2.4]} />
          <meshStandardMaterial color="#EA4335" roughness={0.45} />
        </mesh>
      </group>

      {/* ================================================================ */}
      {/* 4. ZONA DEV LAB — "PROYECTOS" (Front-Right)                      */}
      {/* ================================================================ */}
      <group>
        <group position={[4.6, 0, 6.2]}>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 1.9, 3.7]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.35} />
          </mesh>
          {[0.45, 0.8, 1.15, 1.5].map((y, i) => (
            <mesh key={i} position={[0.72, y, -0.9]}>
              <boxGeometry args={[0.04, 0.08, 1.1]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#34A853' : '#38bdf8'}
                emissive={i % 2 === 0 ? '#34A853' : '#38bdf8'}
                emissiveIntensity={1.6}
              />
            </mesh>
          ))}
        </group>

        <group position={[9.8, 0, 7.6]}>
          <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.1, 0.12, 2.0]} />
            <meshStandardMaterial color="#c2854c" roughness={0.55} />
          </mesh>
          {[
            [-2.35, 0.41, -0.85],
            [2.35, 0.41, -0.85],
            [-2.35, 0.41, 0.85],
            [2.35, 0.41, 0.85],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.12, 0.82, 0.12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
        </group>

        <OfficeChair position={[9.8, 0, 6.0]} rotationY={0.15} color="#4285F4" />
      </group>

      {/* ================================================================ */}
      {/* 4B. STREAMER & RECORDING STUDIO DESK (Mid-Right)                 */}
      {/* ================================================================ */}
      <group>
        {/* Studio acoustic rug with neon purple border */}
        <mesh position={[13.2, 0.014, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[5.2, 5.4]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
        </mesh>
        <mesh position={[10.62, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 5.4]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>

        {/* Main White Studio Desk (walkable topY = 0.88) */}
        <group position={[13.7, 0, 0.8]}>
          {/* Tabletop */}
          <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.12, 3.7]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.28} metalness={0.08} />
          </mesh>
          {/* RGB Neon Edge Strip (purple/magenta) */}
          <mesh position={[-1.11, 0.82, 0]}>
            <boxGeometry args={[0.04, 0.05, 3.68]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={2.0} />
          </mesh>
          {/* Desk Legs */}
          {[
            [-0.95, 0.41, -1.65],
            [0.95, 0.41, -1.65],
            [-0.95, 0.41, 1.65],
            [0.95, 0.41, 1.65],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.1, 0.82, 0.1]} />
              <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.3} />
            </mesh>
          ))}

          {/* Left & Right KRK-style Studio Monitor Speakers */}
          {[-1.48, 1.48].map((dz, idx) => (
            <group key={idx} position={[0.45, 1.12, dz]} rotation={[0, idx === 0 ? -0.25 : 0.25, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.38, 0.48, 0.34]} />
                <meshStandardMaterial color="#111827" roughness={0.45} />
              </mesh>
              {/* Yellow woofer cone */}
              <mesh position={[-0.195, -0.06, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.11, 16]} />
                <meshStandardMaterial color="#facc15" roughness={0.35} />
              </mesh>
              {/* Tweeter */}
              <mesh position={[-0.195, 0.12, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.05, 12]} />
                <meshStandardMaterial color="#334155" roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Stream Deck & Audio Interface on desk */}
          <group position={[-0.35, 0.91, -0.78]}>
            <mesh castShadow>
              <boxGeometry args={[0.36, 0.06, 0.52]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} />
            </mesh>
            {/* Glowing RGB stream buttons */}
            {[-0.14, 0, 0.14].map((bz, bi) => (
              <mesh key={bi} position={[-0.04, 0.035, bz]}>
                <boxGeometry args={[0.09, 0.015, 0.09]} />
                <meshStandardMaterial
                  color={bi === 0 ? '#ec4899' : bi === 1 ? '#38bdf8' : '#a855f7'}
                  emissive={bi === 0 ? '#ec4899' : bi === 1 ? '#38bdf8' : '#a855f7'}
                  emissiveIntensity={1.6}
                />
              </mesh>
            ))}
          </group>

          {/* Studio Condenser Microphone on Articulated Boom Arm */}
          <group position={[-0.15, 0.88, 0.95]}>
            {/* Desk clamp + lower arm */}
            <mesh position={[0, 0.28, 0]} rotation={[0.25, 0, 0.35]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.62, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
            </mesh>
            {/* Upper boom arm reaching toward streamer */}
            <mesh position={[-0.35, 0.56, -0.28]} rotation={[0.4, 0, 1.15]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.62, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
            </mesh>
            {/* Broadcast Mic body + foam windscreen */}
            <mesh position={[-0.64, 0.58, -0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.048, 0.045, 0.24, 12]} />
              <meshStandardMaterial color="#1f2937" roughness={0.75} />
            </mesh>
            {/* Red glowing mute/live ring on mic */}
            <mesh position={[-0.56, 0.58, -0.45]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.048, 0.008, 8, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} />
            </mesh>
          </group>

          {/* Pro Streaming Cinema/DSLR Camera mounted high above monitors */}
          <group position={[0.45, 2.02, 0.0]}>
            {/* Tall desktop mount pole reaching down to desk */}
            <mesh position={[0, -0.57, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.03, 1.14, 10]} />
              <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.3} />
            </mesh>
            {/* Camera main body */}
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.24, 0.38]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.25} />
            </mesh>
            {/* Top viewfinder hump */}
            <mesh position={[0.02, 0.15, 0]} castShadow>
              <boxGeometry args={[0.16, 0.09, 0.16]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} />
            </mesh>
            {/* Big pro lens barrel pointing toward streamer (-X) */}
            <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.105, 0.088, 0.24, 18]} />
              <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.2} />
            </mesh>
            {/* Red Canon-style pro lens accent ring */}
            <mesh position={[-0.31, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.102, 0.01, 8, 20]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
            </mesh>
            {/* Reflective glass lens front */}
            <mesh position={[-0.365, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <circleGeometry args={[0.088, 18]} />
              <meshStandardMaterial
                color="#0ea5e9"
                emissive="#38bdf8"
                emissiveIntensity={0.85}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Flip-out side preview LCD screen */}
            <mesh position={[-0.02, 0, -0.32]} rotation={[0, -0.35, 0]}>
              <boxGeometry args={[0.03, 0.17, 0.24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[-0.038, 0, -0.32]} rotation={[0, -Math.PI / 2 - 0.35, 0]}>
              <planeGeometry args={[0.21, 0.14]} />
              <meshStandardMaterial color="#0f172a" emissive="#a855f7" emissiveIntensity={1.3} />
            </mesh>
            {/* Bright glowing red REC tally light on top */}
            <mesh position={[-0.08, 0.21, 0]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.0} />
            </mesh>
          </group>
        </group>

        {/* Tall LED Ring Light on tripod behind the studio desk */}
        <group position={[15.15, 0, 0.2]}>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.032, 2.1, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.28, 0.34, 0.06, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          {/* Glowing LED Ring */}
          <mesh position={[-0.05, 2.15, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.36, 0.042, 12, 28]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fef3c7"
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>

        {/* Purple Gaming / Streamer Chair facing the studio desk (+X) */}
        <OfficeChair position={[11.6, 0, 0.8]} rotationY={Math.PI / 2} color="#7c3aed" />
      </group>

      {/* ================================================================ */}
      {/* 5. ZONA INNOVACIÓN & STACK — "SKILLS" (Front-Left)               */}
      {/* ================================================================ */}
      <group>
        <group position={[-14.2, 0, 6.8]}>
          <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.12, 3.7]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.25} />
          </mesh>
          {[
            [-0.95, 0.41, -1.65],
            [0.95, 0.41, -1.65],
            [-0.95, 0.41, 1.65],
            [0.95, 0.41, 1.65],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <boxGeometry args={[0.1, 0.82, 0.1]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Whiteboard with colorful sticky notes */}
        <group position={[-16.62, 2.55, 6.8]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[3.8, 1.9, 0.08]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[3.6, 1.7]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.45} />
          </mesh>
          {[
            { x: -1.1, y: 0.35, c: '#4285F4' },
            { x: -0.45, y: 0.38, c: '#EA4335' },
            { x: 0.2, y: 0.3, c: '#FBBC05' },
            { x: 0.85, y: 0.35, c: '#34A853' },
            { x: -0.75, y: -0.25, c: '#a78bfa' },
            { x: 0.35, y: -0.3, c: '#f472b6' },
          ].map((n, i) => (
            <mesh key={i} position={[n.x, n.y, 0.06]}>
              <planeGeometry args={[0.42, 0.36]} />
              <meshStandardMaterial color={n.c} roughness={0.65} />
            </mesh>
          ))}
        </group>

        <OfficeChair position={[-12.4, 0, 6.8]} rotationY={-Math.PI / 2} color="#ec4899" />
      </group>

      {/* Lush office plants */}
      <PottedPlant position={[1.1, 0, 0.4]} scale={1.3} potColor="#f8fafc" />
      <PottedPlant position={[-15.4, 0, 2.6]} scale={1.2} potColor="#e2e8f0" />
      <PottedPlant position={[14.5, 0, 8.8]} scale={1.25} potColor="#f8fafc" />
      <PottedPlant position={[-15.4, 0, -5.8]} scale={1.2} potColor="#f8fafc" />

      {/* Autonomous Flying Drone (smashable by jumping into it!) */}
      <PatrolDrone resetSignal={resetSignal} />

      {/* Interactive Zone Pads */}
      {ZONES.map((zone) => (
        <ZonePad
          key={zone.id}
          zone={zone}
          isActive={activeZone?.id === zone.id}
        />
      ))}
    </group>
  );
}
