'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { motion } from 'motion/react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  aeOrbTheme,
  intensityScale,
  orbConfig,
  variantScale,
  type AICoreIntensity,
  type AICoreVariant,
} from './orb-config';

interface AICoreOrbProps {
  variant?: AICoreVariant;
  intensity?: AICoreIntensity;
  className?: string;
  interactive?: boolean;
  reducedMotion?: boolean;
}

type OrbSceneConfig = {
  particleCount: number;
  radius: number;
  rotationSpeed: number;
  pulseSpeed: number;
  pulseAmplitude: number;
  particleSize: number;
  opacity: number;
  connectionOpacity: number;
  glowIntensity: number;
  scale: number;
  reducedMotion: boolean;
  interactive: boolean;
};

export default function AICoreOrb({
  variant = 'hero',
  intensity = 'medium',
  className = '',
  interactive = true,
  reducedMotion = false,
}: AICoreOrbProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = reducedMotion || prefersReducedMotion;
  const particleCount = useResponsiveParticleCount(variant, intensity, shouldReduceMotion);

  const sceneConfig = useMemo<OrbSceneConfig>(() => {
    const scale = variantScale[variant] * intensityScale[intensity];
    return {
      particleCount,
      radius: orbConfig.radius,
      rotationSpeed: shouldReduceMotion ? orbConfig.rotationSpeed * 0.16 : orbConfig.rotationSpeed,
      pulseSpeed: shouldReduceMotion ? 0.08 : orbConfig.pulseSpeed,
      pulseAmplitude: shouldReduceMotion ? 0.015 : orbConfig.pulseAmplitude,
      particleSize: orbConfig.particleSize * (variant === 'compact' ? 0.85 : 1),
      opacity: shouldReduceMotion ? 0.58 : orbConfig.opacity,
      connectionOpacity: shouldReduceMotion ? 0.06 : orbConfig.connectionOpacity,
      glowIntensity: shouldReduceMotion ? 0.22 : orbConfig.glowIntensity,
      scale,
      reducedMotion: shouldReduceMotion,
      interactive: interactive && !shouldReduceMotion,
    };
  }, [intensity, interactive, particleCount, shouldReduceMotion, variant]);

  return (
    <motion.div
      className={`relative h-full min-h-[240px] w-full ${className}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 1.65]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <NeuralOrb config={sceneConfig} />
          <Preload all />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}

function NeuralOrb({ config }: { config: OrbSceneConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const mainMaterialRef = useRef<THREE.PointsMaterial>(null);
  const signalMaterialRef = useRef<THREE.PointsMaterial>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { particleGeometry, signalGeometry, lineGeometry } = useMemo(
    () => createOrbGeometries(config.particleCount, config.radius),
    [config.particleCount, config.radius],
  );

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(elapsed * config.pulseSpeed) * config.pulseAmplitude;

    if (groupRef.current) {
      const pointerX = config.interactive ? THREE.MathUtils.clamp(state.pointer.x, -0.7, 0.7) : 0;
      const pointerY = config.interactive ? THREE.MathUtils.clamp(state.pointer.y, -0.7, 0.7) : 0;

      groupRef.current.rotation.y += delta * config.rotationSpeed;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointerY * 0.12, 0.045);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -pointerX * 0.1, 0.045);
      groupRef.current.scale.setScalar(config.scale * pulse);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pointerX * 0.12, 0.04);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, pointerY * 0.08, 0.04);
    }

    if (mainMaterialRef.current) {
      mainMaterialRef.current.opacity = config.opacity + Math.sin(elapsed * 0.9) * 0.08;
    }

    if (signalMaterialRef.current) {
      signalMaterialRef.current.opacity = 0.36 + Math.sin(elapsed * 1.8) * 0.2;
      signalMaterialRef.current.size = config.particleSize * 2.25 + Math.sin(elapsed * 1.3) * 0.004;
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = config.glowIntensity + Math.sin(elapsed * 0.72) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh scale={[2.15, 2.15, 2.15]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={aeOrbTheme.glowColor}
          transparent
          opacity={config.glowIntensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={aeOrbTheme.cyan}
          transparent
          opacity={config.connectionOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points geometry={particleGeometry}>
        <pointsMaterial
          ref={mainMaterialRef}
          vertexColors
          size={config.particleSize}
          sizeAttenuation
          transparent
          opacity={config.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points geometry={signalGeometry}>
        <pointsMaterial
          ref={signalMaterialRef}
          color={aeOrbTheme.techCyan}
          size={config.particleSize * 2.25}
          sizeAttenuation
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function createOrbGeometries(count: number, radius: number) {
  const random = seededRandom(4207);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const signalPositions: number[] = [];
  const linePositions: number[] = [];
  const particleVectors: THREE.Vector3[] = [];
  const cyan = new THREE.Color(aeOrbTheme.cyan);
  const violet = new THREE.Color(aeOrbTheme.violet);
  const white = new THREE.Color(aeOrbTheme.particleColor);

  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const radialNoise = 0.64 + Math.pow(random(), 0.55) * 0.42 + Math.sin(index * 0.19) * 0.025;
    const shellRadius = radius * radialNoise;
    const warp = 1 + Math.sin(theta * 3.2 + phi * 1.7) * 0.06;
    const x = shellRadius * Math.sin(phi) * Math.cos(theta) * warp;
    const y = shellRadius * Math.cos(phi) * (0.84 + random() * 0.28);
    const z = shellRadius * Math.sin(phi) * Math.sin(theta) * (0.92 + random() * 0.18);

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    particleVectors.push(new THREE.Vector3(x, y, z));

    const color = white.clone().lerp(random() > 0.58 ? cyan : violet, random() * 0.42);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;

    if (index % 19 === 0) {
      signalPositions.push(x * 1.03, y * 1.03, z * 1.03);
    }
  }

  const maxLines = Math.min(190, Math.floor(count * 0.22));
  for (let index = 0; index < maxLines; index += 1) {
    const a = particleVectors[Math.floor(random() * particleVectors.length)];
    const b = particleVectors[Math.floor(random() * particleVectors.length)];
    if (!a || !b || a.distanceTo(b) > radius * 0.74) continue;

    linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const signalGeometry = new THREE.BufferGeometry();
  signalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(signalPositions, 3));

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  return { particleGeometry, signalGeometry, lineGeometry };
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function useResponsiveParticleCount(
  variant: AICoreVariant,
  intensity: AICoreIntensity,
  reducedMotion: boolean,
) {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const baseCount = width < 640
    ? orbConfig.mobileParticles
    : width < 1024
      ? orbConfig.tabletParticles
      : orbConfig.desktopParticles;
  const variantMultiplier = variant === 'compact' ? 0.62 : variant === 'background' ? 1.08 : 1;
  const intensityMultiplier = intensity === 'low' ? 0.72 : intensity === 'high' ? 1.08 : 1;
  const motionMultiplier = reducedMotion ? 0.52 : 1;

  return Math.max(180, Math.round(baseCount * variantMultiplier * intensityMultiplier * motionMultiplier));
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}
