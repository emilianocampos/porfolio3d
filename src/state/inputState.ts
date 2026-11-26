import type { ZoneId } from '../data/portfolioData';

export interface MobileInputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  jumpRequested: boolean;
}

export interface CharacterPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  rotY: number;
  radius: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  emote?: string;
  emoteUntil?: number;
}

export interface AutoWalkTarget {
  x: number;
  z: number;
  zoneId: ZoneId;
}

export interface WaypointScreenData {
  id: ZoneId;
  screenX: number;
  screenY: number;
  isOffscreen: boolean;
  angleRad: number;
  distance: number;
  isInside: boolean;
}

export const waypointScreenMap: Record<ZoneId, WaypointScreenData> = {
  projects: { id: 'projects', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  creator: { id: 'creator', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  about: { id: 'about', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  skills: { id: 'skills', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  press: { id: 'press', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  reviews: { id: 'reviews', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
  contact: { id: 'contact', screenX: 0, screenY: 0, isOffscreen: false, angleRad: 0, distance: 0, isInside: false },
};

export const remotePlayersMap = new Map<string, RemotePlayerState>();

// Mutable high-frequency state updated at 60fps without React re-renders
export const mobileInput: MobileInputState = {
  moveX: 0,
  moveZ: 0,
  sprint: false,
  jumpRequested: false,
};

export const characterState: CharacterPhysicsState = {
  x: 0,
  y: 0,
  z: -5.4,
  vx: 0,
  vz: 0,
  rotY: 0,
  radius: 0.62,
};

export const navigationState: {
  autoWalkTarget: AutoWalkTarget | null;
} = {
  autoWalkTarget: null,
};

export interface PropKickEvent {
  idx: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  avx: number;
  avy: number;
  avz: number;
}

export interface DroneSmashEvent {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
}

export const realtimeEvents: {
  sendPropKick: ((ev: PropKickEvent) => void) | null;
  sendRackSmash: ((vx: number) => void) | null;
  sendDroneSmash: ((ev: DroneSmashEvent) => void) | null;
  sendWorldReset: (() => void) | null;
  pendingPropKicks: PropKickEvent[];
  pendingRackSmash: number | null;
  pendingDroneSmash: DroneSmashEvent | null;
  onRemoteReset: (() => void) | null;
} = {
  sendPropKick: null,
  sendRackSmash: null,
  sendDroneSmash: null,
  sendWorldReset: null,
  pendingPropKicks: [],
  pendingRackSmash: null,
  pendingDroneSmash: null,
  onRemoteReset: null,
};

export function resetMobileInput() {
  mobileInput.moveX = 0;
  mobileInput.moveZ = 0;
  mobileInput.sprint = false;
  mobileInput.jumpRequested = false;
}
