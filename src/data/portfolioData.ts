export type ZoneId =
  | 'projects'
  | 'creator'
  | 'about'
  | 'skills'
  | 'press'
  | 'reviews'
  | 'contact';

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
  /** 3D position right above the PC/focal object for the floating icon & label */
  labelPosition: [number, number, number];
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
  demoUrl: string;
  repoUrl: string;
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
    position: [14.8, 0, 7.2],
    walkTarget: [14.8, 5.2],
    padPosition: [14.8, 0.9, 7.6],
    labelPosition: [14.8, 2.85, 7.6],
    radius: 3.8,
    color: '#6366f1',
  },
  {
    id: 'creator',
    title: 'Contenido',
    subtitle: 'Setup Streamer · Videos de Fútbol (+182K)',
    callout: '¡Mirá mis redes de fútbol!',
    actionLabel: 'Ver Creación de Contenido',
    position: [17.2, 0, 0.8],
    walkTarget: [14.5, 0.8],
    padPosition: [17.7, 0.9, 0.8],
    labelPosition: [17.7, 3.05, 0.8],
    radius: 3.8,
    color: '#a855f7',
  },
  {
    id: 'about',
    title: 'Sobre Mí',
    subtitle: 'Zona Lounge · Historia y prensa',
    callout: '¡Conoceme acá!',
    actionLabel: 'Ver Sobre Mí',
    position: [-9.5, 0, -6.8],
    walkTarget: [-9.5, -5.0],
    padPosition: [-9.5, 0.62, -7.2],
    labelPosition: [-9.5, 2.55, -7.2],
    radius: 3.6,
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
    labelPosition: [-15.4, 2.85, -1.0],
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
    radius: 3.4,
    color: '#eab308',
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
    labelPosition: [4.5, 3.15, -9.2],
    radius: 3.6,
    color: '#f59e0b',
  },
];

// Rectangular colliders for office furniture & pillar (with walkable topY!)
export const BOX_OBSTACLES: BoxObstacle[] = [
  // Structural pillar (to the right of the Oscars red carpet)
  { minX: 2.85, maxX: 4.35, minZ: -2.4, maxZ: -0.9, topY: 6.0 },
  // Lounge navy armchair (back-left)
  { minX: -14.2, maxX: -12.0, minZ: -10.3, maxZ: -8.4, topY: 0.7 },
  // Lounge red beanbag
  { minX: -6.4, maxX: -4.4, minZ: -10.1, maxZ: -8.3, topY: 0.75 },
  // Lounge coffee table
  { minX: -10.7, maxX: -8.3, minZ: -7.9, maxZ: -6.5, topY: 0.6 },
  // Press display table (mid-left wall)
  { minX: -16.4, maxX: -14.4, minZ: -2.4, maxZ: 0.4, topY: 0.88 },
  // Reception desk & bins (back-right)
  { minX: 2.5, maxX: 6.5, minZ: -10.4, maxZ: -8.0, topY: 1.19 },
  // Waiting area sofa (far back-right)
  { minX: 10.2, maxX: 14.0, minZ: -10.5, maxZ: -8.6, topY: 0.7 },
  // Tall red locker (right edge)
  { minX: 18.2, maxX: 19.6, minZ: -8.4, maxZ: -5.8, topY: 3.0 },
  // Dev server rack & main desk (front-right, pushed back toward right edge)
  { minX: 8.8, maxX: 10.4, minZ: 4.3, maxZ: 8.1, topY: 1.9 },
  { minX: 12.2, maxX: 17.4, minZ: 6.5, maxZ: 8.7, topY: 0.88 },
  // Skills black PC desk (front-left)
  { minX: -15.4, maxX: -13.0, minZ: 4.9, maxZ: 8.7, topY: 0.88 },
  // Streamer & Recording Studio desk (mid-right, pushed back toward right edge)
  { minX: 16.5, maxX: 18.9, minZ: -1.1, maxZ: 2.7, topY: 0.88 },
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
    id: 'proj-pets',
    title: 'App Mascotas Perdidas y Encontradas',
    description:
      'Plataforma comunitaria para publicar y encontrar mascotas perdidas en Chubut. Destacada en Diario Jornada, Diario El Chubut y LU20 Radio Chubut.',
    tags: ['React', 'Impacto Social', 'Prensa Local', 'Web App'],
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    demoUrl: 'https://example.com',
    repoUrl: 'https://github.com',
  },
  {
    id: 'proj-1',
    title: 'E-Commerce Interactivo 3D',
    description:
      'Tienda web con visor de productos en tiempo real, carrito persistente y checkout optimizado para mobile.',
    tags: ['React', 'Three.js', 'TypeScript', 'Stripe'],
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    demoUrl: 'https://example.com',
    repoUrl: 'https://github.com',
  },
  {
    id: 'proj-2',
    title: 'Dashboard Analítico en Vivo',
    description:
      'Panel de métricas con actualización por WebSockets, filtros dinámicos y exportación a CSV/PDF.',
    tags: ['React', 'Node.js', 'WebSockets', 'Tailwind'],
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    demoUrl: 'https://example.com',
    repoUrl: 'https://github.com',
  },
];

export const SKILLS_GROUPS: SkillGroup[] = [
  {
    category: 'Frontend & 3D',
    items: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Next.js', 'CSS / Tailwind'],
  },
  {
    category: 'Backend & Datos',
    items: ['Node.js', 'Express', 'PostgreSQL', 'REST APIs', 'WebSockets'],
  },
  {
    category: 'Herramientas & Flujo',
    items: ['Git & GitHub', 'Vite', 'Figma', 'Docker', 'Testing'],
  },
];

export const ABOUT_INFO = {
  name: 'Emi',
  role: 'Full-Stack & Creative Developer',
  bio: 'Construyo experiencias web rápidas, útiles e interactivas. Creé una app para publicar mascotas perdidas y encontradas que salió en Diario Jornada, Diario El Chubut y LU20 Radio Chubut.',
  press: [
    'Diario Jornada',
    'Diario El Chubut',
    'LU20 Radio Chubut',
  ],
  skills: [
    'React',
    'TypeScript',
    'Three.js',
    'React Three Fiber',
    'Node.js',
    'CSS / Tailwind',
    'Git',
    'UI/UX',
  ],
};

export const CONTACT_INFO = {
  email: 'tuemail@ejemplo.com',
  github: 'https://github.com/tuusuario',
  linkedin: 'https://linkedin.com/in/tuusuario',
  location: 'Chubut, Argentina (Remoto)',
};

export const PRESS_MEDIA = {
  projectTitle: 'App de Mascotas Perdidas y Encontradas',
  projectSummary:
    'Creé esta app comunitaria para ayudar a vecinos de Chubut a publicar y reencontrar mascotas perdidas. El proyecto tuvo gran repercusión y me invitaron a contarlo en los principales medios de la ciudad.',
  projectUrl: 'https://example.com',
  // Pegá acá el link de tu video en Instagram / TikTok / YouTube / Facebook
  socialVideoUrl: 'https://instagram.com',
  socialVideoLabel: 'Ver video en redes sociales',
  // Guardá tu video grabado en: public/press/video-medios.mp4
  localVideoUrl: '/press/video-medios.mp4',
  appearances: [
    {
      id: 'jornada',
      outlet: 'Diario Jornada',
      role: 'Nota periodística',
      summary: 'Cobertura sobre el desarrollo y lanzamiento de la app solidaria de mascotas.',
      imageUrl: '/press/jornada.jpg',
    },
    {
      id: 'chubut',
      outlet: 'Diario El Chubut',
      role: 'Nota en diario',
      summary: 'Difusión comunitaria de la plataforma para conectar mascotas encontradas con sus familias.',
      imageUrl: '/press/chubut.jpg',
    },
    {
      id: 'lu20',
      outlet: 'LU20 Radio Chubut',
      role: 'Entrevista en vivo',
      summary: 'Charla en vivo en la radio contando cómo nació la idea y cómo funciona la app.',
      imageUrl: '/press/lu20.jpg',
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
