'use client';

import AILiveOrb from '../../components/ai-mascot/AILiveOrb';

export default function AIMascotDemoPage() {
  return (
    <main className="min-h-screen bg-[#03110B] px-6 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <AILiveOrb size="xl" view="automation" intensity="high" autoCycle interactive showConnections />
      </section>
    </main>
  );
}
