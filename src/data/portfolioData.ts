export type ZoneId =
  | 'projects'
  | 'creator'
  | 'about'
  | 'skills'
  | 'press'
  | 'reviews'
  | 'likes'
  | 'contact'
  | 'minigame';

export interface CreatorSocial {
  id: string;
  platform: string;
  followers: string;
  label: string;
  color: string;
  url: string;
}

export interface PressItem {
  id: string;
  outlet: string;
  role: string;
  summary: string;
  imageUrl: string;
  articleUrl?: string;
}

export interface ReviewItem {
  id: string;
  author_name: string;
  company?: string;
  project_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface InteractiveZone {
  id: ZoneId;
  title: string;
  subtitle: string;
  callout: string;
  actionLabel: string;
  /** Center of proximity trigger around the desk/station */
  position: [number, number, number];
  /** Walkable point in front of the desk for navbar auto-walk */
  walkTarget: [number, number];
  /** Exact center of the table/surface where the glowing circle sits */
  padPosition: [number, number, number];
  /** 3D position right above the PC/focal object for the floating label */
  labelPosition: [number, number, number];
  /** Optional custom Y height for the floating GTA triangle cone */
  iconY?: number;
  radius: number;
  color: string;
}

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Top walkable surface height so the player & props can sit/jump on tables */
  topY: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  gradient: string;
  imageUrl?: string;
  demoUrl: string;
  repoUrl?: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export const OFFICE_BOUNDS = {
  minX: -16.1,
  maxX: 19.6,
  minZ: -11.1,
  maxZ: 16.4,
};

export const ZONES: InteractiveZone[] = [
  {
    id: 'projects',
    title: 'Proyectos',
    subtitle: 'Escritorio Dev · Apps y trabajos',
    callout: '¡Mirá mis proyectos!',
    actionLabel: 'Abrir Proyectos',
    position: [10.4, 0, 2.8],
    walkTarget: [8.4, 2.8],
    padPosition: [10.2, 0.9, 2.8],
    labelPosition: [10.8, 4.35, 2.8],
    radius: 3.9,
    color: '#6366f1',
  },
  {
    id: 'creator',
    title: 'Contenido',
    subtitle: 'Setup Streamer · Videos de Fútbol (+182K)',
    callout: '¡Mirá mis redes de fútbol!',
    actionLabel: 'Ver Creación de Contenido',
    position: [-9.5, 0, -8.2],
    walkTarget: [-9.5, -5.6],
    padPosition: [-9.5, 0.9, -8.6],
    labelPosition: [-9.5, 3.05, -8.6],
    radius: 3.8,
    color: '#a855f7',
  },
  {
    id: 'about',
    title: 'Sobre Mí',
    subtitle: 'Cartel Principal · Emiliano Campos',
    callout: '¡Conoceme acá!',
    actionLabel: 'Ver Sobre Mí',
    position: [0.2, 0, -9.6],
    walkTarget: [0.2, -8.2],
    padPosition: [0.2, 0.03, -9.8],
    labelPosition: [0.2, 2.7, -10.6],
    iconY: 1.15,
    radius: 3.4,
    color: '#10b981',
  },
  {
    id: 'skills',
    title: 'Skills',
    subtitle: 'PC & Pizarra · Mi stack',
    callout: '¡Vení a ver mi stack!',
    actionLabel: 'Ver Skills',
    position: [-13.8, 0, 6.8],
    walkTarget: [-11.8, 6.8],
    padPosition: [-14.2, 0.9, 6.8],
    labelPosition: [-14.2, 2.85, 6.8],
    radius: 3.8,
    color: '#ec4899',
  },
  {
    id: 'press',
    title: 'Medios',
    subtitle: 'Diario Jornada, El Chubut y LU20',
    callout: '¡Conocé mi paso por los medios!',
    actionLabel: 'Ver Mi Paso por los Medios',
    position: [-14.8, 0, -1.0],
    walkTarget: [-13.0, -1.0],
    padPosition: [-15.4, 0.9, -1.0],
    labelPosition: [-15.4, 2.05, -1.0],
    radius: 3.5,
    color: '#06b6d4',
  },
  {
    id: 'reviews',
    title: 'Reseñas',
    subtitle: 'Clientes · Opiniones reales',
    callout: '¡Dejá tu reseña!',
    actionLabel: 'Ver Reseñas',
    position: [12.0, 0, -5.0],
    walkTarget: [12.0, -4.0],
    padPosition: [12.0, 0.03, -5.0],
    labelPosition: [12.0, 2.55, -5.0],
    radius: 3.2,
    color: '#eab308',
  },
  {
    id: 'likes',
    title: 'Me Gusta',
    subtitle: 'Contador de Me Gusta · En vivo',
    callout: '¡Dejá tu Me Gusta ❤️!',
    actionLabel: 'Abrir Contador de Me Gusta',
    position: [8.8, 0, -9.2],
    walkTarget: [8.8, -7.2],
    padPosition: [8.8, 1.02, -9.2],
    labelPosition: [8.8, 2.55, -9.2],
    radius: 3.0,
    color: '#f43f5e',
  },
  {
    id: 'contact',
    title: 'Contacto',
    subtitle: 'Recepción · Hablemos',
    callout: '¡Charlemos!',
    actionLabel: 'Abrir Contacto',
    position: [4.5, 0, -8.5],
    walkTarget: [4.5, -6.8],
    padPosition: [4.5, 1.21, -9.2],
    labelPosition: [4.5, 2.25, -9.2],
    radius: 3.6,
    color: '#f59e0b',
  },
  {
    id: 'minigame',
    title: 'Minijuego',
    subtitle: 'Trampolín 3D · ¡Próximamente!',
    callout: '¡Próximamente!',
    actionLabel: 'Minijuego (Próximamente)',
    position: [15.6, 0, 11.4],
    walkTarget: [12.8, 11.4],
    padPosition: [15.6, 0.445, 11.4],
    labelPosition: [15.6, 2.85, 11.4],
    radius: 3.3,
    color: '#22d3ee',
  },
];

export const TRAMPOLINE = {
  x: 15.6,
  z: 11.4,
  radius: 2.15,
  topY: 0.42,
} as const;

export const SPAWN_PORTAL = {
  x: 8.2,
  z: 14.8,
  radius: 1.5,
} as const;

// Rectangular colliders for office furniture & pillar (with walkable topY!)
export const BOX_OBSTACLES: BoxObstacle[] = [
  // Structural pillar (to the right of the Oscars red carpet)
  { minX: 2.85, maxX: 4.35, minZ: -2.4, maxZ: -0.9, topY: 6.0 },
  // Lounge navy armchair (back-left)
  { minX: -14.6, maxX: -12.4, minZ: -10.3, maxZ: -8.4, topY: 0.7 },
  // Streamer & Gamer Studio white desk (back-left, where coffee table was)
  { minX: -11.4, maxX: -7.6, minZ: -9.7, maxZ: -7.5, topY: 0.88 },
  // Press display table (mid-left wall)
  { minX: -16.4, maxX: -14.4, minZ: -2.4, maxZ: 0.4, topY: 0.88 },
  // Reception desk & bins (back-right)
  { minX: 2.5, maxX: 6.5, minZ: -10.4, maxZ: -8.0, topY: 1.19 },
  // Waiting area sofa (far back-right)
  { minX: 10.2, maxX: 14.0, minZ: -10.5, maxZ: -8.6, topY: 0.7 },
  // Tall red locker (right edge)
  { minX: 18.2, maxX: 19.6, minZ: -8.4, maxZ: -5.8, topY: 3.0 },
  // Dev main desk (Proyectos, rotated facing red carpet) & IT Server Rack with cables
  { minX: 9.7, maxX: 11.9, minZ: 0.2, maxZ: 5.4, topY: 0.88 },
  { minX: 10.35, maxX: 11.65, minZ: -1.4, maxZ: -0.1, topY: 2.35 },
  // Skills black PC desk (front-left)
  { minX: -15.4, maxX: -13.0, minZ: 4.9, maxZ: 8.7, topY: 0.88 },
];

export const CREATOR_INFO = {
  niche: 'Fútbol · Entretenimiento y Comunidad',
  totalAudience: '+182.000',
  bio: 'Creo videos y contenido diario del nicho fútbol para Facebook, TikTok, Instagram y YouTube, construyendo una comunidad activa de más de 182 mil personas.',
  socials: [
    {
      id: 'facebook',
      platform: 'Facebook',
      followers: '140.000',
      label: 'Seguidores · Comunidad',
      color: '#1877f2',
      url: 'https://www.facebook.com/',
    },
    {
      id: 'tiktok',
      platform: 'TikTok',
      followers: '25.000',
      label: 'Seguidores',
      color: '#ec4899',
      url: 'https://www.tiktok.com/',
    },
    {
      id: 'instagram',
      platform: 'Instagram',
      followers: '17.000',
      label: 'Seguidores',
      color: '#e1306c',
      url: 'https://www.instagram.com/',
    },
    {
      id: 'youtube',
      platform: 'YouTube',
      followers: '759',
      label: 'Suscriptores',
      color: '#ef4444',
      url: 'https://www.youtube.com/',
    },
  ] as CreatorSocial[],
};

export const PROJECTS: ProjectItem[] = [
  {
    id: 'proj-mambaqr',
    title: 'MambaQR · Menú Digital con IA',
    description:
      'Menú digital interactivo para negocios gastronómicos con pedidos desde la mesa, botones rápidos para llamar al mozo y pedir la cuenta, reseñas de clientes y sistema de fidelidad con suscripciones y sellos. Incluye panel de administración para personalizar el diseño y todas las configuraciones, además de Mercado Pago integrado.',
    tags: [
      'Menú Digital QR',
      'IA',
      'Mercado Pago',
      'Pedidos en Mesa',
      'Fidelidad & Sellos',
      'Panel Admin',
    ],
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
    imageUrl: '/projects/mambaqr.png',
    demoUrl: 'https://mambaqr.vercel.app/',
  },
  {
    id: 'proj-cukinails',
    title: 'Cuki Nails · Web para Salón de Uñas',
    description:
      'Sitio web elegante y mobile-first para Home Studio de uñas con presentación de servicios, galería de diseños personalizados, reserva de turnos e integración directa con Instagram y WhatsApp.',
    tags: ['Landing Page', 'Salón de Uñas', 'Turnos', 'UI/UX', 'WhatsApp'],
    gradient: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
    imageUrl: '/projects/cukinails.jpg',
    demoUrl: 'https://cukinails.netlify.app/',
  },
  {
    id: 'proj-pets',
    title: 'Mascotas Trelew · App para la Comunidad',
    description:
      'Red comunitaria geolocalizada y gratuita para buscar, reportar avistamientos y reunir perros y gatos extraviados en Trelew y toda la provincia del Chubut. Incluye mapa en vivo, alertas por WhatsApp y carteles QR. Destacada en Diario El Chubut, Diario Jornada, LU20 y Radio 3.',
    tags: ['App Comunitaria', 'Mapa en Vivo', 'Carteles QR', 'Prensa Local'],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    imageUrl: '/projects/mascotas-trelew.jpg',
    demoUrl: 'https://mascotastrelew.vercel.app/',
  },
  {
    id: 'proj-klonfark',
    title: 'Klonfark · E-Commerce de Ropa y Suplementos',
    description:
      'Tienda online de indumentaria deportivo-urbana, suplementos y accesorios con buscador de productos, categorías, combos, ofertas, carrito de compras y asistencia directa por WhatsApp.',
    tags: ['E-Commerce', 'Catálogo', 'Ropa & Suplementos', 'WhatsApp', 'Responsive'],
    gradient: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
    imageUrl: '/projects/klonfark.jpg',
    demoUrl: 'https://klonfark.com/',
  },
  {
    id: 'proj-imc',
    title: 'Calculadora de Índice de Masa Corporal (IMC)',
    description:
      'Aplicación web rápida y clara para calcular el Índice de Masa Corporal ingresando altura y peso, con validación instantánea e interfaz dark mode responsive.',
    tags: ['Web App', 'Salud & Fitness', 'JavaScript', 'UI Dark Mode'],
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    imageUrl: '/projects/imc.jpg',
    demoUrl: 'https://imccalculater.netlify.app/',
  },
];

export const SKILLS_GROUPS: SkillGroup[] = [
  {
    category: 'Frontend',
    items: [
      'React',
      'TypeScript',
      'Next.js',
      'JavaScript',
      'Tailwind CSS',
      'Three.js',
      'HTML5 / CSS3',
    ],
  },
  {
    category: 'Backend & Data',
    items: ['Node.js', 'Supabase', 'SQL', 'APIs REST', 'PHP / WordPress'],
  },
  {
    category: 'Tools & Workflow',
    items: ['Git & GitHub', 'AWS (básico)', 'SEO', 'Vibe Coding'],
  },
  {
    category: 'Habilidades Extras',
    items: [
      'Creación de contenido digital',
      'Marketing Digital & Growth',
      'UX / UI orientado a conversión',
      'Edición de video (CapCut)',
      'Edición de imagen (Photoshop)',
    ],
  },
];

export const ABOUT_INFO = {
  name: 'Emiliano Campos',
  role: 'Product-Minded Frontend / Full-Stack Developer · React, TypeScript, Next.js & Three.js',
  bio: 'Soy desarrollador web con +2 años de experiencia creando aplicaciones, dashboards, e-commerce y sistemas a medida pensados primero desde el usuario y el negocio. Combino desarrollo técnico con visión de producto, UX orientado a conversión y experiencia real haciendo crecer comunidades digitales.',
  highlights: [
    '💻 +2 años en GearthLogic creando apps web, dashboards administrativos, APIs REST y un plugin de E-Commerce a medida (WordPress / PHP) con carrito, checkout y pasarela de pagos reales.',
    '🚀 Productos propios en producción: MambaQR (menú digital con IA, pedidos en mesa, fidelidad y Mercado Pago), Klonfark (e-commerce de ropa y suplementos), Cuki Nails y este Portfolio 3D multijugador.',
    '🐾 Impacto social y medios: creé Mascotas Trelew, red comunitaria gratuita y geolocalizada destacada en Diario El Chubut, Diario Jornada, LU20 Radio Chubut y Radio 3.',
    '⚽ Creador de contenido & Growth: construí una comunidad orgánica de +182.000 seguidores en fútbol entre Facebook, TikTok, Instagram y YouTube.',
    '🌎 Desde Trelew, Chubut (Argentina) para todo el mundo · Inglés B2 · Abierto a equipos tech y proyectos web para negocios y empresas.',
  ],
  press: [
    'Diario El Chubut',
    'Diario Jornada',
    'LU20 Radio Chubut',
    'Radio 3',
  ],
  skills: [
    'React',
    'TypeScript',
    'Next.js',
    'JavaScript',
    'Tailwind CSS',
    'Three.js',
    'Node.js',
    'Supabase',
    'SQL',
    'PHP / WordPress',
    'SEO',
    'UX / UI',
  ],
};

export const CONTACT_INFO = {
  email: 'emicampos1268@gmail.com',
  whatsapp: 'https://wa.me/5492804198600?text=Hola%20Emi!%20Vi%20tu%20portfolio%203D%20y%20tengo%20un%20proyecto%20en%20mente',
  cvUrl: '/cv-emiliano-campos.pdf',
  github: 'https://github.com/emilianocampos',
  linkedin: 'https://linkedin.com/in/emilianocampos',
  location: 'Trelew, Chubut, Argentina (Remoto)',
};

export const PRESS_MEDIA = {
  projectTitle: 'Mascotas Trelew · App de Mascotas Extraviadas',
  projectSummary:
    'Creé esta web comunitaria gratuita y geolocalizada para ayudar a vecinos de Trelew y el Valle a reportar y reencontrar mascotas perdidas. El proyecto tuvo repercusión en diarios, radio, streaming y redes de Chubut.',
  projectUrl: 'https://mascotastrelew.vercel.app',
  socialVideoUrl: 'https://www.instagram.com/p/DeHcpsjllvv/',
  socialVideoLabel: 'Ver mi nota en Instagram',
  localVideoUrl: '/press/video-medios.mp4',
  appearances: [
    {
      id: 'elchubut',
      outlet: 'Diario El Chubut · Nota Impresa y Web',
      role: 'Nota periodística destacada',
      summary: '“Una web gratuita creada en Trelew permite reportar y buscar mascotas extraviadas”.',
      imageUrl: '/press/diario-mascotas.jpg',
      articleUrl:
        'https://www.elchubut.com.ar/regionales/2026-10-4-20-42-0-una-web-gratuita-creada-en-trelew-permite-reportar-y-buscar-mascotas-extraviadas',
    },
    {
      id: 'lu20',
      outlet: 'LU20 Radio Chubut · Entrevista',
      role: 'Video en YouTube',
      summary: 'Charla en vivo en la radio contando cómo nació la idea y cómo funciona la plataforma.',
      imageUrl: 'https://img.youtube.com/vi/pfKs4zRILP0/hqdefault.jpg',
      articleUrl: 'https://www.youtube.com/watch?v=pfKs4zRILP0&t=242s',
    },
    {
      id: 'jornada',
      outlet: 'Diario Jornada · Jornada Stream',
      role: 'Entrevista en vivo',
      summary: 'Participación en Jornada Stream hablando sobre desarrollo web, creación de contenido y Mascotas Trelew.',
      imageUrl: '/press/jornada-stream.jpg',
      articleUrl:
        'https://www.diariojornada.com.ar/425052/magazine/perdiste_o_encontraste_una_mascota_ahora_hay_una_web_para_publicarla',
    },
    {
      id: 'radio3',
      outlet: 'Radio 3 AM 780',
      role: 'Cobertura regional',
      summary: '“Un joven de Trelew creó una herramienta para ayudar a encontrar animales perdidos”.',
      imageUrl: '/press/radio3.jpg',
      articleUrl:
        'https://www.facebook.com/61562530642369/posts/%EF%B8%8F-la-tecnolog%C3%ADa-al-servicio-del-amor-por-nuestras-mascotas-%EF%B8%8F-un-joven-de-trelew-/122157055856417688/',
    },
  ] as PressItem[],
};

export const DEMO_REVIEWS: ReviewItem[] = [
  {
    id: 'demo-1',
    author_name: 'Lucía Fernández',
    company: 'Veterinaria Patagonia',
    project_name: 'App Mascotas Perdidas',
    rating: 5,
    comment:
      'Una herramienta increíble para la ciudad. Ayudó a que muchísimas familias reencuentren a sus mascotas rápido.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    author_name: 'Martín Gómez',
    company: 'Tienda Sur',
    project_name: 'Web E-Commerce',
    rating: 5,
    comment:
      'Súper prolijo, rápido y atento a cada detalle. La página vuela en el celular y aumentaron las consultas.',
    created_at: new Date().toISOString(),
  },
];
