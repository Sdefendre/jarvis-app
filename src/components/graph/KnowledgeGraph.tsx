// @ts-nocheck — R3F JSX intrinsics not typed with React 19
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { GraphScene } from './GraphScene';
import { BackgroundField } from './BackgroundField';

export function KnowledgeGraph() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 180], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#f7f7f8' }}
      >
        {/* Lighting — bright and warm for light theme */}
        <ambientLight intensity={0.6} />
        <pointLight position={[50, 50, 50]} color="#fff5e6" intensity={0.5} />
        <pointLight position={[-40, -30, 40]} color="#ffe8cc" intensity={0.3} />

        {/* Subtle ambient particles */}
        <BackgroundField />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={20}
          maxDistance={500}
          enablePan={true}
          autoRotate
          autoRotateSpeed={0.15}
        />

        {/* Graph content */}
        <GraphScene />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            intensity={0.15}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
