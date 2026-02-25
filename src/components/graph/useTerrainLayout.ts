'use client';

import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '@/types';

export interface TerrainPosition {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface TerrainConfig {
  maxRadius: number;
  peakHeight: number;
}

export function getTerrainConfig(nodesCount: number, edgesCount: number): TerrainConfig {
  // Scale terrain dynamically based on the size of the vault and its connections
  const maxRadius = Math.max(100, 80 + nodesCount * 2);
  const peakHeight = Math.max(40, 30 + edgesCount * 0.8 + nodesCount * 0.5);
  return { maxRadius, peakHeight };
}

// Exported so TerrainMesh can use the exact same math to draw the ground
export function getElevation(x: number, z: number, config: TerrainConfig): number {
  const dist = Math.sqrt(x * x + z * z);
  const { maxRadius, peakHeight } = config;
  
  // Base mountain shape (Cosine bell)
  let height = 0;
  if (dist < maxRadius) {
    height = (Math.cos((dist / maxRadius) * Math.PI) + 1) * 0.5 * peakHeight;
  }

  // Digital ridges scaled by peak height
  const ridges = (Math.sin(x * 0.15) * Math.cos(z * 0.15)) * (peakHeight * 0.08);
  const falloff = Math.max(0, 1 - (dist / maxRadius));
  
  return height + (ridges * falloff);
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function useTerrainLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  const config = useMemo(() => getTerrainConfig(nodes.length, edges.length), [nodes.length, edges.length]);

  const positions = useMemo(() => {
    const map = new Map<string, TerrainPosition>();
    if (nodes.length === 0) return map;

    // Distribute nodes radially along the mountain surface
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Fibonacci spiral for organic 2D distribution, scaled by our dynamic radius
      // Use 0.9 * maxRadius so nodes don't fall off the very edge
      const r = (config.maxRadius * 0.9) * Math.sqrt((i + 0.5) / nodes.length);
      const theta = i * GOLDEN_ANGLE;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      const y = getElevation(x, z, config);

      map.set(node.id, { id: node.id, x, y, z });
    }

    return map;
  }, [nodes, config]);

  const getPositions = useMemo(() => {
    return () => positions;
  }, [positions]);

  return { getPositions, config };
}
