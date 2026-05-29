'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { motion } from 'motion/react';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { AIMascotFallback } from './AIMascotFallback';
import { aiMascotColors, intensityConfig, moodConfig } from './ai-mascot-config';
import { useAIMascotMotion } from './useAIMascotMotion';
import type { AIMascotIntensity, AIMascotMood, AIMascotOrbProps } from './types';

type ParticleSystem = {
  basePositions: Float32Array;
  currentPositions: Float32Array;
  colors: Float32Array;
  phases: Float32Array;
  amplitudes: Float32Array;
  roles: Float32Array;
  connectionPairs: Uint16Array;
  synapsePairs: Uint16Array;
  particleGeometry: THREE.BufferGeometry;
  lineGeometry: THREE.BufferGeometry;
  synapseGeometry: THREE.BufferGeometry;
};

type SceneProps = {
  mood: AIMascotMood;
  intensity: AIMascotIntensity;
  particleCount: number;
  connectionCount: number;
  synapseCount: number;
  radius: number;
  pointSize: number;
  interactive: boolean;
  showConnections: boolean;
};

export default function AIMascotOrb({
  size = 'md',
  mood = 'idle',
  intensity = 'medium',
  interactive = true,
  showConnections = true,
  className = '',
}: AIMascotOrbProps) {
  const motionConfig = useAIMascotMotion(size, intensity);
  const [renderFailed, setRenderFailed] = useState(false);
  const useFallback = renderFailed || motionConfig.prefersReducedMotion || !motionConfig.webglSupported;

  if (useFallback) {
    return <AIMascotFallback size={size} mood={mood} className={className} />;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        width: motionConfig.pixels,
        height: motionConfig.pixels,
        maxWidth: '86vw',
        maxHeight: '86vw',
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.72, ease: [0.2, 0.8, 0.2, 1] }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        onError={() => setRenderFailed(true)}
      >
        <Suspense fallback={null}>
          <AIMascotScene
            mood={mood}
            intensity={intensity}
            particleCount={motionConfig.particleCount}
            connectionCount={motionConfig.connectionCount}
            synapseCount={motionConfig.synapseCount}
            radius={motionConfig.radius}
            pointSize={motionConfig.pointSize}
            interactive={interactive}
            showConnections={showConnections}
          />
          <Preload all />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}

function AIMascotScene({
  mood,
  intensity,
  particleCount,
  connectionCount,
  synapseCount,
  radius,
  pointSize,
  interactive,
  showConnections,
}: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsMaterialRef = useRef<THREE.PointsMaterial>(null);
  const echoMaterialRef = useRef<THREE.PointsMaterial>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const synapseMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const system = useMemo(
    () => createParticleSystem(particleCount, connectionCount, synapseCount, radius),
    [connectionCount, particleCount, radius, synapseCount],
  );
  const echoSystem = useMemo(() => createEchoGeometry(Math.max(32, Math.round(particleCount * 0.08)), radius), [particleCount, radius]);
  const moodSettings = moodConfig[mood];
  const intensitySettings = intensityConfig[intensity];

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    const positions = system.particleGeometry.attributes.position as THREE.BufferAttribute;
    const linePositions = system.lineGeometry.attributes.position as THREE.BufferAttribute;
    const synapsePositions = system.synapseGeometry.attributes.position as THREE.BufferAttribute;
    const echoPositions = echoSystem.geometry.attributes.position as THREE.BufferAttribute;
    const moodPulse = Math.sin(elapsed * moodSettings.pulseSpeed) * moodSettings.pulseAmplitude;
    const thinkingPulse = mood === 'thinking' ? Math.sin(elapsed * 2.7) * 0.024 : 0;
    const speakingWave = mood === 'speaking' ? Math.sin(elapsed * 4.2) * 0.055 : 0;
    const globalScale = moodSettings.contraction + moodPulse + thinkingPulse + speakingWave;
    const pointerX = interactive ? THREE.MathUtils.clamp(state.pointer.x, -0.85, 0.85) : 0;
    const pointerY = interactive ? THREE.MathUtils.clamp(state.pointer.y, -0.85, 0.85) : 0;

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * moodSettings.rotationSpeed * intensitySettings.speed;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, pointerY * 0.13, 0.045);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -pointerX * 0.08, 0.04);
      groupRef.current.scale.setScalar(globalScale);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pointerX * 0.08, 0.04);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, pointerY * 0.06, 0.04);
    }

    for (let index = 0; index < system.currentPositions.length / 3; index += 1) {
      const offset = index * 3;
      const bx = system.basePositions[offset];
      const by = system.basePositions[offset + 1];
      const bz = system.basePositions[offset + 2];
      const phase = system.phases[index];
      const amplitude = system.amplitudes[index];
      const role = system.roles[index];
      const baseVector = new THREE.Vector3(bx, by, bz);
      const normal = baseVector.clone().normalize();
      const thoughtNoise =
        Math.sin(elapsed * (0.85 + role * 0.42) + phase) * moodSettings.particleNoise * amplitude +
        Math.cos(elapsed * 0.54 + phase * 1.7) * moodSettings.particleNoise * 0.5;
      const mouseBend = interactive ? (pointerX * normal.x + pointerY * normal.y) * 0.028 : 0;
      const orbitAngle = elapsed * moodSettings.satelliteSpeed * (role > 1.55 ? 1.8 : 0.36) + phase;
      const roleExpansion = role > 1.55 ? 1.08 + Math.sin(orbitAngle) * 0.04 : 1;
      const processingDrift = mood === 'processing' ? Math.sin(elapsed * 1.9 + phase) * 0.035 : 0;
      const listeningPull = mood === 'listening' ? -0.045 * (1 - role * 0.28) : 0;
      const speakingRipple = mood === 'speaking' ? Math.sin(elapsed * 3.6 - baseVector.length() * 2.1 + phase) * 0.052 : 0;
      const scale = roleExpansion + thoughtNoise + mouseBend + processingDrift + listeningPull + speakingRipple;

      system.currentPositions[offset] = bx * scale + Math.cos(orbitAngle) * 0.012 * role;
      system.currentPositions[offset + 1] = by * scale + Math.sin(orbitAngle * 0.73) * 0.012 * role;
      system.currentPositions[offset + 2] = bz * scale + Math.sin(orbitAngle * 0.91) * 0.014 * role;
    }

    positions.array.set(system.currentPositions);
    positions.needsUpdate = true;

    for (let pairIndex = 0; pairIndex < system.connectionPairs.length / 2; pairIndex += 1) {
      const a = system.connectionPairs[pairIndex * 2] * 3;
      const b = system.connectionPairs[pairIndex * 2 + 1] * 3;
      const target = pairIndex * 6;
      linePositions.setXYZ(
        target / 3,
        system.currentPositions[a],
        system.currentPositions[a + 1],
        system.currentPositions[a + 2],
      );
      linePositions.setXYZ(
        target / 3 + 1,
        system.currentPositions[b],
        system.currentPositions[b + 1],
        system.currentPositions[b + 2],
      );
    }
    linePositions.needsUpdate = true;

    for (let pairIndex = 0; pairIndex < system.synapsePairs.length / 2; pairIndex += 1) {
      const a = system.synapsePairs[pairIndex * 2] * 3;
      const b = system.synapsePairs[pairIndex * 2 + 1] * 3;
      const target = pairIndex * 6;
      const phase = elapsed * (0.88 + moodSettings.satelliteSpeed) + pairIndex * 0.37;
      const waveHead = (Math.sin(phase) + 1) * 0.5;
      const tail = Math.max(0, waveHead - 0.18);
      const ax = system.currentPositions[a];
      const ay = system.currentPositions[a + 1];
      const az = system.currentPositions[a + 2];
      const bx = system.currentPositions[b];
      const by = system.currentPositions[b + 1];
      const bz = system.currentPositions[b + 2];

      synapsePositions.setXYZ(
        target / 3,
        THREE.MathUtils.lerp(ax, bx, tail),
        THREE.MathUtils.lerp(ay, by, tail),
        THREE.MathUtils.lerp(az, bz, tail),
      );
      synapsePositions.setXYZ(
        target / 3 + 1,
        THREE.MathUtils.lerp(ax, bx, waveHead),
        THREE.MathUtils.lerp(ay, by, waveHead),
        THREE.MathUtils.lerp(az, bz, waveHead),
      );
    }
    synapsePositions.needsUpdate = true;

    for (let index = 0; index < echoSystem.basePositions.length / 3; index += 1) {
      const offset = index * 3;
      const bx = echoSystem.basePositions[offset];
      const by = echoSystem.basePositions[offset + 1];
      const bz = echoSystem.basePositions[offset + 2];
      const wave = mood === 'speaking' ? 1 + ((elapsed * 0.34 + index * 0.017) % 0.32) : 0.96;
      echoPositions.setXYZ(offset / 3, bx * wave, by * wave, bz * wave);
    }
    echoPositions.needsUpdate = true;

    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.size = pointSize * (1 + (mood === 'processing' ? 0.22 : 0.08) * Math.sin(elapsed * 1.7));
      pointsMaterialRef.current.opacity = 0.72 + Math.sin(elapsed * moodSettings.pulseSpeed) * 0.08;
    }

    if (echoMaterialRef.current) {
      echoMaterialRef.current.opacity = mood === 'speaking' ? 0.32 + Math.sin(elapsed * 3.4) * 0.14 : 0.08;
    }

    if (lineMaterialRef.current) {
      const flicker = mood === 'thinking' || mood === 'processing'
        ? 0.78 + Math.sin(elapsed * 2.8) * 0.26 + Math.sin(elapsed * 4.2) * 0.12
        : 0.78 + Math.sin(elapsed * 0.72) * 0.12;
      lineMaterialRef.current.opacity = showConnections ? moodSettings.connectionOpacity * flicker : 0;
    }

    if (synapseMaterialRef.current) {
      const activePulse = mood === 'processing' || mood === 'speaking' ? 1.2 : 0.86;
      synapseMaterialRef.current.opacity = showConnections
        ? moodSettings.connectionOpacity * activePulse * (0.68 + Math.sin(elapsed * 3.1) * 0.26)
        : 0;
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity =
        moodSettings.glowIntensity * intensitySettings.glow * 0.035 * (0.82 + Math.sin(elapsed * moodSettings.pulseSpeed) * 0.18);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh scale={[1.7, 1.7, 1.7]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={aiMascotColors.cyan}
          transparent
          opacity={moodSettings.glowIntensity * 0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <lineSegments geometry={system.lineGeometry}>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color={aiMascotColors.cyan}
          transparent
          opacity={showConnections ? moodSettings.connectionOpacity : 0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments geometry={system.synapseGeometry}>
        <lineBasicMaterial
          ref={synapseMaterialRef}
          color={aiMascotColors.particleCore}
          transparent
          opacity={showConnections ? moodSettings.connectionOpacity * 0.9 : 0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points geometry={system.particleGeometry}>
        <pointsMaterial
          ref={pointsMaterialRef}
          vertexColors
          size={pointSize}
          sizeAttenuation
          transparent
          opacity={0.74}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points geometry={echoSystem.geometry}>
        <pointsMaterial
          ref={echoMaterialRef}
          color={aiMascotColors.cyan}
          size={pointSize * 1.6}
          sizeAttenuation
          transparent
          opacity={mood === 'speaking' ? 0.24 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function createParticleSystem(
  count: number,
  connectionCount: number,
  synapseCount: number,
  radius: number,
): ParticleSystem {
  const random = seededRandom(9017);
  const basePositions = new Float32Array(count * 3);
  const currentPositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const amplitudes = new Float32Array(count);
  const roles = new Float32Array(count);
  const vectors: THREE.Vector3[] = [];
  const white = new THREE.Color(aiMascotColors.particleCore);
  const cyan = new THREE.Color(aiMascotColors.cyan);
  const blue = new THREE.Color(aiMascotColors.blue);
  const violet = new THREE.Color(aiMascotColors.violet);

  for (let index = 0; index < count; index += 1) {
    const roleSeed = random();
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const isSatellite = roleSeed > 0.92;
    const isInner = roleSeed < 0.32;
    const densityWave = 1 + Math.sin(theta * 2.6 + phi * 3.1) * 0.09;
    const shell = isSatellite ? 1.16 + random() * 0.22 : isInner ? 0.22 + random() * 0.46 : 0.62 + Math.pow(random(), 0.52) * 0.38;
    const r = radius * shell * densityWave;
    const x = r * Math.sin(phi) * Math.cos(theta) * (0.92 + random() * 0.16);
    const y = r * Math.cos(phi) * (0.82 + random() * 0.22);
    const z = r * Math.sin(phi) * Math.sin(theta) * (0.9 + random() * 0.2);
    const offset = index * 3;

    basePositions[offset] = x;
    basePositions[offset + 1] = y;
    basePositions[offset + 2] = z;
    currentPositions[offset] = x;
    currentPositions[offset + 1] = y;
    currentPositions[offset + 2] = z;
    vectors.push(new THREE.Vector3(x, y, z));

    phases[index] = random() * Math.PI * 2;
    amplitudes[index] = 0.7 + random() * 1.35;
    roles[index] = isSatellite ? 2 : isInner ? 0.55 : 1;

    const color = white.clone();
    color.lerp(roleSeed > 0.82 ? violet : roleSeed > 0.48 ? cyan : blue, 0.18 + random() * 0.42);
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const pairs: number[] = [];
  const synapsePairs: number[] = [];
  const attempts = (connectionCount + synapseCount) * 34;
  for (let attempt = 0; attempt < attempts && pairs.length < connectionCount * 2; attempt += 1) {
    const a = Math.floor(random() * count);
    const b = Math.floor(random() * count);
    if (a === b) continue;
    if (roles[a] > 1.8 || roles[b] > 1.8) continue;
    const distance = vectors[a].distanceTo(vectors[b]);
    if (distance > radius * 0.64 || distance < radius * 0.08) continue;
    pairs.push(a, b);
  }

  for (let attempt = 0; attempt < attempts && synapsePairs.length < synapseCount * 2; attempt += 1) {
    const a = Math.floor(random() * count);
    const b = Math.floor(random() * count);
    if (a === b) continue;
    if (roles[a] > 1.8 || roles[b] > 1.8) continue;
    const distance = vectors[a].distanceTo(vectors[b]);
    if (distance > radius * 0.52 || distance < radius * 0.08) continue;
    const isCoreSignal = vectors[a].length() < radius * 1.02 || vectors[b].length() < radius * 1.02;
    if (!isCoreSignal) continue;
    synapsePairs.push(a, b);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions.slice(), 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(pairs.length * 3);
  for (let pairIndex = 0; pairIndex < pairs.length / 2; pairIndex += 1) {
    const a = pairs[pairIndex * 2] * 3;
    const b = pairs[pairIndex * 2 + 1] * 3;
    const target = pairIndex * 6;
    linePositions[target] = currentPositions[a];
    linePositions[target + 1] = currentPositions[a + 1];
    linePositions[target + 2] = currentPositions[a + 2];
    linePositions[target + 3] = currentPositions[b];
    linePositions[target + 4] = currentPositions[b + 1];
    linePositions[target + 5] = currentPositions[b + 2];
  }
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const synapseGeometry = new THREE.BufferGeometry();
  const synapsePositions = new Float32Array(synapsePairs.length * 3);
  for (let pairIndex = 0; pairIndex < synapsePairs.length / 2; pairIndex += 1) {
    const a = synapsePairs[pairIndex * 2] * 3;
    const b = synapsePairs[pairIndex * 2 + 1] * 3;
    const target = pairIndex * 6;
    synapsePositions[target] = currentPositions[a];
    synapsePositions[target + 1] = currentPositions[a + 1];
    synapsePositions[target + 2] = currentPositions[a + 2];
    synapsePositions[target + 3] = currentPositions[b];
    synapsePositions[target + 4] = currentPositions[b + 1];
    synapsePositions[target + 5] = currentPositions[b + 2];
  }
  synapseGeometry.setAttribute('position', new THREE.BufferAttribute(synapsePositions, 3));

  return {
    basePositions,
    currentPositions,
    colors,
    phases,
    amplitudes,
    roles,
    connectionPairs: new Uint16Array(pairs),
    synapsePairs: new Uint16Array(synapsePairs),
    particleGeometry,
    lineGeometry,
    synapseGeometry,
  };
}

function createEchoGeometry(count: number, radius: number) {
  const random = seededRandom(7091);
  const basePositions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * (1.38 + random() * 0.26);
    const offset = index * 3;
    basePositions[offset] = r * Math.sin(phi) * Math.cos(theta);
    basePositions[offset + 1] = r * Math.cos(phi) * 0.86;
    basePositions[offset + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(basePositions.slice(), 3));
  return { geometry, basePositions };
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}
