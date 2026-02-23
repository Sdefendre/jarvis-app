// @ts-nocheck — R3F JSX intrinsics not typed with React 19
'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode, NodeCategory } from '@/types';
import { CATEGORY_COLORS } from '@/types';
import { useGraphStore } from '@/stores/graph-store';

interface NeuralNodeProps {
  node: GraphNode;
  position: [number, number, number];
  isConnected: boolean;
  onSelect: (node: GraphNode) => void;
}

export function NeuralNode({ node, position, isConnected, onSelect }: NeuralNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { hoveredNode, setHoveredNode } = useGraphStore();

  const categoryColor = CATEGORY_COLORS[node.category as NodeCategory] || CATEGORY_COLORS.archive;
  const catColor = useMemo(() => new THREE.Color(categoryColor), [categoryColor]);

  const isHighlighted = hoveredNode === node.id || isConnected;

  // Emissive targets: subtle base, brighter on highlight/hover
  const baseEmissive = isHighlighted ? 0.4 : 0.2;
  const targetEmissive = hovered ? 0.6 : baseEmissive;

  // Scale targets: gentle hover bump
  const targetScale = hovered ? 1.3 : 1;

  useFrame(() => {
    if (!meshRef.current) return;

    // Smooth scale transition via lerp
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.12;
    meshRef.current.scale.setScalar(newScale);

    // Smooth emissive intensity transition
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;

    // Position update
    meshRef.current.position.set(...position);
  });

  return (
    <>
      {/* Clean sphere node */}
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
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={catColor}
          emissive={catColor}
          emissiveIntensity={0.2}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Label on hover — clean sans-serif pill */}
      {hovered && (
        <Html position={position} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(30, 30, 30, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '3px 10px',
              color: '#ffffffde',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              transform: 'translateY(-24px)',
            }}
          >
            {node.label}
          </div>
        </Html>
      )}
    </>
  );
}
