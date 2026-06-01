import { Maximize2, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { slides } from '../../deck/slides';
import DeckProgress from './DeckProgress';
import SlideRenderer from './SlideRenderer';

const clampSlide = (value: number) => Math.min(Math.max(value, 1), slides.length);

const getSlideFromHash = () => {
  const match = window.location.hash.match(/slide\/(\d+)/);
  return clampSlide(match ? Number(match[1]) : 1);
};

export default function DeckShell() {
  const [current, setCurrent] = useState(() => getSlideFromHash());
  const [showIndex, setShowIndex] = useState(false);

  const slide = useMemo(() => slides[current - 1], [current]);

  const goTo = useCallback((next: number) => {
    const normalized = clampSlide(next);
    window.location.hash = `/slide/${normalized}`;
    setCurrent(normalized);
  }, []);

  useEffect(() => {
    const onHashChange = () => setCurrent(getSlideFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/slide/1');
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        goTo(current + 1);
      }

      if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        goTo(current - 1);
      }

      if (event.key === 'Home') goTo(1);
      if (event.key === 'End') goTo(slides.length);
      if (event.key.toLowerCase() === 'i') setShowIndex((value) => !value);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, goTo]);

  const requestFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <main className="deck-app">
      <div className="deck-stage">
        <SlideRenderer slide={slide} total={slides.length} />
      </div>

      <aside className={`deck-index ${showIndex ? 'deck-index--open' : ''}`} aria-label="Indice de slides">
        <div>
          <strong>Mapa del deck</strong>
          <span>{slides.length} slides</span>
        </div>
        <nav>
          {slides.map((item) => (
            <button
              key={item.id}
              className={item.id === current ? 'active' : ''}
              onClick={() => goTo(item.id)}
              type="button"
            >
              <span>{String(item.id).padStart(2, '0')}</span>
              {item.title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="deck-controls" aria-label="Controles de presentacion">
        <button type="button" onClick={() => goTo(current - 1)} disabled={current === 1} aria-label="Slide anterior">
          <ChevronLeft size={18} />
        </button>
        <DeckProgress current={current} total={slides.length} />
        <button type="button" onClick={() => goTo(current + 1)} disabled={current === slides.length} aria-label="Slide siguiente">
          <ChevronRight size={18} />
        </button>
        <button type="button" onClick={() => setShowIndex((value) => !value)} aria-label="Mostrar indice">
          {showIndex ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <button type="button" onClick={requestFullscreen} aria-label="Pantalla completa">
          <Maximize2 size={18} />
        </button>
      </div>
    </main>
  );
}
