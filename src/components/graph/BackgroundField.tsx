// @ts-nocheck
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Layer 1: dense dim starfield ---
const STAR_COUNT = 500;
const SPREAD = 500;
const DRIFT_SPEED = 0.0008;

// --- Layer 2: bright accent stars ---
const BRIGHT_COUNT = 50;
const BRIGHT_SPREAD = 500;
const BRIGHT_DRIFT_SPEED = 0.0004;

export function BackgroundField() {
  const starsRef = useRef<THREE.Points>(null);
  const brightRef = useRef<THREE.Points>(null);

  // Dense starfield — randomised sizes via a custom attribute
  const { positions: starPositions, sizes: starSizes } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
      // Random size between 0.15 (dim) and 0.6 (bright)
      sz[i] = 0.15 + Math.random() * 0.45;
    }
    return { positions: pos, sizes: sz };
  }, []);

  // Bright accent stars
  const { positions: brightPositions, sizes: brightSizes } = useMemo(() => {
    const pos = new Float32Array(BRIGHT_COUNT * 3);
    const sz = new Float32Array(BRIGHT_COUNT);
    for (let i = 0; i < BRIGHT_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BRIGHT_SPREAD;
      pos[i * 3 + 1] = (Math.random() - 0.5) * BRIGHT_SPREAD;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BRIGHT_SPREAD;
      // Larger / brighter: 0.8 – 1.6
      sz[i] = 0.8 + Math.random() * 0.8;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += DRIFT_SPEED;
    }
    if (brightRef.current) {
      // Rotate slightly slower in the opposite axis for parallax
      brightRef.current.rotation.y += BRIGHT_DRIFT_SPEED;
      brightRef.current.rotation.x += BRIGHT_DRIFT_SPEED * 0.3;
    }
  });

  return (
    <group>
      {/* Layer 1 — many small stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-size" args={[starSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.35}
          transparent
          opacity={0.6}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Layer 2 — fewer bright / larger stars */}
      <points ref={brightRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightPositions, 3]} />
          <bufferAttribute attach="attributes-size" args={[brightSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={1.0}
          transparent
          opacity={0.8}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
