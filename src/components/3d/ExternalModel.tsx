import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ExternalModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

/**
 * Componente listo para cargar cualquier mapa o modelo .glb/.gltf
 * descargado de Poly Pizza, Sketchfab o Kenney.nl.
 *
 * Ejemplo de uso dentro de Scene.tsx o WorldMap.tsx:
 *   <ExternalModel url="/models/island.glb" position={[0, 0, 0]} scale={1} />
 */
export function ExternalModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: ExternalModelProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
