'use client';

import { aiMascotColors, moodConfig } from './ai-mascot-config';
import type { AIMascotMood, AIMascotSize } from './types';

type AIMascotFallbackProps = {
  size?: AIMascotSize;
  mood?: AIMascotMood;
  className?: string;
};

const fallbackSize: Record<AIMascotSize, number> = {
  sm: 160,
  md: 280,
  lg: 440,
  xl: 640,
};

export function AIMascotFallback({
  size = 'md',
  mood = 'idle',
  className = '',
}: AIMascotFallbackProps) {
  const pixels = fallbackSize[size];
  const config = moodConfig[mood];
  const dots = Array.from({ length: size === 'xl' ? 44 : size === 'lg' ? 34 : size === 'md' ? 24 : 16 });

  return (
    <div
      className={`ai-mascot-fallback relative overflow-hidden rounded-full ${className}`}
      style={{
        width: pixels,
        height: pixels,
        maxWidth: '86vw',
        maxHeight: '86vw',
        background:
          `radial-gradient(circle at 50% 50%, ${aiMascotColors.cyan}2b 0%, transparent 34%), ` +
          `radial-gradient(circle at 58% 46%, ${aiMascotColors.violet}24 0%, transparent 42%), ` +
          'radial-gradient(circle, rgba(223,247,255,0.08) 0%, transparent 62%)',
        boxShadow: `0 0 ${Math.round(pixels * 0.18)}px rgba(51, 242, 139, ${config.glowIntensity})`,
        animationDuration: `${Math.max(3.4 - config.pulseSpeed, 1.8)}s`,
      }}
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes aiMascotFallbackBreath {
            0%, 100% { transform: scale(0.985) rotate(0deg); filter: brightness(0.95); }
            50% { transform: scale(1.035) rotate(2deg); filter: brightness(1.12); }
          }
          @keyframes aiMascotFallbackNode {
            0%, 100% { opacity: 0.24; transform: translate3d(0, 0, 0) scale(0.82); }
            50% { opacity: 0.86; transform: translate3d(3px, -5px, 0) scale(1); }
          }
          .ai-mascot-fallback { animation-name: aiMascotFallbackBreath; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
          .ai-mascot-fallback-node { animation-name: aiMascotFallbackNode; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        `}
      </style>

      <div className="absolute inset-[13%] rounded-full border border-[#DFF7FF]/10" />
      <div className="absolute inset-[25%] rounded-full border border-[#18C8FF]/10 blur-[1px]" />

      {dots.map((_, index) => {
        const angle = (index / dots.length) * Math.PI * 2;
        const ring = index % 3 === 0 ? 0.68 : index % 3 === 1 ? 0.44 : 0.24;
        const x = 50 + Math.cos(angle * 1.27) * ring * 42;
        const y = 50 + Math.sin(angle * 0.91) * ring * 42;

        return (
          <span
            key={index}
            className="ai-mascot-fallback-node absolute h-1.5 w-1.5 rounded-full bg-[#E9FFF3] shadow-[0_0_14px_rgba(51,242,139,0.8)]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${index * 83}ms`,
              animationDuration: `${2.2 + (index % 5) * 0.34}s`,
            }}
          />
        );
      })}
    </div>
  );
}
