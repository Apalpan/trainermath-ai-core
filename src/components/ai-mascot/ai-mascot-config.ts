import type {
  AIMascotIntensity,
  AIMascotMood,
  AIMascotMoodConfig,
  AIMascotSize,
  AIMascotSizeConfig,
} from './types';

export const aiMascotColors = {
  background: '#050711',
  particleCore: '#FFFFFF',
  particleSoft: '#DFF7FF',
  cyan: '#18C8FF',
  blue: '#0A74FF',
  violet: '#7C3AED',
  glow: 'rgba(24, 200, 255, 0.45)',
  connection: 'rgba(223, 247, 255, 0.18)',
};

export const sizeConfig: Record<AIMascotSize, AIMascotSizeConfig> = {
  sm: {
    pixels: 160,
    particles: 240,
    connections: 42,
    radius: 1.34,
    pointSize: 0.015,
  },
  md: {
    pixels: 280,
    particles: 420,
    connections: 72,
    radius: 1.48,
    pointSize: 0.014,
  },
  lg: {
    pixels: 440,
    particles: 760,
    connections: 118,
    radius: 1.62,
    pointSize: 0.0125,
  },
  xl: {
    pixels: 640,
    particles: 1120,
    connections: 146,
    radius: 1.76,
    pointSize: 0.0115,
  },
};

export const moodConfig: Record<AIMascotMood, AIMascotMoodConfig> = {
  idle: {
    rotationSpeed: 0.08,
    pulseSpeed: 0.65,
    pulseAmplitude: 0.035,
    particleNoise: 0.018,
    glowIntensity: 0.25,
    connectionOpacity: 0.12,
    contraction: 1,
    satelliteSpeed: 0.28,
  },
  thinking: {
    rotationSpeed: 0.11,
    pulseSpeed: 0.9,
    pulseAmplitude: 0.06,
    particleNoise: 0.035,
    glowIntensity: 0.38,
    connectionOpacity: 0.18,
    contraction: 1.02,
    satelliteSpeed: 0.36,
  },
  listening: {
    rotationSpeed: 0.06,
    pulseSpeed: 0.45,
    pulseAmplitude: 0.025,
    particleNoise: 0.014,
    glowIntensity: 0.3,
    connectionOpacity: 0.14,
    contraction: 0.88,
    satelliteSpeed: 0.2,
  },
  processing: {
    rotationSpeed: 0.18,
    pulseSpeed: 1.35,
    pulseAmplitude: 0.085,
    particleNoise: 0.055,
    glowIntensity: 0.52,
    connectionOpacity: 0.24,
    contraction: 1.13,
    satelliteSpeed: 0.58,
  },
  speaking: {
    rotationSpeed: 0.1,
    pulseSpeed: 1.15,
    pulseAmplitude: 0.075,
    particleNoise: 0.04,
    glowIntensity: 0.46,
    connectionOpacity: 0.2,
    contraction: 1.04,
    satelliteSpeed: 0.42,
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
    particles: 1.16,
    glow: 1.14,
    speed: 1.12,
  },
};

export const mobileReduction = {
  particles: 0.52,
  connections: 0.46,
};
