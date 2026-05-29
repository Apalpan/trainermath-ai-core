export type AICoreVariant = 'hero' | 'section' | 'background' | 'compact';
export type AICoreIntensity = 'low' | 'medium' | 'high';

export const aeOrbTheme = {
  background: '#050711',
  deepNavy: '#080D1B',
  violet: '#7C3AED',
  blue: '#0A74FF',
  cyan: '#18C8FF',
  techCyan: '#35E6F7',
  particleColor: '#DFF7FF',
  glowColor: '#18C8FF',
};

export const orbConfig = {
  desktopParticles: 900,
  tabletParticles: 620,
  mobileParticles: 340,
  radius: 1.72,
  rotationSpeed: 0.08,
  pulseSpeed: 0.7,
  pulseAmplitude: 0.08,
  particleSize: 0.014,
  opacity: 0.78,
  connectionOpacity: 0.14,
  glowIntensity: 0.45,
  blur: 24,
};

export const variantScale: Record<AICoreVariant, number> = {
  hero: 1,
  section: 0.86,
  background: 1.14,
  compact: 0.62,
};

export const intensityScale: Record<AICoreIntensity, number> = {
  low: 0.72,
  medium: 1,
  high: 1.18,
};
