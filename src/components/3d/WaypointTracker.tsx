import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ZONES } from '../../data/portfolioData';
import { characterState, waypointScreenMap } from '../../state/inputState';

/**
 * Projects each interactive zone's 3D world position into 2D screen coordinates
 * every frame so RealtimeWaypoints can track them at 60fps with zero React re-renders.
 */
export function WaypointTracker() {
  const { camera, size } = useThree();
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const padX = Math.min(82, size.width * 0.14);
    const padTop = 92;
    const padBottom = size.width <= 900 ? 155 : 88;

    const centerX = size.width * 0.5;
    const centerY = size.height * 0.5;

    for (const zone of ZONES) {
      tempVec.set(
        zone.labelPosition[0],
        zone.labelPosition[1],
        zone.labelPosition[2]
      );
      tempVec.project(camera);

      // Behind camera check
      const isBehind = tempVec.z > 1;
      let sx = (tempVec.x * 0.5 + 0.5) * size.width;
      let sy = (-tempVec.y * 0.5 + 0.5) * size.height;

      if (isBehind) {
        sx = size.width - sx;
        sy = size.height - sy;
      }

      const isOffscreen =
        isBehind ||
        sx < padX ||
        sx > size.width - padX ||
        sy < padTop ||
        sy > size.height - padBottom;

      const dxScreen = sx - centerX;
      const dyScreen = sy - centerY;
      const angleRad = Math.atan2(dyScreen, dxScreen);

      if (isOffscreen) {
        // Clamp along direction ray to safe viewport rectangle
        const halfW = centerX - padX;
        const halfHTop = centerY - padTop;
        const halfHBottom = size.height - padBottom - centerY;

        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const scaleX = Math.abs(cos) > 0.0001 ? halfW / Math.abs(cos) : Infinity;
        const scaleY =
          Math.abs(sin) > 0.0001
            ? (sin < 0 ? halfHTop : halfHBottom) / Math.abs(sin)
            : Infinity;
        const scale = Math.min(scaleX, scaleY);

        sx = centerX + cos * scale;
        sy = centerY + sin * scale;
      }

      const dist = Math.hypot(
        characterState.x - zone.position[0],
        characterState.z - zone.position[2]
      );

      const entry = waypointScreenMap[zone.id];
      entry.screenX = sx;
      entry.screenY = sy;
      entry.isOffscreen = isOffscreen;
      entry.angleRad = angleRad;
      entry.distance = dist;
      entry.isInside = dist <= zone.radius;
    }
  });

  return null;
}
