import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SessionLadder } from '../../../lib/ladder';
import { computeXp, getComboTier, getTargetTimeMs, isComboMilestone, registerOperation } from '../../../lib/gameSystem';
import { playComboMilestone, playCorrect, playCountdownTick, playIncorrect } from '../../../lib/soundEngine';
import type { AnswerChoice, BlitzConfig, ChoiceKey, Exercise, UserAnswer } from '../../../types';
import { ChoiceGrid, ComboPill, ExitConfirm, ProgressTopBar } from '../components/ui';

export interface BlitzResult {
  answers: UserAnswer[];
  totalTimeMs: number;
  xpEarned: number;
  bestCombo: number;
  ladderSummary: { avgRung: number; peakRung: number; endRung: number };
}

const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];
const CORRECT_ADVANCE_MS = 260;
const WRONG_ADVANCE_MS = 750;

export default function BlitzScreen({
  config,
  onComplete,
  onExit,
}: {
  config: BlitzConfig;
  onComplete: (result: BlitzResult) => void;
  onExit: () => void;
}) {
  const durationMs = config.durationSec * 1000;
  const ladderRef = useRef<SessionLadder | null>(null);
  const [exercise, setExercise] = useState<Exercise>(() => {
    const ladder = new SessionLadder({ level: config.level, topics: config.topics?.length ? config.topics : [config.category] });
    ladderRef.current = ladder;
    return ladder.next();
  });
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [pressedKey, setPressedKey] = useState<ChoiceKey | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboFlare, setComboFlare] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const startedAtRef = useRef(Date.now());
  const questionStartedAtRef = useRef(Date.now());
  const answersRef = useRef<UserAnswer[]>([]);
  const xpRef = useRef(0);
  const bestComboRef = useRef(0);
  const finishedRef = useRef(false);
  const aliveRef = useRef(true);
  const lastTickSecondRef = useRef(-1);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const ladder = ladderRef.current;
    if (ladder) ladder.persist();
    onComplete({
      answers: answersRef.current,
      totalTimeMs: durationMs,
      xpEarned: xpRef.current,
      bestCombo: bestComboRef.current,
      ladderSummary: ladder?.summary() ?? { avgRung: 3, peakRung: 3, endRung: 3 },
    });
  }, [durationMs, onComplete]);

  /* ---------- cronómetro: el reloj ES la tarea (sin pausa: salir pierde la corrida) ---------- */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);
      const second = Math.ceil(remaining / 1000);
      // ticks sonoros en los últimos 5 segundos
      if (remaining <= 5000 && second !== lastTickSecondRef.current) {
        lastTickSecondRef.current = second;
        playCountdownTick(second <= 1);
      }
      if (remaining <= 0) finish();
    }, 100);
    return () => window.clearInterval(timer);
  }, [durationMs, finish]);

  const submitChoice = useCallback((choice: AnswerChoice) => {
    if (isLocked || finishedRef.current || showExit) return;
    const now = Date.now();
    const responseTimeMs = now - questionStartedAtRef.current;
    const isCorrect = choice.isCorrect;

    const answer: UserAnswer = {
      exerciseId: exercise.id,
      category: exercise.category,
      prompt: exercise.prompt,
      input: `${choice.key}: ${choice.label}`,
      correctAnswer: exercise.answerLabel,
      isCorrect,
      answeredAtMs: now - startedAtRef.current,
      responseTimeMs,
      trainer: 'math',
      topic: exercise.topic,
      microtopic: exercise.microtopic,
      questionType: 'calculo',
      explanation: exercise.explanation,
      errorType: isCorrect ? 'ninguno' : exercise.expectedError || 'calculo',
    };
    answersRef.current = [...answersRef.current, answer];
    setAnswers(answersRef.current);
    setSelectedKey(choice.key);
    setIsLocked(true);
    registerOperation();

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setComboFlare(true);
      window.setTimeout(() => setComboFlare(false), 340);
      xpRef.current += computeXp({
        isCorrect,
        level: config.level,
        responseTimeMs,
        targetTimeMs: getTargetTimeMs(config.level, 'blitz'),
        comboAfterAnswer: nextCombo,
      });
      if (isComboMilestone(nextCombo)) playComboMilestone();
      else playCorrect(getComboTier(nextCombo).tier * 2);
    } else {
      setCombo(0);
      playIncorrect();
    }

    ladderRef.current?.report({ isCorrect, responseTimeMs });

    window.setTimeout(() => {
      if (!aliveRef.current || finishedRef.current) return;
      const ladder = ladderRef.current;
      if (ladder) setExercise(ladder.next());
      setSelectedKey(null);
      setIsLocked(false);
      questionStartedAtRef.current = Date.now();
    }, isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS);
  }, [combo, config.level, exercise, isLocked, showExit]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showExit || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExit(true);
        return;
      }
      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeys.includes(key) || isLocked) return;
      setPressedKey(key);
      window.setTimeout(() => setPressedKey(null), 140);
      const choice = exercise.choices.find((item) => item.key === key);
      if (choice) submitChoice(choice);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [exercise.choices, isLocked, showExit, submitChoice]);

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const elapsedPct = ((durationMs - remainingMs) / durationMs) * 100;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isFinalStretch = remainingMs <= 10000;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  const isLong = exercise.prompt.length > 40;

  return (
    <div className="tm-screen relative flex min-h-screen flex-col px-5 pb-8 pt-16">
      <ProgressTopBar progress={elapsedPct} hot={isFinalStretch} />

      {/* el tiempo restante es el protagonista del HUD en Contrarreloj */}
      <div className="fixed inset-x-0 top-3 z-40 flex items-center justify-center">
        <p
          className="tm-display text-3xl font-bold"
          style={{ color: isFinalStretch ? 'var(--tm-accent)' : 'var(--tm-fg)', fontVariantNumeric: 'tabular-nums' }}
          aria-live={isFinalStretch ? 'assertive' : 'off'}
        >
          {minutes}:{seconds}
        </p>
      </div>

      <button
        type="button"
        className="tm-btn-ghost fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center"
        style={{ padding: 0 }}
        aria-label="Salir del contrarreloj"
        onClick={() => setShowExit(true)}
      >
        <X size={17} />
      </button>

      <div className="fixed right-5 top-4 z-40 text-right">
        <p className="tm-display text-xl font-bold" style={{ color: 'var(--tm-good)' }}>{correctCount}</p>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em]" style={{ color: 'var(--tm-fg-muted)' }}>aciertos</p>
      </div>

      <div className="pointer-events-none fixed left-5 top-16 z-40 sm:top-4">
        <ComboPill combo={combo} flare={comboFlare} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 sm:gap-14">
        <div key={exercise.id} className="tm-big-number w-full text-center">
          <div
            className={`tm-display mx-auto max-w-3xl whitespace-pre-line font-bold ${isLong ? 'tm-prompt-long' : 'tm-prompt'}`}
            style={{ color: 'var(--tm-fg)' }}
          >
            {exercise.prompt}
          </div>
        </div>

        <ChoiceGrid
          choices={exercise.choices}
          selectedKey={selectedKey}
          isLocked={isLocked}
          pressedKey={pressedKey}
          onSelect={submitChoice}
        />

        <p className="hidden text-xs font-semibold sm:block" style={{ color: 'var(--tm-fg-muted)' }}>
          A · B · C · D responden — Esc salir
        </p>
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={() => setShowExit(false)} />}
    </div>
  );
}
