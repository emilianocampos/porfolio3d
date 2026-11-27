import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  type InteractiveZone,
  SPAWN_PORTAL,
  TRAMPOLINE,
  ZONES,
} from '../../data/portfolioData';
import { PatrolDrone } from './PatrolDrone';

interface WorldMapProps {
  activeZone: InteractiveZone | null;
  resetSignal: number;
  likesCount: number;
  onOpenPressImage: (imageUrl: string) => void;
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
  onSelect,
}: {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  outlet: string;
  headline: string;
  accent: string;
  imageUrl: string;
  onSelect?: () => void;
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
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (onSelect) document.body.style.cursor = 'auto';
      }}
    >
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
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('♥  CONTADOR DE ME GUSTA', 256, 46);

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

/** Illuminated Contact Wall Board above Reception ("¿TENÉS UN NEGOCIO O EMPRESA Y QUERÉS UN SISTEMA WEB?" + WhatsApp, LinkedIn, Email) */
function ContactWallSign({ position }: { position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Sleek dark slate gradient background
      const grad = ctx.createLinearGradient(0, 0, 840, 460);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 840, 460);

      // Amber/gold accent frame with generous inner padding
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 7;
      ctx.strokeRect(18, 18, 804, 424);

      // Bigger, high-impact two-line headline
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px system-ui, -apple-system, sans-serif';
      ctx.fillText('¿TENÉS UN NEGOCIO O EMPRESA', 420, 76);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Y QUERÉS UN SISTEMA WEB?', 420, 128);

      // Crisp subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('¡CONTACTAME Y LO HACEMOS REALIDAD!', 420, 174);

      // 3 crisp rounded icon cards: WhatsApp, LinkedIn, Email
      const cards = [
        { x: 174, color: '#25D366', kind: 'whatsapp' as const, label: 'WhatsApp' },
        { x: 420, color: '#0a66c2', kind: 'linkedin' as const, label: 'LinkedIn' },
        { x: 666, color: '#f59e0b', kind: 'email' as const, label: 'Email' },
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
        drawRoundRect(c.x - 98, 210, 196, 198, 22);
        ctx.fill();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 4;
        ctx.stroke();

        if (c.kind === 'whatsapp') {
          ctx.save();
          ctx.translate(c.x, 282);

          ctx.fillStyle = '#25D366';
          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6.5;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.arc(0, -1, 30, Math.PI * 0.78, Math.PI * 2.58, false);
          ctx.lineTo(-33, 32);
          ctx.closePath();
          ctx.stroke();

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
          ctx.arc(c.x, 282, 46, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 48px system-ui, -apple-system, sans-serif';
          ctx.fillText('in', c.x, 285);
        } else {
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(c.x, 282, 46, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.lineJoin = 'round';
          ctx.strokeRect(c.x - 24, 265, 48, 34);
          ctx.beginPath();
          ctx.moveTo(c.x - 24, 266);
          ctx.lineTo(c.x, 285);
          ctx.lineTo(c.x + 24, 266);
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 26px system-ui, -apple-system, sans-serif';
        ctx.fillText(c.label, c.x, 368);
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

/** Glowing wall sign with generous inner padding: "¿QUERÉS TU PÁGINA WEB 3D PARA TU NEGOCIO? ¡CONTACTAME!" */
function Promo3DSign({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 840, 380);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 840, 380);

      // Generous outer margin & glowing cyan-violet inner frame
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 7;
      ctx.strokeRect(24, 24, 792, 332);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 33px system-ui, -apple-system, sans-serif';
      ctx.fillText('¿QUERÉS TU PÁGINA WEB 3D', 420, 104);
      ctx.fillText('PARA TU NEGOCIO?', 420, 154);

      // Vibrant CTA pill with comfortable padding
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(240, 218, 360, 74, 37);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('¡CONTACTAME!', 420, 256);
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
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[4.4, 2.05, 0.12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[4.2, 1.88]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.55}
          roughness={0.22}
        />
      </mesh>
    </group>
  );
}

/** Auto-cycling 3D Smart TV slideshow showcasing Emiliano's web projects (supports real image URLs + crisp fallback cards) */
function ProjectSlideshowTV({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);

  useEffect(() => {
    const slides: Array<{
      badge: string;
      title: string;
      subtitle: string;
      url: string;
      c1: string;
      c2: string;
      imageUrl?: string;
    }> = [
        {
          badge: 'SAAS GASTRONÓMICO · IA + MERCADO PAGO',
          title: 'MambaQR · Menú Digital',
          subtitle: 'Pedidos en Mesa · Mozo & Cuenta · Fidelidad y Sellos',
          url: 'mambaqr.vercel.app',
          c1: '#4f46e5',
          c2: '#06b6d4',
          imageUrl: '/projects/mambaqr.png',
        },
        {
          badge: 'LANDING PAGE · SALÓN DE UÑAS',
          title: 'Cuki Nails',
          subtitle: 'Home Studio · Galería · Reserva de Turnos',
          url: 'cukinails.netlify.app',
          c1: '#db2777',
          c2: '#f472b6',
          imageUrl: '/projects/cukinails.jpg',
        },
        {
          badge: 'APP PARA LA COMUNIDAD · TRELEW',
          title: 'Mascotas Trelew',
          subtitle: 'Mapa interactivo · Alertas WhatsApp · Carteles QR',
          url: 'mascotastrelew.vercel.app',
          c1: '#ea580c',
          c2: '#dc2626',
          imageUrl: '/projects/mascotas-trelew.jpg',
        },
        {
          badge: 'E-COMMERCE · ROPA Y SUPLEMENTOS',
          title: 'Klonfark Store',
          subtitle: 'Indumentaria Deportivo-Urbana · Suplementos · Catálogo',
          url: 'klonfark.com',
          c1: '#111827',
          c2: '#374151',
          imageUrl: '/projects/klonfark.jpg',
        },
        {
          badge: 'WEB APP · SALUD Y FITNESS',
          title: 'Calculadora IMC',
          subtitle: 'Índice de Masa Corporal en Segundos',
          url: 'imccalculater.netlify.app',
          c1: '#4f46e5',
          c2: '#7c3aed',
          imageUrl: '/projects/imc.jpg',
        },
      ];

    const loadedImages = new Map<string, HTMLImageElement>();
    let idx = 0;

    const drawSlide = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const s = slides[idx];

      // Dark Smart TV frame background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 360);

      // Browser top bar with traffic lights + URL
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 42);
      ['#ef4444', '#f59e0b', '#22c55e'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(24 + i * 20, 21, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(100, 9, 440, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px "Consolas", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`https://${s.url}`, 320, 21);

      const img = s.imageUrl ? loadedImages.get(s.imageUrl) : undefined;
      if (img) {
        ctx.drawImage(img, 0, 42, 640, 282);
      } else {
        // Gradient hero card inside browser
        const grad = ctx.createLinearGradient(28, 60, 612, 310);
        grad.addColorStop(0, s.c1);
        grad.addColorStop(1, s.c2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(28, 60, 584, 248, 22);
        ctx.fill();

        // Badge pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.roundRect(180, 92, 280, 34, 17);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.font = '800 14px system-ui, sans-serif';
        ctx.fillText(s.badge, 320, 109);

        // Main project title
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 42px system-ui, -apple-system, sans-serif';
        ctx.fillText(s.title, 320, 178);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.font = '600 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(s.subtitle, 320, 232);
      }

      // Slide indicator dots at bottom
      slides.forEach((_, di) => {
        ctx.fillStyle = di === idx ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.arc(284 + di * 24, 340, di === idx ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      });

      texture.needsUpdate = true;
    };

    slides.forEach((s) => {
      if (!s.imageUrl) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImages.set(s.imageUrl!, img);
        drawSlide();
      };
      img.src = s.imageUrl;
    });

    drawSlide();
    const timer = window.setInterval(() => {
      idx = (idx + 1) % slides.length;
      drawSlide();
    }, 3500);
    return () => {
      window.clearInterval(timer);
      texture.dispose();
    };
  }, [canvas, texture]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Sturdy wide Smart TV stand base resting on Proyectos desk */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[1.08, 0.06, 0.42]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.16, -0.02]} castShadow>
        <boxGeometry args={[0.18, 0.26, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Large ultra-slim 16:9 Smart TV frame */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[3.35, 1.92, 0.1]} />
        <meshStandardMaterial color="#090d16" metalness={0.55} roughness={0.28} />
      </mesh>
      {/* Big glowing TV screen */}
      <mesh position={[0, 1.18, 0.056]}>
        <planeGeometry args={[3.18, 1.78]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.66}
          roughness={0.18}
        />
      </mesh>
      {/* Subtle cyan standby/live LED on bottom bezel */}
      <mesh position={[1.48, 0.27, 0.054]}>
        <circleGeometry args={[0.02, 10]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.0} />
      </mesh>
    </group>
  );
}

/** Real-time Digital LED Clock showing the visitor's local device time (HH:MM:SS) */
function DigitalWallClock({ position }: { position: [number, number, number] }) {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);

  useEffect(() => {
    const drawTime = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      // Matte black LED panel
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 256, 128);

      // Sleek cyan border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 5;
      ctx.strokeRect(5, 5, 246, 118);

      // Ghost unlit 88:88 digits
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 54px "Consolas", "Courier New", monospace';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillText('88:88', 112, 56);

      // Lit glowing HH:MM digits
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText(`${hh}:${mm}`, 112, 56);

      // Seconds indicator on the right
      ctx.font = '800 26px "Consolas", "Courier New", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`:${ss}`, 214, 62);
      ctx.shadowBlur = 0;

      // Local date label at bottom
      const dateStr = now.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }).toUpperCase();
      ctx.font = '700 17px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(dateStr, 128, 102);

      texture.needsUpdate = true;
    };

    drawTime();
    const id = window.setInterval(drawTime, 1000);
    return () => {
      window.clearInterval(id);
      texture.dispose();
    };
  }, [canvas, texture]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.08, 0.56, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[0.98, 0.48]} />
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

/** Floating glowing GTA-style downward marker cone above each interactive station */
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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = isActive ? 2.6 : 1.3;
    if (iconRef.current) {
      iconRef.current.rotation.y = t * speed;
      iconRef.current.position.y = position[1] + Math.sin(t * 3.6) * 0.14;
      const targetScale = isActive ? 1.25 : 1;
      const nextScale = THREE.MathUtils.lerp(
        iconRef.current.scale.x,
        targetScale,
        0.14
      );
      iconRef.current.scale.setScalar(nextScale);
    }
  });

  return (
    <group ref={iconRef} position={position}>
      {/* Compact GTA-style inverted 4-sided pyramid/cone pointing straight down */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 0.44, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 2.2 : 1.25}
          roughness={0.18}
          metalness={0.25}
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

      {/* Floating 3D icon directly above the table circle (or custom iconY) */}
      <FloatingStationIcon
        position={[padX, zone.iconY ?? zone.labelPosition[1] - 0.68, padZ]}
        color={zone.color}
        isActive={isActive}
      />
    </group>
  );
}

/** Glowing 3D Sci-Fi Portal that teleports the robot back to the Oscars red carpet spawn pad */
function SpawnTeleportPortal({ position }: { position: [number, number, number] }) {
  const vortexRef = useRef<THREE.Mesh>(null);

  const labelTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 384, 96);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, 372, 84);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#67e8f9';
      ctx.font = '900 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('PORTAL · INICIO', 192, 49);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      labelTex.dispose();
    };
  }, [labelTex]);

  useFrame((_, rawDelta) => {
    if (vortexRef.current) {
      vortexRef.current.rotation.z -= Math.min(rawDelta, 0.05) * 2.2;
    }
  });

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Metallic base platform */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[1.38, 1.52, 0.16, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Glowing floor ring */}
      <mesh position={[0, 0.168, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.02, 1.24, 28]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#22d3ee"
          emissiveIntensity={1.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer metallic portal ring */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <torusGeometry args={[1.25, 0.14, 14, 36]} />
        <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Inner neon cyan-violet energy ring */}
      <mesh position={[0, 1.55, 0]}>
        <torusGeometry args={[1.1, 0.055, 10, 36]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.2}
        />
      </mesh>
      {/* Spinning energy vortex disc */}
      <mesh ref={vortexRef} position={[0, 1.55, 0]}>
        <circleGeometry args={[1.06, 28]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#6366f1"
          emissiveIntensity={1.65}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Floating top sign: PORTAL · INICIO */}
      <mesh position={[0, 3.15, 0]}>
        <boxGeometry args={[2.1, 0.52, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.15, 0.046]}>
        <planeGeometry args={[1.98, 0.44]} />
        <meshStandardMaterial
          map={labelTex}
          emissiveMap={labelTex}
          emissive="#ffffff"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export function WorldMap({
  activeZone,
  resetSignal,
  likesCount,
  onOpenPressImage,
}: WorldMapProps) {
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

      {/* Sleek glowing LED baseboard strips along floor + vertical corner LED tubes */}
      <mesh position={[1.75, 0.12, -11.62]}>
        <boxGeometry args={[37.2, 0.08, 0.06]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[-16.62, 0.12, 2.55]}>
        <boxGeometry args={[0.06, 0.08, 28.4]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.4} />
      </mesh>
      {/* 3 vertical corner LED tubes (inner back-left corner + back-right & front-left wall ends) */}
      <mesh position={[-16.58, 2.95, -11.58]}>
        <boxGeometry args={[0.1, 5.7, 0.1]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.75} />
      </mesh>
      <mesh position={[20.35, 2.95, -11.58]}>
        <boxGeometry args={[0.1, 5.7, 0.1]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.75} />
      </mesh>
      <mesh position={[-16.58, 2.95, 16.95]}>
        <boxGeometry args={[0.1, 5.7, 0.1]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.75} />
      </mesh>

      {/* Blue tech accent wall + Hero Sign */}
      <mesh position={[0.2, 1.55, -11.62]}>
        <boxGeometry args={[6.4, 3.1, 0.08]} />
        <meshStandardMaterial color="#2563eb" roughness={0.65} />
      </mesh>
      <WallHeroSign position={[0.2, 4.18, -11.58]} />

      {/* === JIU-JITSU BELT WALL DISPLAY RACK (Back-left wall above guitars, between blinds & blue wall) === */}
      {/* Belts themselves are destructible physics props in PhysicsProps.tsx */}
      <group position={[-4.9, 2.75, -11.55]}>
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

      {/* === MURO DE PRENSA EN LA PARED + CARTEL PROMO 3D A LA DERECHA DEL DIARIO === */}
      <PressFrame
        position={[-16.62, 4.18, -1.0]}
        rotationY={Math.PI / 2}
        width={4.55}
        height={3.2}
        outlet="DIARIO EL CHUBUT · JORNADA"
        headline="Mascotas Trelew · Emiliano Campos"
        accent="#1d4ed8"
        imageUrl="/press/diario-mascotas.jpg"
        onSelect={() => onOpenPressImage('/press/diario-mascotas.jpg')}
      />
      <Promo3DSign position={[-16.62, 3.85, -7.2]} rotationY={Math.PI / 2} />
      {/* === CARTEL DE CONTACTO ARRIBA DE RECEPCIÓN (WhatsApp, LinkedIn, Email) === */}
      <ContactWallSign position={[5.8, 4.15, -11.58]} />

      {/* === CONTADOR DE ME GUSTA EN LA PARED (al lado de Contacto) === */}
      <DigitalLikeCounter position={[10.8, 4.15, -11.58]} likesCount={likesCount} />

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

      {/* White pillar with live digital device clock (to the right of the Oscars red carpet) */}
      <group position={[3.6, 0, -1.65]}>
        <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 6.0, 1.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
        </mesh>
        <mesh position={[0, 6.02, 0]} castShadow>
          <boxGeometry args={[1.45, 0.24, 1.45]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <DigitalWallClock position={[0, 3.85, 0.62]} />
        <mesh position={[0, 2.75, 0.62]}>
          <planeGeometry args={[0.58, 0.74]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.5} />
        </mesh>
      </group>

      {/* ================================================================ */}
      {/* 1. ZONA LOUNGE — Sillón & Puff (Coffee table removed for Gamer Setup) */}
      {/* ================================================================ */}
      <group>
        {/* Navy armchair */}
        <group position={[-13.5, 0, -9.35]} rotation={[0, 0.25, 0]}>
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
      </group>

      {/* ================================================================ */}
      {/* 2. ZONA MEDIOS — Mesa Blanca de Prensa (Mid-Left Wall)           */}
      {/* ================================================================ */}
      <group position={[-15.4, 0, -1.0]}>
        <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.12, 2.7]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.28} metalness={0.08} />
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
      {/* 4. ZONA DEV LAB — "PROYECTOS" (Mesa girada mirando alfombra +    */}
      {/*    Gran Smart TV + Rack de Servidor con cables)                  */}
      {/* ================================================================ */}
      <group>
        {/* Wooden desk rotated -90° so the Big Smart TV faces straight toward the red carpet (-X) */}
        <group position={[10.8, 0, 2.8]} rotation={[0, -Math.PI / 2, 0]}>
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
          {/* Big Smart TV facing -X (world) toward the Oscars red carpet */}
          <ProjectSlideshowTV position={[0, 0.88, -0.22]} rotationY={0} />
        </group>

        {/* Blue ergonomic chair behind the rotated desk */}
        <OfficeChair position={[12.4, 0, 2.8]} rotationY={-Math.PI / 2} color="#4285F4" />

        {/* Detailed 3D IT Server Rack with server blades, LEDs & colorful patch cables */}
        <group position={[11.0, 0, -0.75]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Main matte-black steel rack chassis */}
          <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.1, 2.3, 1.05]} />
            <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.38} />
          </mesh>
          {/* Metallic silver vertical mounting rails on front */}
          {[-0.48, 0.48].map((rx, ri) => (
            <mesh key={ri} position={[rx, 1.15, 0.53]}>
              <boxGeometry args={[0.06, 2.2, 0.03]} />
              <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.28} />
            </mesh>
          ))}
          {/* 5 stacked 2U server blades with ventilation slots & status LEDs */}
          {[0.38, 0.74, 1.1, 1.46, 1.82].map((by, bi) => (
            <group key={bi} position={[0, by, 0.535]}>
              <mesh>
                <boxGeometry args={[0.88, 0.26, 0.04]} />
                <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.4} />
              </mesh>
              {/* Drive bays / vent stripe */}
              <mesh position={[-0.14, 0, 0.022]}>
                <boxGeometry args={[0.48, 0.12, 0.01]} />
                <meshStandardMaterial color="#090d16" roughness={0.8} />
              </mesh>
              {/* Active green/cyan/amber status LEDs */}
              <mesh position={[0.24, 0.04, 0.024]}>
                <boxGeometry args={[0.06, 0.04, 0.01]} />
                <meshStandardMaterial
                  color={bi % 2 === 0 ? '#22c55e' : '#38bdf8'}
                  emissive={bi % 2 === 0 ? '#22c55e' : '#38bdf8'}
                  emissiveIntensity={2.0}
                />
              </mesh>
              <mesh position={[0.34, 0.04, 0.024]}>
                <boxGeometry args={[0.06, 0.04, 0.01]} />
                <meshStandardMaterial
                  color={bi === 2 ? '#f59e0b' : '#22d3ee'}
                  emissive={bi === 2 ? '#f59e0b' : '#22d3ee'}
                  emissiveIntensity={1.8}
                />
              </mesh>
            </group>
          ))}
          {/* Top network switch / patch panel */}
          <mesh position={[0, 2.12, 0.535]}>
            <boxGeometry args={[0.88, 0.16, 0.04]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Colorful Ethernet patch cables looping down the front-right cable organizer */}
          {[
            { x: 0.36, y: 1.45, h: 1.35, color: '#38bdf8' },
            { x: 0.4, y: 1.3, h: 1.65, color: '#facc15' },
            { x: 0.44, y: 1.15, h: 1.95, color: '#22c55e' },
            { x: 0.48, y: 1.05, h: 1.75, color: '#f97316' },
          ].map((c, ci) => (
            <group key={ci}>
              {/* Vertical cable run along rack organizer */}
              <mesh position={[c.x, c.y, 0.57]}>
                <cylinderGeometry args={[0.014, 0.014, c.h, 6]} />
                <meshStandardMaterial color={c.color} roughness={0.45} />
              </mesh>
              {/* Patch plug connecting into switch port */}
              <mesh position={[c.x - 0.14, 2.12 - ci * 0.02, 0.565]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.013, 0.013, 0.28, 6]} />
                <meshStandardMaterial color={c.color} roughness={0.45} />
              </mesh>
            </group>
          ))}
          {/* Floor power & Ethernet cable bundle running from rack to Proyectos desk (+X in local = +Z world) */}
          {[
            { z: 0.08, color: '#38bdf8' },
            { z: 0.0, color: '#0f172a' },
            { z: -0.08, color: '#facc15' },
          ].map((fc, fi) => (
            <mesh key={fi} position={[1.15, 0.03, fc.z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 1.45, 6]} />
              <meshStandardMaterial color={fc.color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================================================================ */}
      {/* 4B. STREAMER & GAMER STUDIO SETUP (Relocated to Back-Left!)      */}
      {/* ================================================================ */}
      <group position={[-9.5, 0, -8.1]} rotation={[0, Math.PI / 2, 0]}>
        <group position={[-17.2, 0, -0.8]}>
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

          {/* Purple Gaming / Streamer Chair facing the studio desk (+X local -> -Z world) */}
          <OfficeChair position={[15.6, 0, 0.8]} rotationY={Math.PI / 2} color="#7c3aed" />
        </group>
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
      <PottedPlant position={[17.8, 0, 3.2]} scale={1.25} potColor="#f8fafc" />
      <PottedPlant position={[-15.4, 0, -5.8]} scale={1.2} potColor="#f8fafc" />

      {/* === 6. ZONA MINIJUEGO — TRAMPOLÍN 3D USABLE (Front-Right) === */}
      <group position={[TRAMPOLINE.x, 0, TRAMPOLINE.z]}>
        {/* 6 angled brushed-steel legs */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 2.02, 0.2, Math.sin(angle) * 2.02]}
              castShadow
            >
              <cylinderGeometry args={[0.055, 0.065, 0.4, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.28} />
            </mesh>
          );
        })}
        {/* Outer bright cyan safety pad ring */}
        <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[2.06, 0.18, 12, 36]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.35} metalness={0.15} />
        </mesh>
        {/* Inner neon accent trim ring */}
        <mesh position={[0, 0.438, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.65, 1.88, 36]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#22d3ee"
            emissiveIntensity={1.1}
            roughness={0.25}
          />
        </mesh>
        {/* High-tension black bounce mat */}
        <mesh position={[0, 0.4, 0]} receiveShadow>
          <cylinderGeometry args={[1.88, 1.88, 0.06, 36]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
        {/* Center glowing bounce target ring */}
        <mesh position={[0, 0.442, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.62, 28]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#facc15"
            emissiveIntensity={1.4}
          />
        </mesh>
      </group>

      {/* === 7. PORTAL DE TELETRANSPORTE AL INICIO (Front-Right Corner) === */}
      <SpawnTeleportPortal position={[SPAWN_PORTAL.x, 0, SPAWN_PORTAL.z]} />

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
