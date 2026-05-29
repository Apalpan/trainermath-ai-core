import AILiveOrb from './components/ai-mascot/AILiveOrb';

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03110B] px-5 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <div className="relative grid place-items-center">
          <div className="absolute h-[82vw] max-h-[760px] w-[82vw] max-w-[760px] rounded-full bg-[#33F28B]/18 blur-3xl" />
          <div className="absolute h-[62vw] max-h-[560px] w-[62vw] max-w-[560px] rounded-full bg-[#A7F3D0]/10 blur-3xl" />
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
