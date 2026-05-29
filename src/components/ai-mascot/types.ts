export type AIMascotSize = 'sm' | 'md' | 'lg' | 'xl';
export type AIMascotMood = 'idle' | 'thinking' | 'listening' | 'processing' | 'speaking';
export type AIMascotIntensity = 'low' | 'medium' | 'high';

export type AIMascotOrbProps = {
  size?: AIMascotSize;
  mood?: AIMascotMood;
  intensity?: AIMascotIntensity;
  interactive?: boolean;
  showConnections?: boolean;
  className?: string;
};

export type AIMascotSizeConfig = {
  pixels: number;
  particles: number;
  connections: number;
  radius: number;
  pointSize: number;
};

export type AIMascotMoodConfig = {
  rotationSpeed: number;
  pulseSpeed: number;
  pulseAmplitude: number;
  particleNoise: number;
  glowIntensity: number;
  connectionOpacity: number;
  contraction: number;
  satelliteSpeed: number;
};
