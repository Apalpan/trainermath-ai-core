import AILiveOrb from './components/ai-mascot/AILiveOrb';

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03110B] px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-5">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-[#E9FFF3] sm:text-5xl">
            AILive
          </h1>
        </div>

        <div className="relative grid place-items-center pt-2">
          <div className="absolute h-[76vw] max-h-[680px] w-[76vw] max-w-[680px] rounded-full bg-[#33F28B]/16 blur-3xl" />
          <div className="absolute h-[58vw] max-h-[500px] w-[58vw] max-w-[500px] rounded-full bg-[#A7F3D0]/8 blur-3xl" />
          <AILiveOrb
            size="xl"
            view="automation"
            intensity="high"
            autoCycle
            interactive
            showConnections
            className="z-10"
          />
        </div>
      </section>
    </main>
  );
}

export default App;
