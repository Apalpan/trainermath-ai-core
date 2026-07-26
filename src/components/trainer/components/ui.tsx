import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Calculator,
  Check,
  CircuitBoard,
  Cpu,
  GitBranch,
  Network,
  Sparkles,
  Sprout,
  X,
  Zap,
} from 'lucide-react';
import type { AnswerChoice, ChoiceKey } from '../../../types';
import type { RankDef } from '../../../lib/gameSystem';
import { getComboTier } from '../../../lib/gameSystem';

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="tm-eyebrow">{children}</p>;
}

export function Keycap({ label, pressed }: { label: string; pressed?: boolean }) {
  return (
    <span className="tm-keycap" data-pressed={pressed ? 'true' : undefined} aria-hidden="true">
      {label}
    </span>
  );
}

export type ChoiceVisualState = 'idle' | 'correct' | 'wrong' | 'dim' | 'reveal';

export function ChoiceCard({
  choice,
  state,
  disabled,
  pressed,
  onSelect,
}: {
  choice: AnswerChoice;
  state: ChoiceVisualState;
  disabled: boolean;
  pressed: boolean;
  onSelect: (choice: AnswerChoice) => void;
}) {
  const dataState = state === 'reveal' ? 'correct' : state === 'idle' ? undefined : state;
  return (
    <button
      type="button"
      className="tm-choice flex min-h-[88px] items-center gap-4 px-5 py-4 text-left sm:min-h-[96px]"
      data-state={dataState}
      disabled={disabled}
      onClick={() => onSelect(choice)}
    >
      <span className="tm-choice-key" data-pressed={pressed ? 'true' : undefined}>
        {choice.key}
      </span>
      <span className="tm-display min-w-0 flex-1 break-words text-2xl font-bold sm:text-3xl">{choice.label}</span>
      {(state === 'correct' || state === 'reveal') && <Check size={22} aria-hidden="true" style={{ color: 'var(--tm-good)', flexShrink: 0 }} />}
      {state === 'wrong' && <X size={22} aria-hidden="true" style={{ color: 'var(--tm-bad)', flexShrink: 0 }} />}
    </button>
  );
}

export function ChoiceGrid({
  choices,
  selectedKey,
  isLocked,
  pressedKey,
  onSelect,
}: {
  choices: AnswerChoice[];
  selectedKey: ChoiceKey | null;
  isLocked: boolean;
  pressedKey: ChoiceKey | null;
  onSelect: (choice: AnswerChoice) => void;
}) {
  const visualState = (choice: AnswerChoice): ChoiceVisualState => {
    if (!isLocked) return 'idle';
    if (choice.isCorrect) return selectedKey === choice.key ? 'correct' : 'reveal';
    if (selectedKey === choice.key) return 'wrong';
    return 'dim';
  };
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-2" role="group" aria-label="Opciones de respuesta">
      {choices.map((choice) => (
        <ChoiceCard
          key={choice.key}
          choice={choice}
          state={visualState(choice)}
          disabled={isLocked}
          pressed={pressedKey === choice.key}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function ProgressTopBar({ progress, hot }: { progress: number; hot?: boolean }) {
  return (
    <div className="tm-progress-track fixed inset-x-0 top-0 z-40" aria-hidden="true" style={{ borderRadius: 0 }}>
      <div className="tm-progress-bar" data-hot={hot ? 'true' : undefined} style={{ width: `${Math.min(100, Math.max(0, progress))}%`, borderRadius: 0 }} />
    </div>
  );
}

export function ComboPill({ combo, flare }: { combo: number; flare: boolean }) {
  const tier = getComboTier(combo);
  // el contenedor aria-live vive siempre montado para que el primer combo sí se anuncie
  return (
    <div aria-live="polite">
      {combo >= 2 && (
        <div
          className={`tm-combo-pill ${flare ? 'tm-combo-flare' : ''}`}
          data-tier={tier.tier}
          aria-label={`Combo ${combo}`}
        >
          <span className="tm-display text-base font-bold">×{combo}</span>
          {tier.label && <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">{tier.label}</span>}
        </div>
      )}
    </div>
  );
}

export function StatChip({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'good' | 'bad' }) {
  const color = tone === 'accent' ? 'var(--tm-accent)' : tone === 'good' ? 'var(--tm-good)' : tone === 'bad' ? 'var(--tm-bad)' : 'var(--tm-fg)';
  return (
    <div className="tm-card px-4 py-3">
      <p className="tm-eyebrow">{label}</p>
      <p className="tm-display mt-1 break-words text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

const rankIcons: Record<string, ReactNode> = {
  aprendiz: <Sprout size={18} />,
  calculista: <Calculator size={18} />,
  operador: <Zap size={18} />,
  sinapsis: <GitBranch size={18} />,
  nucleo: <CircuitBoard size={18} />,
  procesador: <Cpu size={18} />,
  arquitecto: <Network size={18} />,
  maestro: <Brain size={18} />,
  singularidad: <Sparkles size={18} />,
};

export function RankBadge({ rank, size = 'md', celebrate }: { rank: RankDef; size?: 'md' | 'xl'; celebrate?: boolean }) {
  const dimension = size === 'xl' ? 72 : 44;
  return (
    <div
      className={`tm-rank-badge ${celebrate ? 'tm-glow-ring' : ''}`}
      data-rank={rank.index}
      style={{ width: dimension, height: dimension }}
      aria-label={`Rango ${rank.name}`}
    >
      <span style={{ transform: size === 'xl' ? 'scale(1.6)' : undefined, display: 'inline-flex' }}>{rankIcons[rank.id]}</span>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <svg viewBox="0 0 200 44" className="h-11 w-full" aria-hidden="true">
        <line x1="0" y1="22" x2="200" y2="22" stroke="var(--tm-border-strong)" strokeWidth="2" strokeDasharray="4 6" />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 200},${38 - ((value - min) / span) * 32}`)
    .join(' ');
  return (
    <svg viewBox="0 0 200 44" className="h-11 w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--tm-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Cronómetro de sesión: mm:ss tabular, tick de 500ms, sin re-render del padre. */
export function SessionClock({ startedAt, prefix }: { startedAt: number; prefix?: string }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => forceTick((value) => value + 1), 500);
    return () => window.clearInterval(timer);
  }, []);
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{minutes}:{seconds}
    </span>
  );
}

/** Count-up animado con rAF; respeta reduced-motion. */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [durationMs, target]);
  return value;
}

export function GhostButton({ children, onClick, autoFocusRef, ariaLabel }: { children: ReactNode; onClick: () => void; autoFocusRef?: boolean; ariaLabel?: string }) {
  return (
    <button type="button" className="tm-btn-ghost px-4 py-2.5 text-sm" onClick={onClick} autoFocus={autoFocusRef} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export function ExitConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Modal real: Esc cierra, Tab queda atrapado dentro del diálogo (fase captura,
  // gana a los handlers de la pantalla de fondo).
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button') ?? []);
        if (!items.length) return;
        event.preventDefault();
        event.stopPropagation();
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? (index <= 0 ? items.length - 1 : index - 1)
          : (index >= items.length - 1 ? 0 : index + 1);
        items[next].focus();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: 'oklch(0 0 0 / 0.55)' }} role="dialog" aria-modal="true" aria-label="Confirmar salida">
      <div ref={dialogRef} className="tm-card-solid tm-screen w-full max-w-sm p-6">
        <p className="tm-display text-lg font-bold">¿Salir del entrenamiento?</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--tm-fg-muted)' }}>Perderás esta ronda.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="tm-btn-ghost px-4 py-3 text-sm" onClick={onConfirm}>Salir</button>
          <button type="button" className="tm-btn-cta px-4 py-3 text-sm" onClick={onCancel} autoFocus>Seguir</button>
        </div>
      </div>
    </div>
  );
}
