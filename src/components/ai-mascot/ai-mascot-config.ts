import type {
  AIMascotIntensity,
  AIMascotMood,
  AIMascotMoodConfig,
  AIMascotSize,
  AIMascotSizeConfig,
  AILiveView,
} from './types';

export const aiMascotColors = {
  background: '#03110B',
  particleCore: '#F4FFF8',
  particleSoft: '#BFFFD7',
  cyan: '#39FF88',
  blue: '#22C55E',
  violet: '#86EFAC',
  glow: 'rgba(51, 242, 139, 0.45)',
  connection: 'rgba(233, 255, 243, 0.2)',
};

export const sizeConfig: Record<AIMascotSize, AIMascotSizeConfig> = {
  sm: {
    pixels: 160,
    particles: 300,
    connections: 54,
    synapses: 18,
    radius: 1.34,
    pointSize: 0.015,
  },
  md: {
    pixels: 280,
    particles: 540,
    connections: 92,
    synapses: 28,
    radius: 1.48,
    pointSize: 0.014,
  },
  lg: {
    pixels: 440,
    particles: 980,
    connections: 154,
    synapses: 44,
    radius: 1.62,
    pointSize: 0.0125,
  },
  xl: {
    pixels: 640,
    particles: 1360,
    connections: 190,
    synapses: 62,
    radius: 1.76,
    pointSize: 0.0115,
  },
};

export const moodConfig: Record<AIMascotMood, AIMascotMoodConfig> = {
  idle: {
    rotationSpeed: 0.1,
    pulseSpeed: 0.78,
    pulseAmplitude: 0.042,
    particleNoise: 0.025,
    glowIntensity: 0.34,
    connectionOpacity: 0.15,
    contraction: 1,
    satelliteSpeed: 0.34,
  },
  thinking: {
    rotationSpeed: 0.15,
    pulseSpeed: 1.08,
    pulseAmplitude: 0.078,
    particleNoise: 0.052,
    glowIntensity: 0.48,
    connectionOpacity: 0.24,
    contraction: 1.02,
    satelliteSpeed: 0.5,
  },
  listening: {
    rotationSpeed: 0.08,
    pulseSpeed: 0.58,
    pulseAmplitude: 0.036,
    particleNoise: 0.026,
    glowIntensity: 0.4,
    connectionOpacity: 0.18,
    contraction: 0.92,
    satelliteSpeed: 0.3,
  },
  processing: {
    rotationSpeed: 0.24,
    pulseSpeed: 1.62,
    pulseAmplitude: 0.118,
    particleNoise: 0.088,
    glowIntensity: 0.64,
    connectionOpacity: 0.34,
    contraction: 1.16,
    satelliteSpeed: 0.76,
  },
  speaking: {
    rotationSpeed: 0.14,
    pulseSpeed: 1.34,
    pulseAmplitude: 0.092,
    particleNoise: 0.058,
    glowIntensity: 0.56,
    connectionOpacity: 0.26,
    contraction: 1.06,
    satelliteSpeed: 0.6,
  },
};

export const intensityConfig: Record<AIMascotIntensity, { particles: number; glow: number; speed: number }> = {
  low: {
    particles: 0.76,
    glow: 0.82,
    speed: 0.82,
  },
  medium: {
    particles: 1,
    glow: 1,
    speed: 1,
  },
  high: {
    particles: 1.22,
    glow: 1.2,
    speed: 1.18,
  },
};

export const mobileReduction = {
  particles: 0.58,
  connections: 0.52,
};

export const viewMoodMap: Record<AILiveView, AIMascotMood> = {
  ambient: 'idle',
  chat: 'listening',
  dashboard: 'thinking',
  learning: 'thinking',
  automation: 'processing',
  command: 'speaking',
};
