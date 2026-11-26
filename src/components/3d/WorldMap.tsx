import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type InteractiveZone, ZONES } from '../../data/portfolioData';
import { PatrolDrone } from './PatrolDrone';

interface WorldMapProps {
  activeZone: InteractiveZone | null;
  resetSignal: number;
  likesCount: number;
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

/** Sleek illuminated wall sign ("EMILIANO CAMPOS · DESARROLLADOR WEB") */
function WallHeroSign({
  position,
  width = 6.6,
  height = 1.55,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const signTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Deep tech dark background gradient
      const grad = ctx.createLinearGradient(0, 0, 1024, 256);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#111c3a');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 256);

      // Subtle glowing cyan border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 1004, 236);

      // Main Name
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 76px system-ui, -apple-system, sans-serif';
      ctx.fillText('EMILIANO CAMPOS', 512, 102);

      // Divider accent bar
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(340, 148, 344, 4);

      // Subtitle
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 31px system-ui, -apple-system, sans-serif';
      ctx.fillText('DESARROLLADOR WEB  ·  CREADOR DE CONTENIDO', 512, 194);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group position={position}>
      {/* Metallic backing frame */}
      <mesh castShadow>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.65} roughness={0.28} />
      </mesh>
      {/* Illuminated sign face */}
      <mesh position={[0, 0, 0.058]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={signTexture}
          emissiveMap={signTexture}
          emissive="#ffffff"
          emissiveIntensity={0.45}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/** Glowing digital LED counter mounted on the office wall showing real-time Likes */
function DigitalLikeCounter({
  position,
  likesCount,
}: {
  position: [number, number, number];
  likesCount: number;
}) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 224;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Matte black LED panel background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 224);

    // Subtle LED scanline grid tint
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 208);

    // Top label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fda4af';
    ctx.font = '700 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('♥  ME GUSTA EN VIVO', 256, 46);

    // Unlit ghost LED digits behind active digits (real digital clock/counter look)
    const formatted = String(Math.max(0, likesCount)).padStart(5, '0');
    ctx.font = '900 108px "Consolas", "Courier New", monospace';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.fillText('88888', 256, 138);

    // Glowing lit LED digits
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fb7185';
    ctx.fillText(formatted, 256, 138);
    ctx.shadowBlur = 0;

    texture.needsUpdate = true;
  }, [canvas, texture, likesCount]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group position={position}>
      {/* Matte black aluminum LED display housing */}
      <mesh>
        <boxGeometry args={[4.4, 1.95, 0.16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Glowing LED screen face */}
      <mesh position={[0, 0, 0.086]}>
        <planeGeometry args={[4.16, 1.74]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.95}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

/** Illuminated Contact Wall Board above Reception ("¿TENÉS UN PROYECTO EN MENTE?" + WhatsApp, LinkedIn, Email) */
function ContactWallSign({ position }: { position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Sleek dark slate gradient background
      const grad = ctx.createLinearGradient(0, 0, 768, 420);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 768, 420);

      // Amber/gold accent frame matching Contacto zone
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 748, 400);

      // Title
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px system-ui, -apple-system, sans-serif';
      ctx.fillText('¿TENÉS UN PROYECTO EN MENTE?', 384, 78);

      // Subtitle
      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('¡CONTACTAME Y LO HACEMOS REALIDAD!', 384, 128);

      // 3 crisp rounded icon cards: WhatsApp, LinkedIn, Email
      const cards = [
        { x: 154, color: '#25D366', kind: 'whatsapp' as const, label: 'WhatsApp' },
        { x: 384, color: '#0a66c2', kind: 'linkedin' as const, label: 'LinkedIn' },
        { x: 614, color: '#f59e0b', kind: 'email' as const, label: 'Email' },
      ];

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      for (const c of cards) {
        // Card tile background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        drawRoundRect(c.x - 95, 178, 190, 196, 22);
        ctx.fill();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 4;
        ctx.stroke();

        if (c.kind === 'whatsapp') {
          // Real WhatsApp logo: #25D366 circle + white speech-bubble outline + white phone handset
          ctx.save();
          ctx.translate(c.x, 250);

          // Green circular badge
          ctx.fillStyle = '#25D366';
          ctx.beginPath();
          ctx.arc(0, 0, 50, 0, Math.PI * 2);
          ctx.fill();

          // Authentic WhatsApp white speech-bubble ring with bottom-left tail
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6.5;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.arc(0, -1, 31, Math.PI * 0.78, Math.PI * 2.58, false);
          ctx.lineTo(-34, 33);
          ctx.closePath();
          ctx.stroke();

          // Crisp white classic WhatsApp phone handset inside
          ctx.save();
          ctx.translate(-22, -23);
          ctx.scale(1.85, 1.85);
          const phonePath = new Path2D(
            'M16.5 13.5c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.11 4.52.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z'
          );
          ctx.fillStyle = '#ffffff';
          ctx.fill(phonePath);
          ctx.restore();

          ctx.restore();
        } else if (c.kind === 'linkedin') {
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(c.x, 250, 48, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 50px system-ui, -apple-system, sans-serif';
          ctx.fillText('in', c.x, 253);
        } else {
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(c.x, 250, 48, 0, Math.PI * 2);
          ctx.fill();

          // Crisp white vector envelope
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.lineJoin = 'round';
          ctx.strokeRect(c.x - 24, 233, 48, 34);
          ctx.beginPath();
          ctx.moveTo(c.x - 24, 234);
          ctx.lineTo(c.x, 253);
          ctx.lineTo(c.x + 24, 234);
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 26px system-ui, -apple-system, sans-serif';
        ctx.fillText(c.label, c.x, 336);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3.95, 2.2, 0.12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[3.76, 2.02]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.45}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

/** Crisp 1-draw-call vector floor strip with real Facebook, YouTube, TikTok & Instagram logos */
function StudioFloorLogos({ position }: { position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1024, 256);

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      const centers = [148, 392, 636, 880];
      const cy = 108;

      // 1. FACEBOOK (#1877F2 circle + iconic white "f")
      {
        const cx = centers[0];
        ctx.fillStyle = '#1877F2';
        ctx.beginPath();
        ctx.arc(cx, cy, 66, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 108px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('f', cx + 4, cy + 12);
      }

      // 2. YOUTUBE (#FF0000 rounded rect + white play triangle)
      {
        const cx = centers[1];
        ctx.fillStyle = '#FF0000';
        drawRoundRect(cx - 76, cy - 52, 152, 104, 28);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy - 26);
        ctx.lineTo(cx - 18, cy + 26);
        ctx.lineTo(cx + 30, cy);
        ctx.closePath();
        ctx.fill();
      }

      // 3. TIKTOK (black rounded square + cyan/magenta/white musical note)
      {
        const cx = centers[2];
        ctx.fillStyle = '#09090b';
        drawRoundRect(cx - 66, cy - 66, 132, 132, 30);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 4;
        ctx.stroke();

        const drawNote = (ox: number, oy: number, color: string) => {
          ctx.save();
          ctx.translate(cx + ox, cy + oy);
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          // Vertical stem + top flag curve
          ctx.beginPath();
          ctx.moveTo(8, -36);
          ctx.lineTo(8, 22);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(28, -36, 20, Math.PI, Math.PI * 0.45, true);
          ctx.stroke();
          // Bottom note loop
          ctx.beginPath();
          ctx.arc(-10, 22, 18, 0, Math.PI * 1.65, false);
          ctx.stroke();
          ctx.restore();
        };

        drawNote(-4, -3, '#25F4EE');
        drawNote(4, 3, '#FE2C55');
        drawNote(0, 0, '#ffffff');
      }

      // 4. INSTAGRAM (signature gradient rounded square + white camera icon)
      {
        const cx = centers[3];
        const igGrad = ctx.createLinearGradient(cx - 64, cy + 64, cx + 64, cy - 64);
        igGrad.addColorStop(0, '#f9ce34');
        igGrad.addColorStop(0.5, '#ee2a7b');
        igGrad.addColorStop(1, '#6228d7');
        ctx.fillStyle = igGrad;
        drawRoundRect(cx - 66, cy - 66, 132, 132, 32);
        ctx.fill();

        // White inner camera outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 9;
        drawRoundRect(cx - 42, cy - 42, 84, 84, 22);
        ctx.stroke();

        // Camera lens circle
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Top-right flash dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 24, cy - 24, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clean follower count labels under each logo
      const labels = ['140K', '759', '25K', '17K'];
      ctx.font = '800 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f8fafc';
      labels.forEach((lbl, idx) => {
        ctx.fillText(lbl, centers[idx], 216);
      });
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      <planeGeometry args={[4.6, 1.15]} />
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.4}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={0.28}
      />
    </mesh>
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

export function WorldMap({ activeZone, resetSignal, likesCount }: WorldMapProps) {
  return (
    <group>
      {/* === FLOOR & ARCHITECTURAL DIORAMA BASE (Expanded 37.6 x 29.2 Office) === */}
      <mesh position={[1.75, -0.4, 2.55]} receiveShadow>
        <boxGeometry args={[37.9, 0.8, 29.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Modern bright concrete/carpet office floor */}
      <mesh position={[1.75, 0.005, 2.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[37.1, 28.4]} />
        <meshStandardMaterial color="#475162" roughness={0.88} />
      </mesh>
      {/* Oscars-style VIP Red Carpet with gold trim & velvet rope stanchions */}
      <group>
        {/* Main crimson velvet red carpet */}
        <mesh position={[0, 0.012, 2.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.4, 27.8]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.86} />
        </mesh>
        {/* Rich inner scarlet runner */}
        <mesh position={[0, 0.014, 2.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.7, 27.6]} />
          <meshStandardMaterial color="#dc2626" roughness={0.84} />
        </mesh>
        {/* Gold Oscars border stripes on left & right */}
        {[-2.06, 2.06].map((gx, i) => (
          <mesh key={i} position={[gx, 0.016, 2.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.14, 27.8]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#ca8a04"
              emissiveIntensity={0.25}
              metalness={0.55}
              roughness={0.28}
            />
          </mesh>
        ))}

        {/* Gold VIP stanchion posts + red velvet ropes along the carpet edges */}
        {[-2.38, 2.38].map((sx, sideIdx) => (
          <group key={sideIdx}>
            {[-2.0, 2.0, 6.0, 10.0, 14.0].map((sz, postIdx) => (
              <group key={postIdx} position={[sx, 0, sz]}>
                {/* Weighted gold base */}
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.14, 0.16, 0.06, 10]} />
                  <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.22} />
                </mesh>
                {/* Gold pole */}
                <mesh position={[0, 0.48, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.88, 8]} />
                  <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Gold top sphere */}
                <mesh position={[0, 0.95, 0]}>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color="#fde047" metalness={0.8} roughness={0.18} />
                </mesh>
              </group>
            ))}

            {/* Velvet ropes connecting front & rear pairs (leaving center walk-throughs open) */}
            {[-0.0, 8.0, 12.0].map((rz, ropeIdx) => (
              <mesh
                key={ropeIdx}
                position={[sx, 0.72, rz]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.026, 0.026, 3.9, 6]} />
                <meshStandardMaterial color="#991b1b" roughness={0.75} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

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
      <mesh position={[1.75, 3.0, -11.85]} receiveShadow castShadow>
        <boxGeometry args={[37.9, 6.0, 0.4]} />
        <meshStandardMaterial color="#e8eef5" roughness={0.75} />
      </mesh>
      <mesh position={[-16.85, 3.0, 2.55]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 6.0, 29.2]} />
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

      {/* Blue tech accent wall + Hero Sign */}
      <mesh position={[0.2, 1.55, -11.62]}>
        <boxGeometry args={[6.4, 3.1, 0.08]} />
        <meshStandardMaterial color="#2563eb" roughness={0.65} />
      </mesh>
      <WallHeroSign position={[0.2, 4.18, -11.58]} />

      {/* === JIU-JITSU BELT WALL DISPLAY RACK (Centered, light bamboo for crisp contrast) === */}
      {/* Belts themselves are destructible physics props in PhysicsProps.tsx */}
      <group position={[0.2, 1.85, -11.55]}>
        {/* Light natural bamboo backboard so Black, Brown & White belts all pop clearly */}
        <mesh receiveShadow>
          <boxGeometry args={[2.15, 1.85, 0.06]} />
          <meshStandardMaterial color="#e5c597" roughness={0.6} />
        </mesh>
        {/* Top warm-oak martial-arts header bar */}
        <mesh position={[0, 0.96, 0.03]}>
          <boxGeometry args={[2.32, 0.14, 0.1]} />
          <meshStandardMaterial color="#9a6835" roughness={0.5} />
        </mesh>
        {/* Side vertical oak rails holding the 5 belts */}
        <mesh position={[-0.96, 0, 0.04]}>
          <boxGeometry args={[0.1, 1.8, 0.06]} />
          <meshStandardMaterial color="#b4834b" roughness={0.55} />
        </mesh>
        <mesh position={[0.96, 0, 0.04]}>
          <boxGeometry args={[0.1, 1.8, 0.06]} />
          <meshStandardMaterial color="#b4834b" roughness={0.55} />
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

      {/* === MURO DE PRENSA EN LA PARED (Recorte unificado del diario + LU20) === */}
      <PressFrame
        position={[-16.62, 4.18, -1.0]}
        rotationY={Math.PI / 2}
        width={4.55}
        height={3.2}
        outlet="DIARIO EL CHUBUT · JORNADA"
        headline="Mascotas Trelew · Emiliano Campos"
        accent="#1d4ed8"
        imageUrl="/press/diario-mascotas.jpg"
      />
      {/* === CARTEL DE CONTACTO ARRIBA DE RECEPCIÓN (WhatsApp, LinkedIn, Email) === */}
      <ContactWallSign position={[5.6, 3.65, -11.58]} />

      {/* === CONTADOR DIGITAL LED DE ME GUSTA EN LA PARED === */}
      <DigitalLikeCounter position={[11.6, 3.65, -11.58]} likesCount={likesCount} />

      {/* Pedestal interactivo para dejar Me Gusta */}
      <group position={[8.8, 0, -9.2]}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.46, 0.96, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.99, 0]}>
          <cylinderGeometry args={[0.3, 0.34, 0.08, 16]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={1.6}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* White pillar with clock (positioned to the right of the Oscars red carpet) */}
      <group position={[3.6, 0, -1.65]}>
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
        <mesh position={[18.9, 1.5, -7.1]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 3.0, 2.4]} />
          <meshStandardMaterial color="#EA4335" roughness={0.45} />
        </mesh>
      </group>

      {/* ================================================================ */}
      {/* 4. ZONA DEV LAB — "PROYECTOS" (Front-Right, pushed toward edge)  */}
      {/* ================================================================ */}
      <group>
        <group position={[9.6, 0, 6.2]}>
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

        <group position={[14.8, 0, 7.6]}>
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

        <OfficeChair position={[14.8, 0, 6.0]} rotationY={0.15} color="#4285F4" />
      </group>

      {/* ================================================================ */}
      {/* 4B. STREAMER & RECORDING STUDIO DESK (Mid-Right, near edge)      */}
      {/* ================================================================ */}
      <group>
        {/* Studio acoustic rug with neon purple border */}
        <mesh position={[17.2, 0.014, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[5.2, 5.4]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
        </mesh>
        <mesh position={[14.62, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 5.4]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} />
        </mesh>
        {/* Real Facebook, YouTube, TikTok & Instagram logos printed on the studio floor */}
        <StudioFloorLogos position={[15.18, 0.024, 0.8]} />

        {/* Main White Studio Desk (walkable topY = 0.88) */}
        <group position={[17.7, 0, 0.8]}>
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
        <group position={[19.15, 0, 0.2]}>
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
        <OfficeChair position={[15.6, 0, 0.8]} rotationY={Math.PI / 2} color="#7c3aed" />
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
      <PottedPlant position={[4.5, 0, -0.35]} scale={1.3} potColor="#f8fafc" />
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
