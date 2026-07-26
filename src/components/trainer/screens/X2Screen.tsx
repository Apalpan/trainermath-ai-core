import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { formatCompactNumber, formatDuration } from '../../../lib/scoring';
import { playCorrect } from '../../../lib/soundEngine';
import type { DoubleX2Config } from '../../../types';
import { ExitConfirm, Keycap, ProgressTopBar, SessionClock, StatChip } from '../components/ui';

export interface X2Result {
  history: number[];
  stepDurations: number[];
  totalTimeMs: number;
}

export default function X2Screen({
  config,
  onComplete,
  onExit,
}: {
  config: DoubleX2Config;
  onComplete: (result: X2Result) => void;
  onExit: () => void;
}) {
  const [history, setHistory] = useState<number[]>([config.start, config.start * 2]);
  const [index, setIndex] = useState(1);
  const [showExit, setShowExit] = useState(false);
  const stepDurationsRef = useRef<number[]>([]);
  const lastStepAtRef = useRef(Date.now());
  const startedAtRef = useRef(Date.now());

  const stepLimitReached = config.stepLimit !== 'infinite' && index >= config.stepLimit;
  const currentValue = history[index] ?? config.start;
  const stepCount = Math.max(0, index);

  const advance = useCallback(() => {
    if (stepLimitReached || showExit) return;
    const now = Date.now();
    // registrar duración solo cuando el avance crea un paso NUEVO
    // (re-avanzar tras «Anterior» no desalinea stepDurations con history)
    if (index + 1 >= history.length) {
      stepDurationsRef.current = [...stepDurationsRef.current, now - lastStepAtRef.current];
    }
    lastStepAtRef.current = now;
    playCorrect(0);
    setHistory((current) => (index + 1 < current.length ? current : [...current, current[index] * 2]));
    setIndex((value) => value + 1);
  }, [history.length, index, showExit, stepLimitReached]);

  const back = useCallback(() => setIndex((value) => Math.max(0, value - 1)), []);

  const restart = useCallback(() => {
    setHistory([config.start, config.start * 2]);
    setIndex(1);
    stepDurationsRef.current = [];
    lastStepAtRef.current = Date.now();
  }, [config.start]);

  const save = useCallback(() => {
    onComplete({
      history: history.slice(0, index + 1),
      stepDurations: stepDurationsRef.current,
      totalTimeMs: Date.now() - startedAtRef.current,
    });
  }, [history, index, onComplete]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showExit || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); advance(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); restart(); }
      if (event.key === 'Enter') { event.preventDefault(); save(); }
      if (event.key === 'Escape') { event.preventDefault(); setShowExit(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance, back, restart, save, showExit]);

  const progress = config.stepLimit === 'infinite' ? 0 : (stepCount / config.stepLimit) * 100;
  const averageStepMs = stepDurationsRef.current.length
    ? stepDurationsRef.current.reduce((sum, value) => sum + value, 0) / stepDurationsRef.current.length
    : 0;
  const historyPreview = history.slice(Math.max(0, index - 4), index + 1).map(formatCompactNumber).join(' → ');

  return (
    <div className="tm-screen relative flex min-h-screen flex-col px-5 pb-8 pt-14">
      {config.stepLimit !== 'infinite' && <ProgressTopBar progress={progress} />}

      <button
        type="button"
        className="tm-btn-ghost fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center"
        style={{ padding: 0 }}
        aria-label="Salir del entrenamiento"
        onClick={() => setShowExit(true)}
      >
        <X size={17} />
      </button>

      <p className="fixed right-5 top-4 z-40 text-sm font-bold" style={{ color: 'var(--tm-fg-muted)' }}>
        Paso {stepCount}{config.stepLimit !== 'infinite' ? ` / ${config.stepLimit}` : ''}
        <span className="ml-2 opacity-80"><SessionClock startedAt={startedAtRef.current} /></span>
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div key={currentValue} className="tm-big-number tm-display tm-anzan-size max-w-full break-all text-center font-bold" style={{ color: 'var(--tm-fg)' }}>
          {formatCompactNumber(currentValue)}
        </div>

        <p className="max-w-xl truncate text-sm font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{historyPreview}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-5 py-3.5 text-sm" onClick={back}>
            <ArrowLeft size={16} /> Anterior
          </button>
          <button type="button" className="tm-btn-cta tm-press inline-flex items-center gap-2 px-7 py-3.5 text-sm font-extrabold" disabled={stepLimitReached} onClick={advance}>
            Duplicar <ArrowRight size={16} /> <Keycap label="→" />
          </button>
          <button type="button" className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-5 py-3.5 text-sm" onClick={restart} aria-label="Reiniciar">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="grid w-full max-w-xl grid-cols-3 gap-3">
          <StatChip label="Pasos" value={String(stepCount)} />
          <StatChip label="Prom. paso" value={averageStepMs ? formatDuration(averageStepMs) : '--'} />
          <StatChip label="Máximo" value={formatCompactNumber(Math.max(...history.slice(0, index + 1)))} />
        </div>

        <button type="button" className="tm-btn-ghost tm-press px-6 py-3 text-sm" onClick={save}>
          Terminar y guardar — Enter
        </button>
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={() => setShowExit(false)} />}
    </div>
  );
}
