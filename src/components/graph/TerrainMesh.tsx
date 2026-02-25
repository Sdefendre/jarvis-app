// @ts-nocheck — R3F JSX intrinsics not typed with React 19
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getElevation } from './useTerrainLayout';

export function TerrainMesh() {
  const wireRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const size = 500;
    const segments = 120; // High resolution grid for wireframe
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const posArr = geo.attributes.position;
    const vertexCount = posArr.count;

    const colorAttr = new Float32Array(vertexCount * 3);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const vx = posArr.getX(i);
      const vz = posArr.getZ(i);

      // Determine height from our new layout function
      const vy = getElevation(vx, vz);
      posArr.setY(i, vy);

      // Height percent mapped to a color gradient
      // Map [-5 to 80] range to [0 to 1]
      const heightPercent = Math.max(0, Math.min(1, (vy + 5) / 85));

      // Holographic synthwave gradient:
      // Base: Magenta (#d946ef) -> Mid: Purple (#a855f7) -> Peak: Cyan (#06b6d4)
      if (heightPercent < 0.5) {
        // lower half
        tmpColor.set('#d946ef').lerp(new THREE.Color('#a855f7'), heightPercent * 2);
      } else {
        // upper half
        tmpColor.set('#a855f7').lerp(new THREE.Color('#06b6d4'), (heightPercent - 0.5) * 2);
      }

      colorAttr[i * 3] = tmpColor.r;
      colorAttr[i * 3 + 1] = tmpColor.g;
      colorAttr[i * 3 + 2] = tmpColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorAttr };
  }, []);

  // Subtle scanning/pulsing effect for the wireframe
  useFrame(({ clock }) => {
    if (wireRef.current && wireRef.current.material) {
      const t = clock.getElapsedTime();
      // Fade opacity between 0.3 and 0.6 creating a breathing neon grid
      wireRef.current.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Solid dark under-layer to prevent seeing the wireframe from behind/through the mountain */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#030308" // Deep space/void color
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>

      {/* Glowing Holographic Wireframe Layer */}
      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial
          vertexColors
          wireframe
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
