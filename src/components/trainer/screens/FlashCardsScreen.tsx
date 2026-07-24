import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eye, X as XIcon, X } from 'lucide-react';
import type { FlashCard, FlashDeckId } from '../../../lib/flashCards';
import { buildSessionQueue, gradeCard } from '../../../lib/flashCards';
import { computeXp, registerOperation } from '../../../lib/gameSystem';
import { playCorrect, playIncorrect } from '../../../lib/soundEngine';
import type { UserAnswer } from '../../../types';
import { ComboPill, ExitConfirm, Keycap, ProgressTopBar } from '../components/ui';

export interface FlashCardsResult {
  answers: UserAnswer[];
  totalTimeMs: number;
  xpEarned: number;
  bestCombo: number;
  decks: FlashDeckId[];
  amount: number;
}

const REINSERT_OFFSET = 3;

export default function FlashCardsScreen({
  decks,
  amount,
  onComplete,
  onExit,
}: {
  decks: FlashDeckId[];
  amount: number;
  onComplete: (result: FlashCardsResult) => void;
  onExit: () => void;
}) {
  const [queue, setQueue] = useState<FlashCard[]>(() => buildSessionQueue(decks, amount));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboFlare, setComboFlare] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const startedAtRef = useRef(Date.now());
  const cardShownAtRef = useRef(Date.now());
  const answersRef = useRef<UserAnswer[]>([]);
  const xpRef = useRef(0);
  const bestComboRef = useRef(0);
  const gradedRef = useRef(0);
  const finishedRef = useRef(false);
  const lockRef = useRef(false);
  const aliveRef = useRef(true);
  // el denominador queda fijado al tamaño real de la cola inicial;
  // las reinserciones por fallo no lo inflan
  const totalPlannedRef = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const card = queue[position];
  if (totalPlannedRef.current === 0 && queue.length > 0) totalPlannedRef.current = queue.length;
  const totalPlanned = Math.max(1, totalPlannedRef.current);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete({
      answers: answersRef.current,
      totalTimeMs: Date.now() - startedAtRef.current,
      xpEarned: xpRef.current,
      bestCombo: bestComboRef.current,
      decks,
      amount,
    });
  }, [amount, decks, onComplete]);

  const grade = useCallback((knewIt: boolean) => {
    if (!card || !flipped || finishedRef.current || showExit || lockRef.current) return;
    lockRef.current = true;
    const now = Date.now();
    gradeCard(card.id, knewIt ? 'good' : 'fail');
    registerOperation();
    gradedRef.current += 1;

    answersRef.current = [...answersRef.current, {
      exerciseId: card.id,
      category: 'multiplication',
      prompt: card.front,
      input: knewIt ? 'La sabía' : 'No la sabía',
      correctAnswer: card.back,
      isCorrect: knewIt,
      answeredAtMs: now - startedAtRef.current,
      responseTimeMs: now - cardShownAtRef.current,
      trainer: 'math',
      topic: 'Flash Cards',
      microtopic: card.deckId,
      questionType: 'calculo',
      errorType: knewIt ? 'ninguno' : 'calculo',
    }];

    let nextQueue = queue;
    if (knewIt) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setComboFlare(true);
      window.setTimeout(() => setComboFlare(false), 340);
      xpRef.current += computeXp({
        isCorrect: true,
        level: 'level2',
        responseTimeMs: now - cardShownAtRef.current,
        targetTimeMs: 6000,
        comboAfterAnswer: nextCombo,
      });
      playCorrect(nextCombo);
    } else {
      setCombo(0);
      playIncorrect();
      // reinserción intra-sesión: la carta fallada vuelve ~3 posiciones después
      if (queue.length < amount * 2) {
        nextQueue = [...queue];
        const reinsertAt = Math.min(nextQueue.length, position + 1 + REINSERT_OFFSET);
        nextQueue.splice(reinsertAt, 0, card);
        setQueue(nextQueue);
      }
    }

    const isLast = position + 1 >= nextQueue.length;
    window.setTimeout(() => {
      if (!aliveRef.current) return;
      lockRef.current = false;
      if (isLast) {
        finish();
      } else {
        setPosition((value) => value + 1);
        setFlipped(false);
        cardShownAtRef.current = Date.now();
      }
    }, 260);
  }, [amount, card, combo, finish, flipped, position, queue, showExit]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showExit || event.repeat) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExit(true);
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!flipped) setFlipped(true);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'k' || event.key === 'ArrowRight') grade(true);
      if (key === 'j' || event.key === 'ArrowLeft') grade(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, grade, showExit]);

  if (!card) {
    return (
      <div className="tm-screen grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="tm-display text-2xl font-bold">No hay tarjetas pendientes en estos mazos.</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--tm-fg-muted)' }}>La repetición espaciada hizo su trabajo: vuelve mañana.</p>
          <button type="button" className="tm-btn-cta tm-press mt-6 px-6 py-3 text-sm" onClick={onExit}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  const progress = (gradedRef.current / totalPlanned) * 100;

  return (
    <div className="tm-screen relative flex min-h-screen flex-col px-5 pb-8 pt-14">
      <ProgressTopBar progress={progress} />

      <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex items-center justify-center">
        <ComboPill combo={combo} flare={comboFlare} />
      </div>

      <button
        type="button"
        className="tm-btn-ghost fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center"
        style={{ padding: 0 }}
        aria-label="Salir de flash cards"
        onClick={() => setShowExit(true)}
      >
        <X size={17} />
      </button>

      <p className="fixed right-5 top-4 z-40 text-sm font-bold" style={{ color: 'var(--tm-fg-muted)' }}>
        {Math.min(gradedRef.current + 1, totalPlanned)} / {totalPlanned}
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {/* stack: cartas fantasma detrás */}
        <div className="tm-flip-scene relative w-full max-w-xl">
          {queue.length > position + 2 && (
            <div className="tm-card-solid absolute inset-x-4 top-4 h-full opacity-20" aria-hidden="true" style={{ transform: 'translateY(16px) scale(0.94)' }} />
          )}
          {queue.length > position + 1 && (
            <div className="tm-card-solid absolute inset-x-2 top-2 h-full opacity-45" aria-hidden="true" style={{ transform: 'translateY(8px) scale(0.97)' }} />
          )}
          <div key={card.id + String(position)} className="tm-card-deal relative">
            <div className="tm-flip relative min-h-[300px] sm:min-h-[340px]" data-flipped={flipped ? 'true' : 'false'}>
              <div className="tm-flip-face tm-card-solid p-8">
                <div className="text-center">
                  <p className="tm-eyebrow">{deckLabel(card.deckId)}</p>
                  <p className="tm-display mt-4 text-5xl font-bold sm:text-6xl" style={{ color: 'var(--tm-fg)' }}>{card.front}</p>
                  {card.hint && <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{card.hint}</p>}
                </div>
              </div>
              <div className="tm-flip-face tm-flip-back tm-card-solid p-8" style={{ borderColor: 'var(--tm-blue)' }}>
                <div className="text-center">
                  <p className="tm-eyebrow">{card.front}</p>
                  <p className="tm-display mt-4 text-6xl font-bold sm:text-7xl" style={{ color: 'var(--tm-blue)' }}>{card.back}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!flipped ? (
          <button type="button" className="tm-btn-cta tm-press inline-flex items-center gap-2 px-7 py-4 text-sm font-extrabold" onClick={() => setFlipped(true)}>
            <Eye size={17} /> Ver respuesta
            <Keycap label="Espacio" />
          </button>
        ) : (
          <div className="grid w-full max-w-xl grid-cols-2 gap-3">
            <button
              type="button"
              className="tm-choice flex min-h-[72px] items-center justify-center gap-3 px-5 py-4 text-base font-extrabold"
              style={{ color: 'var(--tm-bad)' }}
              onClick={() => grade(false)}
            >
              <XIcon size={18} /> No la sabía <Keycap label="J" />
            </button>
            <button
              type="button"
              className="tm-choice flex min-h-[72px] items-center justify-center gap-3 px-5 py-4 text-base font-extrabold"
              style={{ color: 'var(--tm-good)' }}
              onClick={() => grade(true)}
            >
              <Check size={18} /> La sabía <Keycap label="K" />
            </button>
          </div>
        )}

        <p className="hidden text-xs font-semibold sm:block" style={{ color: 'var(--tm-fg-muted)' }}>
          Espacio voltea — J no la sabía — K la sabía — Esc salir
        </p>
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={() => setShowExit(false)} />}
    </div>
  );
}

const deckLabel = (deckId: FlashDeckId) => {
  const labels: Record<FlashDeckId, string> = {
    tablasExtendidas: 'Tablas 12–19',
    cuadrados: 'Cuadrados',
    cubos: 'Cubos',
    fraccionPorcentaje: 'Fracción ↔ %',
    potenciasDe2: 'Potencias de 2',
    complementos100: 'Complemento a 100',
    complementos1000: 'Complemento a 1000',
    doblesMitades: 'Dobles y mitades',
  };
  return labels[deckId];
};
