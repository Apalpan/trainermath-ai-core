import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { generateCepreExercises } from '../../../lib/cepreGenerator';
import { generateExercises } from '../../../lib/exerciseGenerator';
import { SessionLadder } from '../../../lib/ladder';
import { generateMultiplicationExercises } from '../../../lib/multiplicationGenerator';
import { computeXp, getComboTier, getTargetTimeMs, isComboMilestone, registerOperation, BREATHER_AFTER_FAILS } from '../../../lib/gameSystem';
import { playComboMilestone, playCorrect, playIncorrect } from '../../../lib/soundEngine';
import { formatDuration } from '../../../lib/scoring';
import type {
  AnswerChoice,
  CepreConfig,
  ChoiceKey,
  Exercise,
  MultiplicationConfig,
  TrainingConfig,
  UserAnswer,
} from '../../../types';
import { ChoiceGrid, ComboPill, ExitConfirm, ProgressTopBar, SessionClock } from '../components/ui';

export interface ArenaResult {
  answers: UserAnswer[];
  totalTimeMs: number;
  xpEarned: number;
  bestCombo: number;
  ladderSummary?: { avgRung: number; peakRung: number; endRung: number };
}

type ArenaDrill = 'operations' | 'multiplicationSprint' | 'cepreExam';
type ArenaConfig = TrainingConfig | MultiplicationConfig | CepreConfig;

const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

const CORRECT_ADVANCE_MS = 320;
const WRONG_ADVANCE_MS = 850;

export default function ArenaScreen({
  drill,
  config,
  onComplete,
  onExit,
}: {
  drill: ArenaDrill;
  config: ArenaConfig;
  onComplete: (result: ArenaResult) => void;
  onExit: () => void;
}) {
  const ladderRef = useRef<SessionLadder | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    if (drill === 'multiplicationSprint') return generateMultiplicationExercises(config as MultiplicationConfig);
    if (drill === 'cepreExam') return generateCepreExercises(config as CepreConfig);
    const opsConfig = config as TrainingConfig;
    const ladder = new SessionLadder({ level: opsConfig.level, topics: opsConfig.topics?.length ? opsConfig.topics : [opsConfig.category] });
    ladderRef.current = ladder;
    return [ladder.next()];
  });
  const total = config.amount;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedKey, setSelectedKey] = useState<ChoiceKey | null>(null);
  const [pressedKey, setPressedKey] = useState<ChoiceKey | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboFlare, setComboFlare] = useState(false);
  const [showPeek, setShowPeek] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [breather, setBreather] = useState<string | null>(null);
  const [wrongInfo, setWrongInfo] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const startedAtRef = useRef(Date.now());
  const questionStartedAtRef = useRef(Date.now());
  const bestComboRef = useRef(0);
  const xpRef = useRef(0);
  const failsRef = useRef(0);
  const breatherShownRef = useRef(false);
  const finishedRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const currentExercise = exercises[index];
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const level = 'level' in config ? config.level : 'level2';

  const finish = useCallback((finalAnswers: UserAnswer[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const ladder = ladderRef.current;
    if (ladder) ladder.persist();
    onComplete({
      answers: finalAnswers,
      totalTimeMs: Date.now() - startedAtRef.current,
      xpEarned: xpRef.current,
      bestCombo: bestComboRef.current,
      ladderSummary: ladder?.summary(),
    });
  }, [onComplete]);

  const submitChoice = useCallback((choice: AnswerChoice) => {
    if (!currentExercise || isLocked || finishedRef.current || showExit) return;
    const now = Date.now();
    const responseTimeMs = now - questionStartedAtRef.current;
    const isCorrect = choice.isCorrect;

    const nextAnswer: UserAnswer = {
      exerciseId: currentExercise.id,
      category: currentExercise.category,
      prompt: currentExercise.prompt,
      input: `${choice.key}: ${choice.label}`,
      correctAnswer: currentExercise.answerLabel,
      isCorrect,
      answeredAtMs: now - startedAtRef.current,
      responseTimeMs,
      trainer: currentExercise.trainer || (drill === 'cepreExam' ? 'cepre' : 'math'),
      block: currentExercise.block,
      topic: currentExercise.topic,
      microtopic: currentExercise.microtopic,
      questionType: currentExercise.questionType,
      explanation: currentExercise.explanation,
      errorType: isCorrect ? 'ninguno' : currentExercise.expectedError || 'calculo',
    };
    const nextAnswers = [...answers, nextAnswer];
    setAnswers(nextAnswers);
    setSelectedKey(choice.key);
    setIsLocked(true);
    registerOperation();

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bestComboRef.current = Math.max(bestComboRef.current, nextCombo);
      setComboFlare(true);
      window.setTimeout(() => setComboFlare(false), 340);
      failsRef.current = 0;
      setBreather(null);
      setWrongInfo(null);
      setAnnounce('Correcto');
      const targetTimeMs = getTargetTimeMs(level, drill, currentExercise.targetTimeSec);
      xpRef.current += computeXp({ isCorrect, level, responseTimeMs, targetTimeMs, comboAfterAnswer: nextCombo });
      if (isComboMilestone(nextCombo)) playComboMilestone();
      else playCorrect(getComboTier(nextCombo).tier * 2);
    } else {
      setCombo(0);
      failsRef.current += 1;
      setWrongInfo(`Correcta: ${currentExercise.answerLabel}`);
      setAnnounce(`Incorrecto. Correcta: ${currentExercise.answerLabel}`);
      if (failsRef.current === BREATHER_AFTER_FAILS && !breatherShownRef.current) {
        breatherShownRef.current = true;
        setBreather('Ajustamos el ritmo. Respira — seguimos.');
      }
      playIncorrect();
    }

    ladderRef.current?.report({ isCorrect, responseTimeMs });

    const isLast = nextAnswers.length >= total;
    const delay = isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS;
    window.setTimeout(() => {
      if (!aliveRef.current) return;
      if (isLast) {
        finish(nextAnswers);
        return;
      }
      // generar fuera del updater: ladder.next() tiene efectos y StrictMode
      // doble-invoca los updaters de estado
      const ladder = ladderRef.current;
      const nextExercise = ladder ? ladder.next() : null;
      setExercises((current) => {
        if (nextExercise && current.length < total) return [...current, nextExercise];
        return current;
      });
      setIndex((value) => value + 1);
      setSelectedKey(null);
      setIsLocked(false);
      setWrongInfo(null);
      questionStartedAtRef.current = Date.now();
    }, delay);
  }, [answers, combo, currentExercise, drill, finish, isLocked, level, showExit, total]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showExit || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowExit(true);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        setShowPeek(true);
        return;
      }
      const key = event.key.toUpperCase() as ChoiceKey;
      if (!choiceKeys.includes(key) || isLocked || !currentExercise) return;
      setPressedKey(key);
      window.setTimeout(() => setPressedKey(null), 140);
      const choice = currentExercise.choices.find((item) => item.key === key);
      if (choice) submitChoice(choice);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') window.setTimeout(() => setShowPeek(false), 400);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentExercise, isLocked, showExit, submitChoice]);

  const progress = (answers.length / total) * 100;
  const tier = getComboTier(combo);
  const isLong = (currentExercise?.prompt.length ?? 0) > 40;
  const label = useMemo(() => {
    if (!currentExercise) return '';
    return currentExercise.topic || currentExercise.microtopic || '';
  }, [currentExercise]);

  if (!currentExercise) return null;

  return (
    <div className="tm-screen relative flex min-h-screen flex-col px-5 pb-8 pt-14">
      <ProgressTopBar progress={progress} hot={tier.tier >= 3} />

      {isLocked && answers.length > 0 && (
        <div key={answers.length} className="tm-burst" data-kind={answers[answers.length - 1].isCorrect ? 'correct' : 'wrong'} aria-hidden="true" />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex items-center justify-center">
        <ComboPill combo={combo} flare={comboFlare} />
      </div>

      <span className="sr-only" aria-live="polite">{announce}</span>

      <button
        type="button"
        className="tm-btn-ghost fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center"
        style={{ padding: 0 }}
        aria-label="Salir del entrenamiento"
        onClick={() => setShowExit(true)}
      >
        <X size={17} />
      </button>

      <p className="fixed right-5 top-4 z-40 text-sm font-bold" style={{ color: 'var(--tm-fg-muted)' }} aria-live="polite">
        {String(answers.length + (isLocked ? 0 : 1)).padStart(2, '0')} / {total}
        <span className="ml-2 opacity-80"><SessionClock startedAt={startedAtRef.current} /></span>
      </p>

      {showPeek && (
        <div className="tm-peek" role="status">
          <PeekItem label="Tiempo" value={formatDuration(Date.now() - startedAtRef.current)} />
          <PeekItem label="Aciertos" value={`${correctCount}/${answers.length}`} />
          <PeekItem label="Combo" value={`×${combo}`} />
          <PeekItem label="Tema" value={label || '—'} />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-10 sm:gap-14">
        <div key={currentExercise.id} className="tm-big-number w-full text-center">
          <div
            className={`tm-display mx-auto max-w-5xl whitespace-pre-line font-bold ${isLong ? 'tm-prompt-long' : 'tm-prompt'}`}
            style={{ color: 'var(--tm-fg)', textWrap: 'balance' as never }}
          >
            {currentExercise.prompt}
          </div>
          <div className="mt-3 min-h-6" aria-live="polite">
            {wrongInfo && (
              <p className="text-base font-bold" style={{ color: 'var(--tm-good)' }}>{wrongInfo}</p>
            )}
            {breather && !wrongInfo && (
              <p className="text-sm font-semibold" style={{ color: 'var(--tm-fg-muted)' }}>{breather}</p>
            )}
          </div>
        </div>

        <ChoiceGrid
          choices={currentExercise.choices}
          selectedKey={selectedKey}
          isLocked={isLocked}
          pressedKey={pressedKey}
          onSelect={submitChoice}
        />

        <p className="hidden text-xs font-semibold sm:block" style={{ color: 'var(--tm-fg-muted)' }}>
          A · B · C · D responden — Tab estadísticas — Esc salir
        </p>
      </div>

      {showExit && <ExitConfirm onConfirm={onExit} onCancel={() => setShowExit(false)} />}
    </div>
  );
}

function PeekItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="tm-eyebrow">{label}</p>
      <p className="tm-display text-sm font-bold" style={{ color: 'var(--tm-fg)' }}>{value}</p>
    </div>
  );
}
