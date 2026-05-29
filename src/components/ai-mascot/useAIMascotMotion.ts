'use client';

import { useEffect, useMemo, useState } from 'react';
import { intensityConfig, mobileReduction, sizeConfig } from './ai-mascot-config';
import type { AIMascotIntensity, AIMascotSize } from './types';

export function useAIMascotMotion(size: AIMascotSize, intensity: AIMascotIntensity) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(media.matches);
    updateMotionPreference();
    media.addEventListener('change', updateMotionPreference);
    return () => media.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    setWebglSupported(Boolean(context));
  }, []);

  return useMemo(() => {
    const isMobile = viewportWidth < 720;
    const base = sizeConfig[size];
    const intensityScale = intensityConfig[intensity];
    const mobileParticleScale = isMobile ? mobileReduction.particles : 1;
    const mobileConnectionScale = isMobile ? mobileReduction.connections : 1;

    return {
      pixels: Math.round(isMobile ? Math.min(base.pixels, viewportWidth * 0.86) : base.pixels),
      particleCount: Math.max(140, Math.round(base.particles * intensityScale.particles * mobileParticleScale)),
      connectionCount: Math.max(24, Math.round(base.connections * intensityScale.particles * mobileConnectionScale)),
      radius: base.radius,
      pointSize: base.pointSize,
      prefersReducedMotion,
      webglSupported,
      isMobile,
    };
  }, [intensity, prefersReducedMotion, size, viewportWidth, webglSupported]);
}
