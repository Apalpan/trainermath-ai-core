'use client';

import { useEffect, useState } from 'react';
import AIMascotOrb from './AIMascotOrb';
import { viewMoodMap } from './ai-mascot-config';
import type { AILiveOrbProps, AIMascotMood } from './types';

const liveCycle: AIMascotMood[] = ['idle', 'listening', 'thinking', 'processing', 'speaking', 'thinking'];

export default function AILiveOrb({
  view = 'ambient',
  mood,
  autoCycle = false,
  size = 'lg',
  intensity = 'high',
  interactive = true,
  showConnections = true,
  className = '',
}: AILiveOrbProps) {
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (!autoCycle || mood) return;
    const interval = window.setInterval(() => {
      setCycleIndex((value) => (value + 1) % liveCycle.length);
    }, 3600);
    return () => window.clearInterval(interval);
  }, [autoCycle, mood]);

  const resolvedMood = mood ?? (autoCycle ? liveCycle[cycleIndex] : viewMoodMap[view]);

  return (
    <AIMascotOrb
      size={size}
      mood={resolvedMood}
      intensity={intensity}
      interactive={interactive}
      showConnections={showConnections}
      className={className}
    />
  );
}
