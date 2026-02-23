// @ts-nocheck — R3F JSX intrinsics not typed with React 19
'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode, NodeCategory } from '@/types';
import { CATEGORY_COLORS } from '@/types';
import { useGraphStore } from '@/stores/graph-store';
import { useUIStore } from '@/stores/ui-store';

interface NeuralNodeProps {
  node: GraphNode;
  position: [number, number, number];
  isConnected: boolean;
  onSelect: (node: GraphNode) => void;
}

export function NeuralNode({ node, position, isConnected, onSelect }: NeuralNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { hoveredNode, setHoveredNode } = useGraphStore();
  const { darkMode } = useUIStore();

  const categoryColor = CATEGORY_COLORS[node.category as NodeCategory] || CATEGORY_COLORS.archive;
  const catColor = useMemo(() => new THREE.Color(categoryColor), [categoryColor]);

  const isHighlighted = hoveredNode === node.id || isConnected;

  // Scale targets
  const targetScale = hovered ? 1.4 : isHighlighted ? 1.15 : 1;

  useFrame(() => {
    if (!meshRef.current) return;

    // Smooth scale transition
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.12;
    meshRef.current.scale.setScalar(newScale);

    // Emissive intensity — strong glow
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = hovered ? 1.8 : isHighlighted ? 1.2 : 0.8;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;

    // Position update
    meshRef.current.position.set(...position);

    // Outer glow shell
    if (glowRef.current) {
      glowRef.current.position.set(...position);
      glowRef.current.scale.setScalar(newScale);
      const glowMat = glowRef.current.material as THREE.MeshStandardMaterial;
      const targetGlowOpacity = hovered ? 0.25 : isHighlighted ? 0.15 : 0.08;
      glowMat.opacity += (targetGlowOpacity - glowMat.opacity) * 0.1;
    }
  });

  return (
    <>
      {/* Core sphere — colorful and vibrant */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredNode(node.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredNode(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial
          color={catColor}
          emissive={catColor}
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Outer glow shell — larger transparent sphere for bloom to pick up */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[3.5, 24, 24]} />
        <meshStandardMaterial
          color={catColor}
          emissive={catColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.08}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {/* Always-visible label */}
      <Html position={position} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color: darkMode ? '#e5e5e5' : '#111',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '11px',
            fontWeight: hovered ? 600 : 400,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            transform: 'translateY(-28px)',
            textAlign: 'center',
            opacity: hovered ? 1 : 0.75,
          }}
        >
          {node.label}
        </div>
      </Html>
    </>
  );
}
