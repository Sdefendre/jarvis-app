'use client';

import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '@/types';

export interface TerrainPosition {
  id: string;
  x: number;
  y: number;
  z: number;
}

// Exported so TerrainMesh can use the exact same math to draw the ground
export function getElevation(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  const maxRadius = 160;
  
  // Base mountain shape (Cosine bell)
  let height = 0;
  if (dist < maxRadius) {
    height = (Math.cos((dist / maxRadius) * Math.PI) + 1) * 0.5 * 80;
  }

  // Digital ridges
  const ridges = (Math.sin(x * 0.15) * Math.cos(z * 0.15)) * 6;
  const falloff = Math.max(0, 1 - (dist / maxRadius));
  
  return height + (ridges * falloff);
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function useTerrainLayout(nodes: GraphNode[], _edges: GraphEdge[]) {
  const positions = useMemo(() => {
    const map = new Map<string, TerrainPosition>();
    if (nodes.length === 0) return map;

    // Distribute nodes radially along the mountain surface
    const maxRadius = 140;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Fibonacci spiral for organic 2D distribution
      const r = maxRadius * Math.sqrt((i + 0.5) / nodes.length);
      const theta = i * GOLDEN_ANGLE;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      const y = getElevation(x, z);

      map.set(node.id, { id: node.id, x, y, z });
    }

    return map;
  }, [nodes]);

  const getPositions = useMemo(() => {
    return () => positions;
  }, [positions]);

  return { getPositions };
}
