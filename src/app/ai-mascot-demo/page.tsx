'use client';

import AILiveOrb from '../../components/ai-mascot/AILiveOrb';

export default function AIMascotDemoPage() {
  return (
    <main className="min-h-screen bg-[#03110B] px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-5">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#E9FFF3] sm:text-5xl">AILive</h1>
        </div>

        <AILiveOrb size="xl" view="automation" intensity="high" autoCycle interactive showConnections />
      </section>
    </main>
  );
}
