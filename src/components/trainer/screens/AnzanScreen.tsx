import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { generateFlashAnzanExercise } from '../../../lib/exerciseGenerator';
import { computeXp, isComboMilestone, registerOperation } from '../../../lib/gameSystem';
import { playComboMilestone, playCorrect, playCountdownTick, playFlashTick, playIncorrect } from '../../../lib/soundEngine';
import type { AnswerChoice, AnzanConfig, AnzanExercise, ChoiceKey, UserAnswer } from '../../../types';
import { ChoiceGrid, ComboPill, ExitConfirm, ProgressTopBar, SessionClock } from '../components/ui';

export interface AnzanResult {
  answers: UserAnswer[];
  totalTimeMs: number;
  xpEarned: number;
  bestCombo: number;
  roundSnapshots: Array<Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs'>>;
}

type Phase = 'countdown' | 'sequence' | 'gap' | 'hold' | 'answer' | 'feedback' | 'interround';

const choiceKeysList: ChoiceKey[] = ['A', 'B', 'C', 'D'];
const GAP_MS = 90;
const HOLD_MS = 420;

export default function AnzanScreen({
  config,
  onComplete,
  onExit,
}: {
  config: AnzanConfig;
  onComplete: (result: AnzanResult) => void;
  onExit: () => void;
}) {
  const rounds = Math.max(1, config.rounds ?? 1);
  const progression = config.progression ?? 'speed';
  // Límite de legibilidad humana por cantidad de dígitos.
  // floor = hasta dónde ACELERA al acertar (nunca por encima de la base que eligió el usuario).
  // ceil  = hasta dónde ALIVIA al fallar (puede subir por encima de la base hasta lo legible).
  // Esto corrige la inversión: antes, con base < legible, acertar ralentizaba y fallar aceleraba.
  const legibleMs = Math.max(400, config.digits * 150);
  const floorMs = Math.min(config.displayMs, legibleMs);
  const ceilMs = Math.max(config.displayMs, legibleMs);

  const [round, setRound] = useState(0);
  const [displayMs, setDisplayMs] = useState(config.displayMs);
  const [exercise, setExercise] = useState<AnzanExercise>(() => generateFlashAnzanExercise(config));
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [termIndex, setTermIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [pressedKey, setPressedKey] = useState<ChoiceKey | null>(null);
  const [combo, setCombo] = useState(0);
  const [comboFlare, setComboFlare] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const startedAtRef = useRef(Date.now());
  const answerStartedAtRef = useRef(Date.now());
  const answersRef = useRef<UserAnswer[]>([]);
  const snapshotsRef = useRef<Array<Pick<AnzanConfig, 'digits' | 'terms' | 'displayMs'>>>([]);
  const xpRef = useRef(0);
  const bestComboRef = useRef(0);
  const displayMsRef = useRef(config.displayMs);
  const finishedRef = useRef(false);

  const isFirstRound = round === 0;
  const isLocked = phase !== 'answer';
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* ---------- countdown (pausa mientras el diálogo de salida esté abierto) ---------- */
  useEffect(() => {
    if (phase !== 'countdown' || showExit) return;
    const stepMs = isFirstRound ? 780 : 450;
    playCountdownTick(countdown === 1);
    const timeout = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown((value) => value - 1);
      } else {
        snapshotsRef.current.push({ digits: config.digits, terms: config.terms, displayMs: displayMsRef.current });
        setTermIndex(0);
        setPhase('sequence');
      }
    }, stepMs);
    return () => window.clearTimeout(timeout);
  }, [config.digits, config.terms, countdown, isFirstRound, phase, showExit]);

  /* ---------- secuencia temporizada con gap-flash ---------- */
  useEffect(() => {
    if (phase !== 'sequence' || config.advanceMode !== 'timed' || showExit) return;
    playFlashTick();
    const timeout = window.setTimeout(() => setPhase('gap'), displayMs);
    return () => window.clearTimeout(timeout);
  }, [config.advanceMode, displayMs, phase, showExit, termIndex]);

  useEffect(() => {
    if (phase !== 'gap' || showExit) return;
    // gap proporcional a la exposición (~22%): a alta velocidad separa mejor los términos
    const gapMs = Math.max(GAP_MS, Math.round(displayMs * 0.22));
    const timeout = window.setTimeout(() => {
      if (termIndex + 1 >= exercise.terms.length) {
        setPhase('hold');
      } else {
        setTermIndex((value) => value + 1);
        setPhase('sequence');
      }
    }, gapMs);
    return () => window.clearTimeout(timeout);
  }, [displayMs, exercise.terms.length, phase, showExit, termIndex]);

  useEffect(() => {
    if (phase !== 'hold' || showExit) return;
    const timeout = window.setTimeout(() => {
      answerStartedAtRef.current = Date.now();
      setPhase('answer');
    }, HOLD_MS);
    return () => window.clearTimeout(timeout);
  }, [phase, showExit]);

  /* ---------- reinicio limpio de la ronda en curso ----------
     Si la secuencia se interrumpe (diálogo de salida o pestaña oculta), la memoria
     del usuario ya está contaminada: se regenera el ejercicio y se relanza el
     countdown — nunca se re-flashea un término ya visto (doble conteo). */
  const restartRound = useCallback(() => {
    setExercise(generateFlashAnzanExercise({ ...config, displayMs: displayMsRef.current }));
    setTermIndex(0);
    setSelectedKey(null);
    setCountdown(3);
    setPhase('countdown');
  }, [config]);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const resumeFromPause = useCallback(() => {
    setShowExit(false);
    if (phaseRef.current === 'sequence' || phaseRef.current === 'gap' || phaseRef.current === 'hold') {
      restartRound();
    }
  }, [restartRound]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return;
      if (phaseRef.current === 'sequence' || phaseRef.current === 'gap' || phaseRef.current === 'hold') {
        restartRound();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [restartRound]);

  /* ---------- avance manual ---------- */
  const moveManual = useCallback((direction: 1 | -1) => {
    if (phase !== 'sequence' || config.advanceMode !== 'manual') return;
    setTermIndex((value) => {
      const next = value + direction;
      if (next < 0) return 0;
      if (next >= exercise.terms.length) {
        setPhase('hold');
        return value;
      }
      return next;
    });
  }, [config.advanceMode, exercise.terms.length, phase]);

  /* ---------- responder ---------- */
  const submitChoice = useCallback((choice: AnswerChoice) => {
    if (phase !== 'answer' || finishedRef.current || showExit) return;
    const now = Date.now();
    const isCorrect = choice.isCorrect;
    const answer: UserAnswer = {
      exerciseId: exercise.id,
      category: config.operationMode === 'additionSubtraction' ? 'subtraction' : 'addition',
      prompt: exercise.prompt,
      input: `${choice.key}: ${choice.label}`,
      correctAnswer: exercise.answerLabel,
      isCorrect,
      answeredAtMs: now - startedAtRef.current,
      responseTimeMs: now - answerStartedAtRef.current,
      trainer: 'math',
      topic: 'Flash Anzan',
      microtopic: `${config.terms} términos · ${config.digits} dígitos · ${displayMsRef.current} ms`,
      questionType: 'calculo',
      explanation: exercise.explanation,
      errorType: isCorrect ? 'ninguno' : 'calculo',
    };
    answersRef.current = [...answersRef.current, answer];
    setSelectedKey(choice.key);
    setPhase('feedback');
    registerOperation();

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setComboFlare(true);
      window.setTimeout(() => setComboFlare(false), 520);
      xpRef.current += computeXp({
        isCorrect,
        level: 'level3',
        responseTimeMs: answer.responseTimeMs,
        targetTimeMs: Math.max(2200, config.digits * config.terms * 390),
        comboAfterAnswer: nextCombo,
      });
      if (isComboMilestone(nextCombo)) playComboMilestone();
      else playCorrect(nextCombo);
      if (progression === 'speed' && config.advanceMode === 'timed') {
        displayMsRef.current = Math.max(floorMs, Math.round(displayMsRef.current * 0.92));
      }
    } else {
      setCombo(0);
      playIncorrect();
      if (progression === 'speed' && config.advanceMode === 'timed') {
        // al fallar se alivia el ritmo dos pasos, hasta el techo legible (nunca de vuelta a una base ilegible)
        displayMsRef.current = Math.min(ceilMs, Math.round(displayMsRef.current / (0.92 * 0.92)));
      }
    }

    const isLastRound = round + 1 >= rounds;
    window.setTimeout(() => {
      if (!aliveRef.current || finishedRef.current) return;
      if (isLastRound) {
        finishedRef.current = true;
        onComplete({
          answers: answersRef.current,
          totalTimeMs: Date.now() - startedAtRef.current,
          xpEarned: xpRef.current,
          bestCombo: bestComboRef.current,
          roundSnapshots: snapshotsRef.current,
        });
      } else {
        setPhase('interround');
      }
    }, isCorrect ? 700 : 1100);
  }, [combo, config, exercise, floorMs, onComplete, phase, progression, round, rounds, showExit]);

  /* ---------- inter-ronda ---------- */
  useEffect(() => {
    if (phase !== 'interround' || showExit) return;
    const timeout = window.setTimeout(() => {
      setRound((value) => value + 1);
      setDisplayMs(displayMsRef.current);
      setExercise(generateFlashAnzanExercise({ ...config, displayMs: displayMsRef.current }));
      setSelectedKey(null);
      setCountdown(3);
      setPhase('countdown');
    }, 950);
    return () => window.clearTimeout(timeout);
  }, [config, phase, showExit]);

  /* ---------- teclado ---------- */
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showExit || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExit(true);
        return;
      }
      if (config.advanceMode === 'manual' && phase === 'sequence') {
        if (event.key === 'ArrowRight') moveManual(1);
        if (event.key === 'ArrowLeft') moveManual(-1);
        return;
      }
      if (phase !== 'answer') return;
      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeysList.includes(key)) return;
      setPressedKey(key);
      window.setTimeout(() => setPressedKey(null), 140);
      const choice = exercise.choices.find((item) => item.key === key);
      if (choice) submitChoice(choice);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [config.advanceMode, exercise.choices, moveManual, phase, showExit, submitChoice]);

  const term = exercise.terms[termIndex];
  const sequenceProgress = phase === 'answer' || phase === 'feedback'
    ? 100
    : ((termIndex + 1) / exercise.terms.length) * 100;
  const roundProgress = ((round + (phase === 'feedback' || phase === 'interround' ? 1 : 0)) / rounds) * 100;
  const lastAnswer = answersRef.current[answersRef.current.length - 1];
  // durante la secuencia el rail marca el ritmo término a término (ancla visual);
  // fuera de ella, el avance de rondas
  const inSequence = phase === 'sequence' || phase === 'gap' || phase === 'hold';
  const barProgress = inSequence || rounds <= 1 ? sequenceProgress : roundProgress;

  return (
    <div className="tm-screen relative flex min-h-screen flex-col px-5 pb-8 pt-14">
      <ProgressTopBar progress={barProgress} />

      {(phase === 'feedback' || phase === 'interround') && lastAnswer && (
        <div key={answersRef.current.length} className="tm-burst" data-kind={lastAnswer.isCorrect ? 'correct' : 'wrong'} aria-hidden="true" />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex items-center justify-center">
        <ComboPill combo={combo} flare={comboFlare} />
      </div>

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
        {rounds > 1 ? `Ronda ${Math.min(round + 1, rounds)} / ${rounds}` : 'Flash Anzan'}
        <span className="ml-2 opacity-80"><SessionClock startedAt={startedAtRef.current} /></span>
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {phase === 'countdown' && (
          <div key={`${round}-${countdown}`} className="tm-countdown tm-display tm-countdown-size font-bold" style={{ color: 'var(--tm-fg)' }}>
            {countdown}
          </div>
        )}

        {(phase === 'sequence' || phase === 'gap') && (
          <>
            {phase === 'sequence' && term && !showExit ? (
              <div
                key={term.id}
                className="tm-anzan-term tm-display tm-anzan-size text-center font-bold"
                style={{
                  color: term.signedValue < 0 ? 'var(--tm-bad)' : 'var(--tm-fg)',
                  // la animación de entrada nunca consume más del 25% del tiempo visible
                  animationDuration: `${Math.min(120, Math.round(displayMs * 0.25))}ms`,
                }}
              >
                {term.signedValue < 0 ? `−${term.value}` : config.operationMode === 'additionSubtraction' ? `+${term.value}` : term.value}
              </div>
            ) : (
              <div className="tm-anzan-size" aria-hidden="true">&nbsp;</div>
            )}
            {config.advanceMode === 'manual' && phase === 'sequence' && (
              <div className="flex gap-3">
                <button type="button" className="tm-btn-ghost tm-press inline-flex items-center gap-2 px-5 py-3 text-sm" onClick={() => moveManual(-1)}>
                  <ArrowLeft size={16} /> Anterior
                </button>
                <button type="button" className="tm-btn-cta tm-press inline-flex items-center gap-2 px-5 py-3 text-sm" onClick={() => moveManual(1)}>
                  Siguiente <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'hold' && (
          <div className="tm-display tm-anzan-size font-bold" style={{ color: 'var(--tm-fg-muted)' }}>?</div>
        )}

        {(phase === 'answer' || phase === 'feedback') && (
          <>
            <p className="tm-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--tm-fg)' }}>¿Cuál fue el total?</p>
            {phase === 'feedback' && lastAnswer && !lastAnswer.isCorrect && (
              <div aria-live="polite" className="text-center">
                <p className="text-base font-bold" style={{ color: 'var(--tm-good)' }}>
                  Correcta: {exercise.answerLabel}
                </p>
                {/* el rastro completo hace verificable la ronda: convierte la duda en dato */}
                <p className="tm-display mt-1 text-sm font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>
                  {exercise.prompt} = {exercise.answerLabel}
                </p>
              </div>
            )}
            <ChoiceGrid
              choices={exercise.choices}
              selectedKey={selectedKey}
              isLocked={isLocked}
              pressedKey={pressedKey}
              onSelect={submitChoice}
              stagger
            />
          </>
        )}

        {phase === 'interround' && lastAnswer && (
          <div className="tm-screen text-center">
            <p className="tm-display text-3xl font-bold" style={{ color: lastAnswer.isCorrect ? 'var(--tm-good)' : 'var(--tm-bad)' }}>
              {lastAnswer.isCorrect ? 'Correcto' : 'Fallada'}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>
              Ronda {round + 2} / {rounds}
            </p>
            {progression === 'speed' && config.advanceMode === 'timed' && (
              <p className="mt-1 text-sm font-bold" style={{ color: displayMsRef.current < config.displayMs ? 'var(--tm-blue)' : 'var(--tm-fg-muted)' }}>
                {displayMsRef.current < config.displayMs ? 'Velocidad ↑ · ' : ''}aparición {displayMsRef.current} ms
              </p>
            )}
          </div>
        )}
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={resumeFromPause} />}
    </div>
  );
}
