import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { digitSpanChoices } from '../../../lib/distractors';
import { computeXp, registerOperation } from '../../../lib/gameSystem';
import { playCorrect, playFlashTick, playIncorrect } from '../../../lib/soundEngine';
import { rand } from '../../../lib/random';
import type { AnswerChoice, ChoiceKey, DigitSpanConfig, UserAnswer } from '../../../types';
import { ChoiceGrid, ComboPill, ExitConfirm, ProgressTopBar, SessionClock } from '../components/ui';

export interface DigitSpanResult {
  answers: UserAnswer[];
  totalTimeMs: number;
  xpEarned: number;
  bestCombo: number;
  spanHistory: number[];
}

type Phase = 'show' | 'blank' | 'answer' | 'feedback';

const SPAN_KEY = 'trainermath-v3:digitspan';
const SHOW_MS = 1200;
const BLANK_MS = 260;
const MIN_SPAN = 3;
const MAX_SPAN = 12;
const choiceKeysList: ChoiceKey[] = ['A', 'B', 'C', 'D'];

const readStoredSpan = (): number => {
  try {
    const stored = Number(localStorage.getItem(SPAN_KEY));
    return Number.isInteger(stored) && stored >= MIN_SPAN && stored <= MAX_SPAN ? stored : 4;
  } catch {
    return 4;
  }
};

const writeStoredSpan = (span: number) => {
  try {
    localStorage.setItem(SPAN_KEY, String(span));
  } catch {
    // localStorage puede fallar en contextos restringidos.
  }
};

const generateNumber = (digits: number) => rand(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);

export default function DigitSpanScreen({
  config,
  onComplete,
  onExit,
}: {
  config: DigitSpanConfig;
  onComplete: (result: DigitSpanResult) => void;
  onExit: () => void;
}) {
  const rounds = Math.max(1, config.rounds);
  const [span, setSpan] = useState(() => config.startDigits ?? readStoredSpan());
  const [round, setRound] = useState(0);
  const [value, setValue] = useState(() => generateNumber(config.startDigits ?? readStoredSpan()));
  const [choices, setChoices] = useState<AnswerChoice[]>([]);
  const [phase, setPhase] = useState<Phase>('show');
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [pressedKey, setPressedKey] = useState<ChoiceKey | null>(null);
  const [combo, setCombo] = useState(0);
  const [comboFlare, setComboFlare] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const startedAtRef = useRef(Date.now());
  const answerStartedAtRef = useRef(Date.now());
  const answersRef = useRef<UserAnswer[]>([]);
  const spanHistoryRef = useRef<number[]>([]);
  const correctStreakRef = useRef(0);
  const xpRef = useRef(0);
  const bestComboRef = useRef(0);
  const finishedRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* ---------- exposición ---------- */
  useEffect(() => {
    if (phase !== 'show' || showExit) return;
    playFlashTick();
    const timeout = window.setTimeout(() => setPhase('blank'), SHOW_MS);
    return () => window.clearTimeout(timeout);
  }, [phase, round, showExit]);

  useEffect(() => {
    if (phase !== 'blank' || showExit) return;
    const timeout = window.setTimeout(() => {
      setChoices(digitSpanChoices(value));
      answerStartedAtRef.current = Date.now();
      setPhase('answer');
    }, BLANK_MS);
    return () => window.clearTimeout(timeout);
  }, [phase, showExit, value]);

  const submitChoice = useCallback((choice: AnswerChoice) => {
    if (phase !== 'answer' || finishedRef.current || showExit) return;
    const now = Date.now();
    const isCorrect = choice.isCorrect;
    spanHistoryRef.current = [...spanHistoryRef.current, span];

    answersRef.current = [...answersRef.current, {
      exerciseId: `span-${round + 1}`,
      category: 'series',
      prompt: `Memoriza ${span} dígitos`,
      input: `${choice.key}: ${choice.label}`,
      correctAnswer: String(value),
      isCorrect,
      answeredAtMs: now - startedAtRef.current,
      responseTimeMs: now - answerStartedAtRef.current,
      trainer: 'math',
      topic: 'Memoria de Dígitos',
      microtopic: `${span} dígitos`,
      questionType: 'calculo',
      errorType: isCorrect ? 'ninguno' : 'calculo',
    }];
    setSelectedKey(choice.key);
    setPhase('feedback');
    registerOperation();

    let nextSpan = span;
    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setComboFlare(true);
      window.setTimeout(() => setComboFlare(false), 340);
      correctStreakRef.current += 1;
      if (correctStreakRef.current >= 2) {
        correctStreakRef.current = 0;
        nextSpan = Math.min(MAX_SPAN, span + 1);
      }
      xpRef.current += computeXp({
        isCorrect,
        level: span >= 8 ? 'level5' : span >= 6 ? 'level4' : span >= 5 ? 'level3' : 'level2',
        responseTimeMs: now - answerStartedAtRef.current,
        targetTimeMs: 5000,
        comboAfterAnswer: nextCombo,
      });
      playCorrect(nextCombo);
    } else {
      setCombo(0);
      correctStreakRef.current = 0;
      nextSpan = Math.max(MIN_SPAN, span - 1);
      playIncorrect();
    }

    const isLast = round + 1 >= rounds;
    window.setTimeout(() => {
      if (!aliveRef.current || finishedRef.current) return;
      if (isLast) {
        finishedRef.current = true;
        writeStoredSpan(nextSpan);
        onComplete({
          answers: answersRef.current,
          totalTimeMs: Date.now() - startedAtRef.current,
          xpEarned: xpRef.current,
          bestCombo: bestComboRef.current,
          spanHistory: spanHistoryRef.current,
        });
        return;
      }
      setSpan(nextSpan);
      setValue(generateNumber(nextSpan));
      setRound((current) => current + 1);
      setSelectedKey(null);
      setPhase('show');
    }, isCorrect ? 600 : 1000);
  }, [combo, onComplete, phase, round, rounds, showExit, span, value]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (showExit || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExit(true);
        return;
      }
      if (phase !== 'answer') return;
      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeysList.includes(key)) return;
      setPressedKey(key);
      window.setTimeout(() => setPressedKey(null), 140);
      const choice = choices.find((item) => item.key === key);
      if (choice) submitChoice(choice);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [choices, phase, showExit, submitChoice]);

  const lastAnswer = answersRef.current[answersRef.current.length - 1];
  const progress = ((round + (phase === 'feedback' ? 1 : 0)) / rounds) * 100;

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
        aria-label="Salir del entrenamiento"
        onClick={() => setShowExit(true)}
      >
        <X size={17} />
      </button>

      <p className="fixed right-5 top-4 z-40 text-sm font-bold" style={{ color: 'var(--tm-fg-muted)' }}>
        {span} dígitos · {Math.min(round + 1, rounds)} / {rounds}
        <span className="ml-2 opacity-80"><SessionClock startedAt={startedAtRef.current} /></span>
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {phase === 'show' && !showExit && (
          <div key={`${round}-${value}`} className="tm-anzan-term tm-display text-center font-bold" style={{ color: 'var(--tm-fg)', fontSize: `clamp(3rem, ${Math.max(8, 20 - span)}vw, 9rem)`, letterSpacing: '0.06em' }}>
            {value}
          </div>
        )}

        {phase === 'blank' && <div className="tm-anzan-size" aria-hidden="true">&nbsp;</div>}

        {(phase === 'answer' || phase === 'feedback') && (
          <>
            <p className="tm-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--tm-fg)' }}>¿Cuál era el número?</p>
            {phase === 'feedback' && lastAnswer && !lastAnswer.isCorrect && (
              <p className="text-base font-bold" style={{ color: 'var(--tm-good)' }} aria-live="polite">
                Era: {value}
              </p>
            )}
            <ChoiceGrid
              choices={choices}
              selectedKey={selectedKey}
              isLocked={phase !== 'answer'}
              pressedKey={pressedKey}
              onSelect={submitChoice}
            />
          </>
        )}
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={() => setShowExit(false)} />}
    </div>
  );
}
