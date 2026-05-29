'use client';

import { useState } from 'react';
import AIMascotOrb from '../../components/ai-mascot/AIMascotOrb';
import type { AIMascotMood } from '../../components/ai-mascot/types';

const moods: AIMascotMood[] = ['idle', 'thinking', 'listening', 'processing', 'speaking'];

export default function AIMascotDemoPage() {
  const [mood, setMood] = useState<AIMascotMood>('thinking');
  const [showConnections, setShowConnections] = useState(true);
  const [interactive, setInteractive] = useState(true);

  return (
    <main className="min-h-screen bg-[#050711] px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AI Mascot Orb</h1>
          <p className="mt-3 text-sm text-white/62">
            An abstract neural companion for intelligent interfaces.
          </p>
        </div>

        <AIMascotOrb
          size="lg"
          mood={mood}
          intensity="medium"
          interactive={interactive}
          showConnections={showConnections}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {moods.map((item) => (
            <button
              key={item}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                mood === item
                  ? 'border-[#18C8FF] bg-[#18C8FF]/14 text-white shadow-[0_0_26px_rgba(24,200,255,0.18)]'
                  : 'border-white/12 bg-white/[0.04] text-white/68 hover:border-[#18C8FF]/60 hover:text-white'
              }`}
              onClick={() => setMood(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/72">
          <span className="rounded-md bg-[#18C8FF]/10 px-3 py-2 text-[#DFF7FF]">Mood: {mood}</span>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-white/[0.05]">
            <input
              className="accent-[#18C8FF]"
              type="checkbox"
              checked={showConnections}
              onChange={(event) => setShowConnections(event.target.checked)}
            />
            Connections
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-white/[0.05]">
            <input
              className="accent-[#18C8FF]"
              type="checkbox"
              checked={interactive}
              onChange={(event) => setInteractive(event.target.checked)}
            />
            Interactive
          </label>
        </div>
      </section>
    </main>
  );
}
